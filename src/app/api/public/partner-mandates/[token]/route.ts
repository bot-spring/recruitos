import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/public/partner-mandates/[token] - Public API for external partner split recruiters
export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token;

    const partnerShare = await prisma.partnerShare.findUnique({
      where: { shareToken: token },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isActive: true,
          },
        },
        mandate: {
          select: {
            id: true,
            title: true,
            department: true,
            openings: true,
            minExp: true,
            maxExp: true,
            minCtc: true,
            maxCtc: true,
            currency: true,
            workMode: true,
            location: true,
            skills: true,
            description: true,
            priority: true,
            maxNoticeDays: true,
            feePercentage: true,
            guaranteeDays: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!partnerShare || !partnerShare.isActive || !partnerShare.agency.isActive) {
      return NextResponse.json(
        { error: "Partner mandate link is invalid, expired, or has been paused by the sponsoring agency." },
        { status: 404 }
      );
    }

    // Increment view count asynchronously
    await prisma.partnerShare.update({
      where: { id: partnerShare.id },
      data: { viewsCount: { increment: 1 } },
    });

    // Calculate Partner Commercial Split Earnings (PO-01)
    const agencyFeePct = partnerShare.mandate.feePercentage; // e.g. 8.33%
    const splitPct = partnerShare.splitFeePercentage;        // e.g. 50%
    const effectivePartnerPct = (agencyFeePct * splitPct) / 100; // e.g. 4.165% of CTC

    let estimatedMinPayout = null;
    let estimatedMaxPayout = null;

    if (partnerShare.mandate.minCtc) {
      estimatedMinPayout = Math.round(partnerShare.mandate.minCtc * (effectivePartnerPct / 100));
    }
    if (partnerShare.mandate.maxCtc) {
      estimatedMaxPayout = Math.round(partnerShare.mandate.maxCtc * (effectivePartnerPct / 100));
    }

    // Strict Client Masking Serialization (100% PII Stripped)
    const sanitizedResponse = {
      shareToken: partnerShare.shareToken,
      maskedClientTitle: partnerShare.maskedClientTitle,
      maskedLocation: partnerShare.maskedLocation || partnerShare.mandate.location,
      sponsoringAgency: {
        name: partnerShare.agency.name,
        slug: partnerShare.agency.slug,
      },
      mandate: {
        id: partnerShare.mandate.id,
        title: partnerShare.mandate.title,
        department: partnerShare.mandate.department,
        openings: partnerShare.mandate.openings,
        minExp: partnerShare.mandate.minExp,
        maxExp: partnerShare.mandate.maxExp,
        workMode: partnerShare.mandate.workMode,
        location: partnerShare.maskedLocation || partnerShare.mandate.location,
        skills: partnerShare.mandate.skills,
        description: partnerShare.mandate.description,
        maxNoticeDays: partnerShare.mandate.maxNoticeDays,
        currency: partnerShare.mandate.currency,
        minCtc: partnerShare.mandate.minCtc,
        maxCtc: partnerShare.mandate.maxCtc,
      },
      commercialTerms: {
        splitFeePercentage: partnerShare.splitFeePercentage,
        effectivePartnerFeePct: parseFloat(effectivePartnerPct.toFixed(2)),
        guaranteeDays: partnerShare.mandate.guaranteeDays,
        estimatedMinPayout,
        estimatedMaxPayout,
        currency: partnerShare.mandate.currency,
        payoutTerms: partnerShare.payoutTerms,
      },
    };

    return NextResponse.json({ partnerMandate: sanitizedResponse });
  } catch (error: any) {
    console.error("Error fetching public partner mandate:", error);
    return NextResponse.json({ error: error.message || "Failed to load partner mandate" }, { status: 500 });
  }
}

