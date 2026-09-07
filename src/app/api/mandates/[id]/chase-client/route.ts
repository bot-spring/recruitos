import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, ClientDecision } from "@prisma/client";
import { sendClientShortlistReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/mandates/[id]/chase-client - 1-Click Threaded Client Feedback Reminder (CF-04)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const mandateId = params.id;

    // 1. Fetch mandate with client & contacts
    const mandate = await prisma.jobMandate.findFirst({
      where: {
        id: mandateId,
        agencyId: session.user.agencyId,
      },
      include: {
        client: {
          include: {
            contacts: true,
          },
        },
        contact: true,
        agency: true,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Search mandate not found." }, { status: 404 });
    }

    // 2. Fetch active portal share
    const portalShare = await prisma.clientPortalShare.findFirst({
      where: {
        mandateId: mandate.id,
        agencyId: session.user.agencyId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!portalShare) {
      return NextResponse.json(
        { error: "No active candidate presentation link found for this mandate. Please share a shortlist first." },
        { status: 400 }
      );
    }

    // Check expiration
    const now = new Date();
    if (portalShare.expiresAt && now > portalShare.expiresAt) {
      return NextResponse.json(
        { error: "The previous presentation link has expired (7-day window passed). Please generate a fresh shortlist to share." },
        { status: 410 }
      );
    }

    // 3. Find pending candidates waiting for feedback
    const submissionWhere: any = {
      mandateId: mandate.id,
      stage: SubmissionStage.SUBMITTED_TO_CLIENT,
      clientDecision: ClientDecision.PENDING_REVIEW,
    };

    if (portalShare.candidateIds && portalShare.candidateIds.length > 0) {
      submissionWhere.candidateId = { in: portalShare.candidateIds };
    }

    const pendingSubmissions = await prisma.candidateSubmission.findMany({
      where: submissionWhere,
      include: { candidate: true },
    });

    if (pendingSubmissions.length === 0) {
      return NextResponse.json(
        { error: "All candidates submitted in this batch have already received client feedback or next-round action." },
        { status: 400 }
      );
    }

    // 4. Resolve Client Contact Email & Recipient List
    const primaryContact = mandate.contact || mandate.client.contacts[0];
    const clientEmail = primaryContact?.email || portalShare.clientContactEmail;

    if (!clientEmail) {
      return NextResponse.json(
        { error: "No client email found on file to dispatch reminder." },
        { status: 400 }
      );
    }

    // Fetch assigned recruiter & agency owner for CC
    const recruiterUser = mandate.assignedRecruiterId
      ? await prisma.user.findUnique({ where: { id: mandate.assignedRecruiterId }, select: { email: true } })
      : null;
    const agencyOwner = await prisma.user.findFirst({
      where: { agencyId: session.user.agencyId, role: "AGENCY_OWNER" },
      select: { email: true },
    });

    const ccList: string[] = [];
    if (recruiterUser?.email && recruiterUser.email.toLowerCase() !== clientEmail.toLowerCase()) {
      ccList.push(recruiterUser.email);
    }
    if (
      session.user.email &&
      session.user.email.toLowerCase() !== clientEmail.toLowerCase() &&
      !ccList.some((c) => c.toLowerCase() === session.user.email.toLowerCase())
    ) {
      ccList.push(session.user.email);
    }
    if (
      agencyOwner?.email &&
      agencyOwner.email.toLowerCase() !== clientEmail.toLowerCase() &&
      !ccList.some((c) => c.toLowerCase() === agencyOwner.email.toLowerCase())
    ) {
      ccList.push(agencyOwner.email);
    }

    // 5. Build Threaded Reminder Email
    const nextReminderLevel = (portalShare.reminderLevel || 0) + 1;
    const hoursElapsed = Math.max(0, Math.floor((now.getTime() - new Date(portalShare.createdAt).getTime()) / (1000 * 60 * 60)));

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const shareableUrl = `${baseUrl}/portal/${portalShare.portalToken}`;

    const emailResult = await sendClientShortlistReminderEmail({
      to: clientEmail,
      cc: ccList,
      clientContactName: primaryContact?.name || portalShare.clientContactName || "Hiring Lead",
      companyName: mandate.client.name,
      jobTitle: mandate.title,
      agencyName: mandate.agency?.name || "Executive Search",
      shareableUrl,
      candidatesCount: pendingSubmissions.length,
      initialBatchCount: portalShare.candidateIds?.length || pendingSubmissions.length,
      lastEmailMessageId: portalShare.lastEmailMessageId,
      reminderLevel: nextReminderLevel,
      hoursElapsed,
    });

    // 6. Update Portal Share tracking
    await prisma.clientPortalShare.update({
      where: { id: portalShare.id },
      data: {
        reminderLevel: nextReminderLevel,
        lastReminderSentAt: new Date(),
        lastEmailMessageId: emailResult.messageId || portalShare.lastEmailMessageId,
      },
    });

    // 7. Audit Log
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: "CLIENT_SHORTLIST_REMINDER_CHASED",
        entity: "ClientPortalShare",
        entityId: portalShare.id,
        metadata: {
          mandateTitle: mandate.title,
          clientName: mandate.client.name,
          reminderLevel: nextReminderLevel,
          hoursElapsed,
          pendingCandidatesCount: pendingSubmissions.length,
          dispatchedTo: clientEmail,
          threadedMessageId: portalShare.lastEmailMessageId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Follow-up reminder sent to ${clientEmail} (threaded to original email) for ${pendingSubmissions.length} candidate(s).`,
      reminderLevel: nextReminderLevel,
      hoursElapsed,
      clientEmail,
    });
  } catch (error: any) {
    console.error("Error dispatching client reminder chase:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch client reminder" }, { status: 500 });
  }
}

