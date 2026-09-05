import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CandidateJobStatus, SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/mandates/[id]/candidates - Attach Candidate from Pool to this Mandate
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const mandateId = params.id;
    const body = await req.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required." }, { status: 400 });
    }

    // Verify mandate exists and belongs to agency
    const mandate = await prisma.jobMandate.findFirst({
      where: { id: mandateId, agencyId },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    // Check if candidate is already attached
    const existing = await prisma.candidateSubmission.findFirst({
      where: { candidateId, mandateId, agencyId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Candidate is already attached to this mandate." },
        { status: 409 }
      );
    }

    // Create CandidateSubmission
    const submission = await prisma.candidateSubmission.create({
      data: {
        agencyId,
        candidateId,
        mandateId,
        submittedByUserId: session.user.id,
        stage: SubmissionStage.SCREENED_QUALIFIED,
        candidateJobStatus: CandidateJobStatus.NOT_SHARED,
      },
      include: {
        candidate: true,
      },
    });

    // Log Audit Trail
    await prisma.auditLog.create({
      data: {
        agencyId,
        userId: session.user.id,
        action: "CANDIDATE_ATTACHED_TO_MANDATE",
        entity: "CandidateSubmission",
        entityId: submission.id,
        metadata: {
          candidateName: submission.candidate.fullName,
          mandateTitle: mandate.title,
        },
      },
    });

    return NextResponse.json({
      message: `Candidate '${submission.candidate.fullName}' attached to '${mandate.title}' successfully.`,
      submission,
    });
  } catch (error: any) {
    console.error("Error attaching candidate to mandate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to attach candidate to mandate" },
      { status: 500 }
    );
  }
}

