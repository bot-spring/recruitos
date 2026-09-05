import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/partner/[token]/submissions - Real-time stage tracker for partner sourcer (PO-04)
export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    const { searchParams } = new URL(req.url);
    const partnerEmail = searchParams.get("email")?.toLowerCase().trim();

    if (!partnerEmail) {
      return NextResponse.json({ submissions: [] });
    }

    const partnerShare = await prisma.partnerShare.findUnique({
      where: { shareToken: token },
      include: { mandate: true },
    });

    if (!partnerShare) {
      return NextResponse.json({ error: "Partner mandate link not found." }, { status: 404 });
    }

    // Isolated Query: Only fetch submissions made by THIS partner sourcer email (PO-04)
    const submissions = await prisma.candidateSubmission.findMany({
      where: {
        mandateId: partnerShare.mandateId,
        partnerSourcerEmail: partnerEmail,
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            currentTitle: true,
            totalExpYears: true,
            noticePeriodDays: true,
            skills: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedSubmissions = submissions.map((s) => ({
      id: s.id,
      candidateId: s.candidate.id,
      candidateName: s.candidate.fullName,
      currentTitle: s.candidate.currentTitle,
      totalExpYears: s.candidate.totalExpYears,
      noticePeriodDays: s.candidate.noticePeriodDays,
      stage: s.stage,
      splitFeePercentage: s.splitFeePercentage || partnerShare.splitFeePercentage,
      splitPayoutEstimated: s.splitPayoutEstimated,
      submittedAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({ submissions: formattedSubmissions });
  } catch (error: any) {
    console.error("Error fetching partner submissions:", error);
    return NextResponse.json({ error: error.message || "Failed to load submissions" }, { status: 500 });
  }
}

