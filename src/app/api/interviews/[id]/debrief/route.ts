import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, InterviewStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/interviews/[id]/debrief - Log post-interview debrief & advance pipeline (RC-05)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const interviewId = params.id;
    const body = await req.json();
    const {
      debriefNotes,
      candidateSentiment = "POSITIVE_RECEPTIVE",
      salaryAlignmentNotes,
      noticePeriodConfirmed,
      nextAction = "NEXT_ROUND", // MOVE_TO_OFFER, NEXT_ROUND, REJECT
    } = body;

    // 1. Verify Interview belongs to agency
    const interview = await prisma.interviewSchedule.findFirst({
      where: {
        id: interviewId,
        agencyId: session.user.agencyId,
      },
      include: {
        candidate: true,
        submission: true,
        mandate: { include: { client: true } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview schedule not found." }, { status: 404 });
    }

    let nextStage: SubmissionStage = SubmissionStage.INTERVIEW_COMPLETED;
    if (nextAction === "MOVE_TO_OFFER") {
      nextStage = SubmissionStage.OFFER_ISSUED;
    } else if (nextAction === "REJECT") {
      nextStage = SubmissionStage.STAGE_REJECTED;
    } else if (nextAction === "NEXT_ROUND") {
      nextStage = SubmissionStage.INTERVIEW_COMPLETED;
    }

    // 2. Update Interview and Submission in Transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedInterview = await tx.interviewSchedule.update({
        where: { id: interview.id },
        data: {
          status: InterviewStatus.COMPLETED,
          debriefLoggedAt: new Date(),
          candidateSentiment,
          candidateDebriefNotes: debbriefNotesTrim(debriefNotes),
          salaryAlignmentNotes: salaryAlignmentNotes?.trim() || null,
          noticePeriodConfirmed: noticePeriodConfirmed ? parseInt(String(noticePeriodConfirmed), 10) : null,
        },
      });

      const updatedSubmission = await tx.candidateSubmission.update({
        where: { id: interview.submissionId },
        data: {
          stage: nextStage,
          recruiterNotes: debriefNotes?.trim() || interview.submission.recruiterNotes,
          updatedAt: new Date(),
        },
      });

      // If rejected post-interview, auto-tag into Silver Medalist Vault
      if (nextAction === "REJECT") {
        await tx.candidate.update({
          where: { id: interview.candidateId },
          data: {
            isSilverMedalist: true,
            silverMedalistReason: `Post-Interview Debrief (${interview.mandate.client.name}): ${debriefNotes || "Client round completed."}`,
          },
        });
      }

      // Log Audit Event
      await tx.auditLog.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          action: "INTERVIEW_DEBRIEF_LOGGED",
          entity: "InterviewSchedule",
          entityId: interview.id,
          metadata: {
            candidateName: interview.candidate.fullName,
            mandateTitle: interview.mandate.title,
            clientName: interview.mandate.client.name,
            candidateSentiment,
            nextAction,
            promotedStage: nextStage,
          },
        },
      });

      return { interview: updatedInterview, submission: updatedSubmission };
    });

    return NextResponse.json({
      message: `Debrief logged for '${interview.candidate.fullName}'. Candidate stage advanced to ${nextStage}.`,
      interview: result.interview,
      submission: result.submission,
      stage: nextStage,
    });
  } catch (error: any) {
    console.error("Error logging interview debrief:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log interview debrief" },
      { status: 500 }
    );
  }
}

function debbriefNotesTrim(notes?: string) {
  return notes?.trim() || null;
}

