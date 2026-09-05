import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, ProbationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/placements/probation-vault - List all active 90-day probation guarantee placements (RC-07)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const placements = await prisma.candidateSubmission.findMany({
      where: {
        agencyId: session.user.agencyId,
        stage: SubmissionStage.JOINED_DAY_1_ACTIVE,
      },
      include: {
        candidate: true,
        mandate: {
          include: {
            client: true,
            assignedRecruiter: { select: { name: true, email: true } },
          },
        },
        placementInvoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { actualJoiningDate: "desc" },
    });

    const now = new Date();
    const formatted = placements.map((p) => {
      let daysServed = 0;
      let daysRemaining = 90;
      let isCleared = false;

      if (p.actualJoiningDate && p.probationEndDate) {
        const startMs = new Date(p.actualJoiningDate).getTime();
        const endMs = new Date(p.probationEndDate).getTime();
        const nowMs = now.getTime();

        daysServed = Math.max(0, Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24)));
        daysRemaining = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
        isCleared = daysRemaining === 0 || p.probationStatus === ProbationStatus.CLEARED_SUCCESSFUL;
      }

      return {
        id: p.id,
        candidateName: p.candidate.fullName,
        candidateEmail: p.candidate.email,
        candidatePhone: p.candidate.phone,
        currentTitle: p.candidate.currentTitle,
        jobTitle: p.mandate.title,
        clientName: p.mandate.client.name,
        actualJoiningDate: p.actualJoiningDate,
        probationEndDate: p.probationEndDate,
        probationDays: p.probationDays,
        daysServed,
        daysRemaining,
        probationStatus: p.probationStatus,
        isCleared,
        partnerSourcerName: p.partnerSourcerName,
        splitFeePercentage: p.splitFeePercentage,
        splitPayoutEstimated: p.splitPayoutEstimated,
        invoice: p.placementInvoices[0] || null,
        recruiterName: p.mandate.assignedRecruiter?.name || "Search Lead",
      };
    });

    return NextResponse.json({ probationPlacements: formatted });
  } catch (error: any) {
    console.error("Error loading probation vault:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load probation guarantee vault" },
      { status: 500 }
    );
  }
}

