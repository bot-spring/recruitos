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

// DELETE /api/mandates/[id]/candidates - Detach/Remove Candidate from this Mandate Pipeline
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const mandateId = params.id;
    const url = new URL(req.url);
    const submissionIdParam = url.searchParams.get("submissionId");
    const candidateIdParam = url.searchParams.get("candidateId");

    let submissionId = submissionIdParam;
    let candidateId = candidateIdParam;
    let submissionIds: string[] = [];
    let candidateIds: string[] = [];
    let reason = "Removed from search mandate";

    try {
      const body = await req.json();
      if (body.submissionId) submissionId = body.submissionId;
      if (body.candidateId) candidateId = body.candidateId;
      if (Array.isArray(body.submissionIds)) submissionIds = body.submissionIds;
      if (Array.isArray(body.candidateIds)) candidateIds = body.candidateIds;
      if (body.reason) reason = body.reason;
    } catch {
      // Body is optional if params provided in query
    }

    // Determine target submissions (support single or batch)
    const hasBatch = submissionIds.length > 0 || candidateIds.length > 0;
    if (!submissionId && !candidateId && !hasBatch) {
      return NextResponse.json(
        { error: "submissionId(s) or candidateId(s) is required." },
        { status: 400 }
      );
    }

    const whereOr: any[] = [];
    if (submissionIds.length > 0) whereOr.push({ id: { in: submissionIds } });
    if (candidateIds.length > 0) whereOr.push({ candidateId: { in: candidateIds } });
    if (submissionId) whereOr.push({ id: submissionId });
    if (candidateId) whereOr.push({ candidateId });

    // Find matching submissions
    const submissions = await prisma.candidateSubmission.findMany({
      where: {
        agencyId,
        mandateId,
        OR: whereOr,
      },
      include: {
        candidate: true,
        mandate: true,
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json({ error: "No matching candidate submissions found on this mandate." }, { status: 404 });
    }

    const removedSubIds = submissions.map((s) => s.id);
    const removedCandIds = submissions.map((s) => s.candidateId);
    const mandateTitle = submissions[0]?.mandate?.title || "Search Mandate";

    await prisma.$transaction(async (tx) => {
      // Delete any pending interview schedules on this mandate for these submissions
      await tx.interviewSchedule.deleteMany({
        where: {
          mandateId,
          submissionId: { in: removedSubIds },
        },
      });

      // Delete the submissions
      await tx.candidateSubmission.deleteMany({
        where: { id: { in: removedSubIds } },
      });

      // Record Audit Trail
      for (const s of submissions) {
        await tx.auditLog.create({
          data: {
            agencyId,
            userId: session.user.id,
            action: "CANDIDATE_REMOVED_FROM_MANDATE",
            entity: "CandidateSubmission",
            entityId: s.id,
            metadata: {
              candidateName: s.candidate.fullName,
              mandateTitle,
              reason,
            },
          },
        });
      }
    });

    return NextResponse.json({
      message: `${submissions.length} candidate(s) removed from '${mandateTitle}'. Profiles preserved in Talent Bank.`,
      success: true,
      removedCount: submissions.length,
      removedCandidateIds: removedCandIds,
      removedSubmissionIds: removedSubIds,
    });
  } catch (error: any) {
    console.error("Error removing candidate from mandate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove candidate from mandate." },
      { status: 500 }
    );
  }
}

