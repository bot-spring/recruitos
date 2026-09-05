import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MandateStatus, ProbationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/placements/[id]/trigger-replacement - Trigger $0 Free Replacement Mandate on Early Probation Exit (RC-07)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const submissionId = params.id;
    const body = await req.json();
    const {
      earlyExitReason = "Candidate resigned during 90-day probation window.",
      exitDate = new Date().toISOString(),
    } = body;

    // 1. Fetch submission and mandate
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
      return NextResponse.json({ error: "Placement record not found." }, { status: 404 });
    }

    const parsedExitDate = new Date(exitDate);

    // 2. Clone Mandate for $0 Free Replacement in Transaction
    const result = await prisma.$transaction(async (tx) => {
      const originalMandate = submission.mandate;

      // Create new $0 Replacement Mandate
      const replacementMandate = await tx.jobMandate.create({
        data: {
          agencyId: submission.agencyId,
          clientId: originalMandate.clientId,
          contactId: originalMandate.contactId,
          assignedRecruiterId: originalMandate.assignedRecruiterId,
          title: `[FREE REPLACEMENT] ${originalMandate.title}`,
          department: originalMandate.department,
          openings: 1,
          minExp: originalMandate.minExp,
          maxExp: originalMandate.maxExp,
          minCtc: originalMandate.minCtc,
          maxCtc: originalMandate.maxCtc,
          currency: originalMandate.currency,
          location: originalMandate.location,
          workMode: originalMandate.workMode,
          skills: originalMandate.skills,
          description: `Zero-Dollar Free Replacement search for '${submission.candidate.fullName}' who exited on ${parsedExitDate.toLocaleDateString()}. Reason: ${earlyExitReason}`,
          priority: originalMandate.priority,
          maxNoticeDays: originalMandate.maxNoticeDays,
          feePercentage: 0.0, // $0 Free Replacement Guarantee
          guaranteeDays: originalMandate.guaranteeDays,
          status: MandateStatus.REPLACEMENT_ACTIVE,
          source: "PROBATION_REPLACEMENT",
          specialInstructions: `100% Fee Credit Applied. Fast-track using Silver Medalist Talent Vault.`,
          isReplacement: true,
          originalMandateId: originalMandate.id,
          slaTargetHours: 48,
          slaStartedAt: new Date(),
          approvedAt: new Date(),
          approvedByUserId: session.user.id,
        },
      });

      // Update original submission
      const updatedSubmission = await tx.candidateSubmission.update({
        where: { id: submission.id },
        data: {
          probationStatus: ProbationStatus.EARLY_EXIT_REPLACEMENT,
          earlyExitDate: parsedExitDate,
          earlyExitReason,
          replacementMandateId: replacementMandate.id,
          updatedAt: new Date(),
        },
      });

      // Log Audit Event
      await tx.auditLog.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          action: "PROBATION_EARLY_EXIT_REPLACEMENT_TRIGGERED",
          entity: "JobMandate",
          entityId: replacementMandate.id,
          metadata: {
            candidateName: submission.candidate.fullName,
            originalMandateTitle: originalMandate.title,
            replacementMandateId: replacementMandate.id,
            earlyExitReason,
            feePercentage: 0.0,
          },
        },
      });

      return { replacementMandate, updatedSubmission };
    });

    return NextResponse.json({
      message: `⚡ $0 Free Replacement Mandate '${result.replacementMandate.title}' activated with zero fee! Silver medalist pipeline unlocked.`,
      replacementMandate: result.replacementMandate,
      submission: result.updatedSubmission,
    });
  } catch (error: any) {
    console.error("Error triggering replacement:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger $0 replacement mandate" },
      { status: 500 }
    );
  }
}
