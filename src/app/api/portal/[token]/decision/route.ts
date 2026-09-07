import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, ClientDecision, CandidateJobStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/portal/[token]/decision - 1-Click Shortlist, Reject & Feedback Capture (CL-02)
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token;

    // 1. Validate Client Portal Share & Expiration
    const portalShare = await prisma.clientPortalShare.findUnique({
      where: { portalToken: token },
      include: {
        agency: true,
        mandate: true,
      },
    });

    const now = new Date();
    const isExpired = Boolean(portalShare?.expiresAt && now > portalShare.expiresAt);

    if (!portalShare || !portalShare.isActive || isExpired) {
      return NextResponse.json(
        {
          error: isExpired
            ? "This client review link has expired (links expire after 7 days to safeguard candidate confidentiality). Please contact your recruiter for a fresh link."
            : "Client presentation link is invalid or deactivated.",
        },
        { status: isExpired ? 410 : 404 }
      );
    }

    const body = await req.json();
    const { submissionId, decision, notes, preferredInterviewTimes, rejectionReason } = body;

    if (!submissionId || !decision) {
      return NextResponse.json(
        { error: "Submission ID and decision action are required." },
        { status: 400 }
      );
    }

    // 2. Fetch Submission
    const submission = await prisma.candidateSubmission.findFirst({
      where: {
        id: submissionId,
        mandateId: portalShare.mandateId,
      },
      include: { candidate: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Candidate submission not found in this mandate." }, { status: 404 });
    }

    // Check batch isolation: ensure candidate was part of this share batch
    if (portalShare.candidateIds && portalShare.candidateIds.length > 0) {
      if (!portalShare.candidateIds.includes(submission.candidateId)) {
        return NextResponse.json(
          { error: "Candidate is not authorized in this review batch." },
          { status: 403 }
        );
      }
    }

    let nextStage = submission.stage;
    let clientDecision = submission.clientDecision;
    let candidateJobStatus = submission.candidateJobStatus;

    if (decision === "SHORTLIST") {
      nextStage = SubmissionStage.CLIENT_SHORTLISTED;
      clientDecision = ClientDecision.SHORTLISTED_FOR_INTERVIEW;
      candidateJobStatus = CandidateJobStatus.SELECTED_FOR_NEXT_ROUND;
    } else if (decision === "REJECT") {
      nextStage = SubmissionStage.STAGE_REJECTED;
      clientDecision = ClientDecision.REJECTED_WITH_FEEDBACK;
      candidateJobStatus = CandidateJobStatus.REJECTED;
    } else if (decision === "HOLD" || decision === "QUESTION") {
      clientDecision = ClientDecision.INFO_REQUESTED;
      candidateJobStatus = CandidateJobStatus.HOLD;
    }

    // 3. Update Submission Record with candidateJobStatus
    const updatedSubmission = await prisma.candidateSubmission.update({
      where: { id: submission.id },
      data: {
        stage: nextStage,
        clientDecision,
        candidateJobStatus,
        clientFeedbackNotes: notes?.trim() || submission.clientFeedbackNotes,
        clientFeedbackAt: new Date(),
        preferredInterviewTimes: preferredInterviewTimes?.trim() || submission.preferredInterviewTimes,
        rejectionReason: rejectionReason?.trim() || submission.rejectionReason,
        clientQuestionText: decision === "QUESTION" ? notes?.trim() : submission.clientQuestionText,
      },
    });

    // 4. If Rejected with specific feedback, update candidate's silver medalist reason
    if (decision === "REJECT" && rejectionReason) {
      await prisma.candidate.update({
        where: { id: submission.candidateId },
        data: {
          isSilverMedalist: true,
          silverMedalistReason: `Client Feedback (${portalShare.clientOrgName}): ${rejectionReason}. ${notes || ""}`.trim(),
        },
      });
    }

    // 5. Log Audit Event
    await prisma.auditLog.create({
      data: {
        agencyId: portalShare.agencyId,
        action: `CLIENT_PORTAL_${decision}_RECORDED`,
        entity: "CandidateSubmission",
        entityId: submission.id,
        metadata: {
          decision,
          candidateName: submission.candidate.fullName,
          mandateTitle: portalShare.mandate.title,
          clientOrgName: portalShare.clientOrgName,
          clientContactName: portalShare.clientContactName,
          notes,
          preferredInterviewTimes,
          rejectionReason,
        },
      },
    });

    return NextResponse.json({
      message: `Feedback recorded for candidate '${submission.candidate.fullName}'.`,
      decision,
      stage: nextStage,
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error("Error processing client portal decision:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record client decision" },
      { status: 500 }
    );
  }
}

