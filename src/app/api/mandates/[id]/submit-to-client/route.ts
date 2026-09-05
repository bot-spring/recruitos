import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, ClientDecision } from "@prisma/client";
import { sendClientShortlistPresentationEmail } from "@/lib/email";
import crypto from "crypto";
import path from "path";

export const dynamic = "force-dynamic";

// POST /api/mandates/[id]/submit-to-client - Batch present screened candidates to client portal (CL-01, CL-03)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const mandateId = params.id;
    const body = await req.json().catch(() => ({}));
    const { candidateIds = [] } = body;

    // 1. Verify mandate
    const mandate = await prisma.jobMandate.findFirst({
      where: {
        id: mandateId,
        agencyId: session.user.agencyId,
      },
      include: {
        client: { include: { contacts: true } },
        contact: true,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    // 2. Ensure ClientPortalShare token exists
    let clientPortal = await prisma.clientPortalShare.findFirst({
      where: {
        mandateId: mandate.id,
        agencyId: session.user.agencyId,
        isActive: true,
      },
    });

    if (!clientPortal) {
      const portalToken = `cp_${crypto.randomBytes(12).toString("hex")}`;
      const primaryContact = mandate.contact || mandate.client.contacts[0];

      clientPortal = await prisma.clientPortalShare.create({
        data: {
          agencyId: session.user.agencyId,
          mandateId: mandate.id,
          contactId: primaryContact?.id || null,
          portalToken,
          clientContactName: primaryContact?.name || "Hiring Lead",
          clientContactEmail: primaryContact?.email || null,
          clientOrgName: mandate.client.name,
          feedbackSlaHours: 48,
          isActive: true,
        },
      });
    }

    // 3. Promote candidate submissions to SUBMITTED_TO_CLIENT
    const whereClause: any = {
      agencyId: session.user.agencyId,
      mandateId: mandate.id,
    };

    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      whereClause.candidateId = { in: candidateIds };
    }

    const updateResult = await prisma.candidateSubmission.updateMany({
      where: whereClause,
      data: {
        stage: SubmissionStage.SUBMITTED_TO_CLIENT,
        submittedToClientAt: new Date(),
        clientDecision: ClientDecision.PENDING_REVIEW,
      },
    });

    // 4. Fetch submitted candidate submissions for email dispatch & preview
    const submittedSubmissions = await prisma.candidateSubmission.findMany({
      where: whereClause,
      include: {
        candidate: true,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const portalUrl = `/portal/${clientPortal.portalToken}`;
    const shareableUrl = `${baseUrl}${portalUrl}`;

    // 5. Build candidate email dossiers with 19 fields & resume attachments
    const emailCandidates = submittedSubmissions.map((s) => ({
      fullName: s.candidate.fullName,
      email: s.candidate.email,
      phone: s.candidate.phone,
      currentCompany: s.candidate.currentCompany || "Confidential",
      designation: mandate.title,
      totalExpYears: s.candidate.totalExpYears,
      relevantExpYears: s.relevantExpYears,
      qualification: s.candidate.qualification || "Graduate / Professional Degree",
      currentSalary: s.currentSalary || (s.candidate.currentCtc ? `${s.candidate.currentCtc} LPA` : "Confidential"),
      expectedSalary: s.expectedSalary || (s.candidate.expectedCtc ? `${s.candidate.expectedCtc} LPA` : "Negotiable"),
      noticePeriod: s.noticePeriod || (s.candidate.noticePeriodDays ? `${s.candidate.noticePeriodDays} Days` : "30 Days"),
      readyToRelocate: s.readyToRelocate || "Yes",
      location: mandate.location || "Hybrid",
      reasonForLeaving: s.reasonForLeaving || "Exploring progressive career opportunities",
      offerInHand: s.offerInHand || "No",
      source: s.candidate.source || "DIRECT_UPLOAD",
      dateOfSourcing: s.createdAt.toISOString(),
      resumeUrl: s.candidate.resumeUrl,
    }));

    const attachments: Array<{ filename: string; path: string }> = [];
    for (const s of submittedSubmissions) {
      if (s.candidate.resumeUrl) {
        if (s.candidate.resumeUrl.startsWith("http://") || s.candidate.resumeUrl.startsWith("https://")) {
          attachments.push({
            filename: `${s.candidate.fullName.replace(/[^a-zA-Z0-9]/g, "_")}_Resume.pdf`,
            path: s.candidate.resumeUrl,
          });
        } else if (s.candidate.resumeUrl.startsWith("/uploads/resumes/")) {
          const localPath = path.join(process.cwd(), "public", s.candidate.resumeUrl);
          const fileName = path.basename(localPath);
          attachments.push({
            filename: `${s.candidate.fullName.replace(/[^a-zA-Z0-9]/g, "_")}_Resume${path.extname(fileName) || ".pdf"}`,
            path: localPath,
          });
        }
      }
    }

    const agency = await prisma.agency.findUnique({
      where: { id: session.user.agencyId },
      select: { name: true },
    });

    const clientContact = mandate.contact || mandate.client.contacts[0];
    const clientEmail = clientContact?.email || clientPortal.clientContactEmail;

    let emailSent = false;
    if (clientEmail && emailCandidates.length > 0) {
      try {
        await sendClientShortlistPresentationEmail({
          to: clientEmail,
          clientContactName: clientContact?.name || clientPortal.clientContactName || "Hiring Lead",
          companyName: mandate.client.name,
          jobTitle: mandate.title,
          agencyName: agency?.name || "Executive Search",
          shareableUrl,
          feedbackSlaHours: clientPortal.feedbackSlaHours,
          candidates: emailCandidates,
          attachments,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error("Failed to send shortlist email to client:", emailErr);
      }
    }

    // 6. Log Audit Event
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: "CANDIDATES_SUBMITTED_TO_CLIENT_PORTAL",
        entity: "ClientPortalShare",
        entityId: clientPortal.id,
        metadata: {
          mandateTitle: mandate.title,
          clientName: mandate.client.name,
          candidatesCount: updateResult.count,
          portalToken: clientPortal.portalToken,
          feedbackSlaHours: clientPortal.feedbackSlaHours,
          emailDispatchedTo: clientEmail,
        },
      },
    });

    return NextResponse.json({
      message: `Successfully presented ${updateResult.count} candidate(s) to ${mandate.client.name} with 48h feedback SLA countdown active.${emailSent ? ` Shortlist email sent to ${clientEmail}.` : ""}`,
      portalToken: clientPortal.portalToken,
      portalUrl,
      shareableUrl,
      portalShare: {
        portalToken: clientPortal.portalToken,
        shareableUrl,
      },
      feedbackSlaHours: clientPortal.feedbackSlaHours,
      candidatesCount: updateResult.count,
      emailSent,
    });
  } catch (error: any) {
    console.error("Error presenting candidates to client portal:", error);
    return NextResponse.json({ error: error.message || "Failed to present candidates to client" }, { status: 500 });
  }
}

