import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/mandates/[id]/partner-share - Get existing partner share configuration
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const partnerShare = await prisma.partnerShare.findFirst({
      where: {
        mandateId: params.id,
        agencyId: session.user.agencyId,
      },
    });

    return NextResponse.json({ partnerShare });
  } catch (error: any) {
    console.error("Error fetching partner share:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch partner share" }, { status: 500 });
  }
}

// POST /api/mandates/[id]/partner-share - Create or update anonymized partner share
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const mandateId = params.id;
    const body = await req.json();
    const {
      maskedClientTitle,
      maskedLocation,
      splitFeePercentage = 50.0,
      payoutTerms,
      isActive = true,
    } = body;

    if (!maskedClientTitle || !maskedClientTitle.trim()) {
      return NextResponse.json(
        { error: "Masked Client Title is required (e.g. 'Confidential — Series B FinTech Leader')." },
        { status: 400 }
      );
    }

    // Verify mandate belongs to this agency
    const mandate = await prisma.jobMandate.findFirst({
      where: {
        id: mandateId,
        agencyId: session.user.agencyId,
      },
      include: { client: true },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    // Check if a partner share record already exists
    let existingShare = await prisma.partnerShare.findFirst({
      where: {
        mandateId,
        agencyId: session.user.agencyId,
      },
    });

    let partnerShare;
    if (existingShare) {
      partnerShare = await prisma.partnerShare.update({
        where: { id: existingShare.id },
        data: {
          maskedClientTitle: maskedClientTitle.trim(),
          maskedLocation: maskedLocation?.trim() || mandate.location || "Hybrid",
          splitFeePercentage: parseFloat(splitFeePercentage) || 50.0,
          payoutTerms: payoutTerms?.trim() || existingShare.payoutTerms,
          isActive: Boolean(isActive),
        },
      });
    } else {
      const shareToken = `ps_${crypto.randomBytes(16).toString("hex")}`;
      partnerShare = await prisma.partnerShare.create({
        data: {
          agencyId: session.user.agencyId,
          mandateId,
          shareToken,
          maskedClientTitle: maskedClientTitle.trim(),
          maskedLocation: maskedLocation?.trim() || mandate.location || "Hybrid",
          splitFeePercentage: parseFloat(splitFeePercentage) || 50.0,
          payoutTerms: payoutTerms?.trim() || "Payable 30 days upon candidate 90-day probation clearance and invoice realization.",
          isActive: true,
        },
      });
    }

    // Record audit event
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: "ANONYMIZED_PARTNER_SHARE_CONFIGURED",
        entity: "PartnerShare",
        entityId: partnerShare.id,
        metadata: {
          jobTitle: mandate.title,
          maskedClientTitle: partnerShare.maskedClientTitle,
          splitFeePercentage: partnerShare.splitFeePercentage,
          shareToken: partnerShare.shareToken,
        },
      },
    });

    return NextResponse.json({
      message: "Anonymized partner share link configured successfully.",
      partnerShare,
    });
  } catch (error: any) {
    console.error("Error configuring partner share:", error);
    return NextResponse.json({ error: error.message || "Failed to configure partner share" }, { status: 500 });
  }
}

