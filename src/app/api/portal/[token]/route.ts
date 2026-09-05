import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, ClientDecision } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/portal/[token] - Zero-Login Interactive Client Portal Shortlist View (CL-01, CL-03)
export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token;

    // 1. Validate Client Portal Share
    const portalShare = await prisma.clientPortalShare.findUnique({
      where: { portalToken: token },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        mandate: {
          include: {
            assignedRecruiter: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!portalShare || !portalShare.isActive || !portalShare.agency) {
      return NextResponse.json(
        { error: "Client presentation link is invalid, expired, or deactivated." },
        { status: 404 }
      );
    }

    // 2. Track Portal View Analytics
    await prisma.clientPortalShare.update({
      where: { id: portalShare.id },
      data: {
        viewsCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    // 3. Fetch Candidates Submitted to this Mandate
    const submissions = await prisma.candidateSubmission.findMany({
      where: {
        mandateId: portalShare.mandateId,
        stage: {
          in: [
            SubmissionStage.SUBMITTED_TO_CLIENT,
            SubmissionStage.CLIENT_SHORTLISTED,
            SubmissionStage.INTERVIEW_SCHEDULED,
            SubmissionStage.INTERVIEW_COMPLETED,
            SubmissionStage.OFFER_ISSUED,
            SubmissionStage.OFFER_ACCEPTED,
            SubmissionStage.JOINED_DAY_1_ACTIVE,
            SubmissionStage.STAGE_REJECTED,
          ],
        },
      },
      include: {
        candidate: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Sanitize Candidates (Mask Contact PII) & Compute Feedback SLA Velocity
    const now = new Date();
    const feedbackSlaHours = portalShare.feedbackSlaHours || 48;

    const sanitizedCandidates = submissions.map((sub) => {
      const submittedTime = sub.submittedToClientAt || sub.createdAt;
      const hoursElapsed = (now.getTime() - new Date(submittedTime).getTime()) / (1000 * 60 * 60);
      const hoursRemaining = Math.max(0, Math.round(feedbackSlaHours - hoursElapsed));

      let slaStatus: "HEALTHY" | "WARNING" | "BREACHED" = "HEALTHY";
      if (hoursRemaining <= 0) {
        slaStatus = "BREACHED";
      } else if (hoursRemaining <= 12) {
        slaStatus = "WARNING";
      }

      return {
        submissionId: sub.id,
        candidateId: sub.candidate.id,
        fullName: sub.candidate.fullName,
        email: sub.candidate.email,
        phone: sub.candidate.phone,
        currentTitle: sub.candidate.currentTitle,
        currentCompany: sub.candidate.currentCompany,
        totalExpYears: sub.candidate.totalExpYears,
        expectedCtc: sub.candidate.expectedCtc,
        currentCtc: sub.candidate.currentCtc,
        currency: sub.candidate.currency,
        noticePeriodDays: sub.candidate.noticePeriodDays,
        location: sub.candidate.location,
        skills: sub.candidate.skills,
        summary: sub.candidate.summary,
        resumeUrl: sub.candidate.resumeUrl,
        qualification: sub.candidate.qualification,
        sourceName: sub.candidate.source || "DIRECT_UPLOAD",
        dateOfSourcing: sub.createdAt,
        readyToRelocate: sub.readyToRelocate || "Yes",
        relevantExpYears: sub.relevantExpYears,
        currentSalary: sub.currentSalary || (sub.candidate.currentCtc ? `${sub.candidate.currentCtc} LPA` : "Confidential"),
        expectedSalary: sub.expectedSalary || (sub.candidate.expectedCtc ? `${sub.candidate.expectedCtc} LPA` : "Negotiable"),
        noticePeriod: sub.noticePeriod || (sub.candidate.noticePeriodDays ? `${sub.candidate.noticePeriodDays} Days` : "30 Days"),
        reasonForLeaving: sub.reasonForLeaving || "Exploring progressive opportunities",
        offerInHand: sub.offerInHand || "No",
        // Submission State & Feedback
        stage: sub.stage,
        clientDecision: sub.clientDecision,
        clientFeedbackNotes: sub.clientFeedbackNotes,
        preferredInterviewTimes: sub.preferredInterviewTimes,
        clientQuestionText: sub.clientQuestionText,
        rejectionReason: sub.rejectionReason,
        submittedAt: submittedTime,
        feedbackAt: sub.clientFeedbackAt,
        // 48h SLA Metrics (CL-03)
        feedbackSlaHours,
        hoursElapsed: Math.round(hoursElapsed),
        hoursRemaining,
        slaStatus,
      };
    });

    return NextResponse.json({
      portal: {
        token: portalShare.portalToken,
        clientOrgName: portalShare.clientOrgName,
        clientContactName: portalShare.clientContactName,
        feedbackSlaHours,
        viewsCount: portalShare.viewsCount + 1,
        agency: portalShare.agency,
        mandate: {
          id: portalShare.mandate.id,
          title: portalShare.mandate.title,
          department: portalShare.mandate.department,
          openings: portalShare.mandate.openings,
          minExp: portalShare.mandate.minExp,
          maxExp: portalShare.mandate.maxExp,
          workMode: portalShare.mandate.workMode,
          location: portalShare.mandate.location,
          skills: portalShare.mandate.skills,
          description: portalShare.mandate.description,
          assignedRecruiter: portalShare.mandate.assignedRecruiter,
        },
        candidates: sanitizedCandidates,
      },
    });
  } catch (error: any) {
    console.error("Error loading client presentation portal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load client presentation portal" },
      { status: 500 }
    );
  }
}

