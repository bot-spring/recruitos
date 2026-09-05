import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/candidates/[id]/redeploy - 1-Click Redeployment into active mandate (RC-07)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const candidateId = params.id;
    const body = await req.json();
    const { targetMandateId, recruiterNotes } = body;

    if (!targetMandateId) {
      return NextResponse.json({ error: "Target Mandate ID is required for redeployment." }, { status: 400 });
    }

    // 1. Verify candidate belongs to agency
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        agencyId: session.user.agencyId,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    // 2. Verify target mandate belongs to agency
    const targetMandate = await prisma.jobMandate.findFirst({
      where: {
        id: targetMandateId,
        agencyId: session.user.agencyId,
      },
      include: { client: true },
    });

    if (!targetMandate) {
      return NextResponse.json({ error: "Target mandate not found." }, { status: 404 });
    }

    // 3. Upsert submission directly into SCREENED_QUALIFIED (bypassing raw parsing)
    const submission = await prisma.candidateSubmission.upsert({
      where: {
        candidateId_mandateId: {
          candidateId: candidate.id,
          mandateId: targetMandate.id,
        },
      },
      update: {
        stage: SubmissionStage.SCREENED_QUALIFIED,
        submittedByUserId: session.user.id,
        recruiterNotes: recruiterNotes?.trim() || "Redeployed from Silver Medalist Talent Vault. Pre-vetted finalist.",
        updatedAt: new Date(),
      },
      create: {
        agencyId: session.user.agencyId,
        candidateId: candidate.id,
        mandateId: targetMandate.id,
        submittedByUserId: session.user.id,
        stage: SubmissionStage.SCREENED_QUALIFIED,
        recruiterNotes: recruiterNotes?.trim() || "Redeployed from Silver Medalist Talent Vault. Pre-vetted finalist.",
      },
    });

    // 4. Record Audit Log
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: "SILVER_MEDALIST_REDEPLOYED",
        entity: "CandidateSubmission",
        entityId: submission.id,
        metadata: {
          candidateName: candidate.fullName,
          targetJobTitle: targetMandate.title,
          clientName: targetMandate.client.name,
          promotedStage: SubmissionStage.SCREENED_QUALIFIED,
        },
      },
    });

    return NextResponse.json({
      message: `Candidate '${candidate.fullName}' successfully redeployed to '${targetMandate.title}' in stage SCREENED_QUALIFIED.`,
      submission,
      candidate,
      mandate: {
        id: targetMandate.id,
        title: targetMandate.title,
        clientName: targetMandate.client.name,
      },
    });
  } catch (error: any) {
    console.error("Error redeploying candidate:", error);
    return NextResponse.json({ error: error.message || "Failed to redeploy candidate" }, { status: 500 });
  }
}

