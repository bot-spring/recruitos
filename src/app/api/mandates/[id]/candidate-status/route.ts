import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CandidateJobStatus, SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// PATCH /api/mandates/[id]/candidate-status - Update Candidate Status for this Mandate
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const mandateId = params.id;
    const body = await req.json();
    const { submissionId, status, rejectionReason, tagSilverMedalist } = body;

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "Submission ID and Status are required." },
        { status: 400 }
      );
    }

    const submission = await prisma.candidateSubmission.findFirst({
      where: { id: submissionId, mandateId, agencyId },
      include: { candidate: true, mandate: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Candidate submission record not found." }, { status: 404 });
    }

    // Map CandidateJobStatus to underlying pipeline SubmissionStage
    let nextStage: SubmissionStage = submission.stage;
    if (status === CandidateJobStatus.NOT_SHARED) {
      nextStage = SubmissionStage.SCREENED_QUALIFIED;
    } else if (status === CandidateJobStatus.SHARED_WITH_COMPANY) {
      nextStage = SubmissionStage.SUBMITTED_TO_CLIENT;
    } else if (status === CandidateJobStatus.SELECTED_FOR_NEXT_ROUND) {
      nextStage = SubmissionStage.CLIENT_SHORTLISTED;
    } else if (status === CandidateJobStatus.OFFERED) {
      nextStage = SubmissionStage.OFFER_ISSUED;
    } else if (status === CandidateJobStatus.HOLD) {
      nextStage = submission.stage; // Maintain stage, flag status
    } else if (status === CandidateJobStatus.REJECTED) {
      nextStage = SubmissionStage.STAGE_REJECTED;
    } else if (status === CandidateJobStatus.JOINED) {
      nextStage = SubmissionStage.JOINED_DAY_1_ACTIVE;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSubmission = await tx.candidateSubmission.update({
        where: { id: submission.id },
        data: {
          candidateJobStatus: status as CandidateJobStatus,
          stage: nextStage,
          rejectionReason: rejectionReason?.trim() || submission.rejectionReason,
          updatedAt: new Date(),
        },
      });

      // Optionally tag candidate into Silver Medalist Vault if rejected
      if (status === CandidateJobStatus.REJECTED && tagSilverMedalist) {
        await tx.candidate.update({
          where: { id: submission.candidateId },
          data: {
            isSilverMedalist: true,
            silverMedalistReason: `Recycled from '${submission.mandate.title}': ${rejectionReason || "Strong candidate, closed on alternate profile."}`,
          },
        });
      }

      // Log Audit Trail
      await tx.auditLog.create({
        data: {
          agencyId,
          userId: session.user.id,
          action: "CANDIDATE_JOB_STATUS_UPDATED",
          entity: "CandidateSubmission",
          entityId: submission.id,
          metadata: {
            candidateName: submission.candidate.fullName,
            mandateTitle: submission.mandate.title,
            newStatus: status,
            promotedStage: nextStage,
          },
        },
      });

      return updatedSubmission;
    });

    return NextResponse.json({
      message: `Candidate '${submission.candidate.fullName}' status updated to ${status.replace(/_/g, " ")}.`,
      submission: result,
    });
  } catch (error: any) {
    console.error("Error updating candidate status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update candidate status" },
      { status: 500 }
    );
  }
}

