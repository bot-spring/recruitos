import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, CounterOfferRisk } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/offers/[id]/retention-pulse - Log bi-weekly notice period pulse check & risk score (RC-06)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const submissionId = params.id;
    const body = await req.json();
    const {
      resignationConfirmed = true,
      counterOfferReceived = false,
      counterOfferAmount,
      counterOfferRiskLevel = "LOW",
      counterOfferRiskReason,
      candidateSentimentScore = 5,
      recruiterNotes = "",
    } = body;

    // 1. Fetch current submission
    const submission = await prisma.candidateSubmission.findFirst({
      where: {
        id: submissionId,
        agencyId: session.user.agencyId,
      },
      include: {
        candidate: true,
        mandate: { include: { client: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Candidate submission not found." }, { status: 404 });
    }

    // 2. Prepare new Check-in Entry
    const newCheckin = {
      date: new Date().toISOString(),
      recruiterName: session.user.name || "Desk Recruiter",
      resignationConfirmed,
      counterOfferReceived,
      counterOfferAmount: counterOfferAmount ? parseFloat(String(counterOfferAmount)) : null,
      counterOfferRiskLevel,
      counterOfferRiskReason: counterOfferRiskReason?.trim() || null,
      candidateSentimentScore: parseInt(String(candidateSentimentScore), 10) || 5,
      recruiterNotes: recruiterNotes?.trim() || "",
    };

    const existingLogs = Array.isArray(submission.retentionCheckinLog)
      ? (submission.retentionCheckinLog as any[])
      : [];

    const updatedLogs = [newCheckin, ...existingLogs];

    // Determine Stage (if resignation confirmed and still in OFFER_ACCEPTED, promote to NOTICE_PERIOD_ACTIVE)
    let nextStage: SubmissionStage = submission.stage;
    if (resignationConfirmed && (submission.stage === SubmissionStage.OFFER_ISSUED || submission.stage === SubmissionStage.OFFER_ACCEPTED)) {
      nextStage = SubmissionStage.NOTICE_PERIOD_ACTIVE;
    }

    // 3. Update Submission in Database
    const updatedSubmission = await prisma.candidateSubmission.update({
      where: { id: submission.id },
      data: {
        stage: nextStage,
        resignationConfirmed,
        counterOfferRiskLevel: counterOfferRiskLevel as CounterOfferRisk,
        counterOfferRiskReason: counterOfferRiskReason?.trim() || submission.counterOfferRiskReason,
        lastRetentionPulseAt: new Date(),
        retentionCheckinLog: updatedLogs,
        updatedAt: new Date(),
      },
    });

    // 4. Log Audit Event
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: "RETENTION_PULSE_CHECKIN_LOGGED",
        entity: "CandidateSubmission",
        entityId: submission.id,
        metadata: {
          candidateName: submission.candidate.fullName,
          counterOfferRiskLevel,
          counterOfferReceived,
          sentimentScore: candidateSentimentScore,
          promotedStage: nextStage,
        },
      },
    });

    return NextResponse.json({
      message: `Bi-weekly pulse check recorded for '${submission.candidate.fullName}'. Risk level: ${counterOfferRiskLevel}.`,
      submission: updatedSubmission,
      checkin: newCheckin,
    });
  } catch (error: any) {
    console.error("Error logging retention pulse:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log retention pulse checkin" },
      { status: 500 }
    );
  }
}

