import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/offers/notice-board - List active candidates under offer & notice period (RC-06)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const noticeSubmissions = await prisma.candidateSubmission.findMany({
      where: {
        agencyId: session.user.agencyId,
        stage: {
          in: [
            SubmissionStage.OFFER_ISSUED,
            SubmissionStage.OFFER_ACCEPTED,
            SubmissionStage.NOTICE_PERIOD_ACTIVE,
          ],
        },
      },
      include: {
        candidate: true,
        mandate: {
          include: {
            client: true,
            assignedRecruiter: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { offeredJoiningDate: "asc" },
    });

    const now = new Date();
    const formatted = noticeSubmissions.map((s) => {
      let daysRemaining = null;
      if (s.offeredJoiningDate) {
        const diffMs = new Date(s.offeredJoiningDate).getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        id: s.id,
        stage: s.stage,
        candidateName: s.candidate.fullName,
        candidatePhone: s.candidate.phone,
        candidateEmail: s.candidate.email,
        jobTitle: s.mandate.title,
        clientName: s.mandate.client.name,
        offeredCtc: s.offeredCtc,
        offeredJoiningDate: s.offeredJoiningDate,
        resignationDate: s.resignationDate,
        resignationConfirmed: s.resignationConfirmed,
        counterOfferRiskLevel: s.counterOfferRiskLevel,
        counterOfferRiskReason: s.counterOfferRiskReason,
        lastRetentionPulseAt: s.lastRetentionPulseAt,
        retentionCheckinLog: s.retentionCheckinLog,
        daysRemaining,
        recruiterName: s.mandate.assignedRecruiter?.name || "Search Lead",
      };
    });

    return NextResponse.json({ noticeBoard: formatted });
  } catch (error: any) {
    console.error("Error fetching notice board:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load notice period tracker" },
      { status: 500 }
    );
  }
}

