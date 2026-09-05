import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, MandateStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/super-admin/metrics - Global Master Metrics & Cross-Tenant Revenue Ops (SA-02)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    // 1. Fetch Aggregated Placement Invoices & Platform GMV
    const invoices = await prisma.placementInvoice.findMany({
      select: {
        id: true,
        baseFeeAmount: true,
        taxAmount: true,
        totalInvoiceAmount: true,
        status: true,
        currency: true,
      },
    });

    const totalPlatformGmv = invoices.reduce((sum, inv) => sum + (inv.totalInvoiceAmount || 0), 0);
    const totalBaseFeeEarned = invoices.reduce((sum, inv) => sum + (inv.baseFeeAmount || 0), 0);

    // 2. Fetch Agencies & Seats
    const agencies = await prisma.agency.findMany({
      include: {
        _count: { select: { users: true, jobMandates: true, candidates: true, submissions: true } },
      },
    });

    const totalAgencies = agencies.length;
    const activeAgencies = agencies.filter((a) => a.isActive).length;
    const totalAllocatedSeats = agencies.reduce((sum, a) => sum + a.maxSeats, 0);
    const totalUsedSeats = agencies.reduce((sum, a) => sum + a._count.users, 0);

    // 3. Fetch Mandates & Sourcing Stats
    const totalMandates = await prisma.jobMandate.count();
    const activeMandates = await prisma.jobMandate.count({
      where: {
        status: { in: [MandateStatus.ACTIVE_ASSIGNED, MandateStatus.SOURCING_IN_PROGRESS, MandateStatus.INTERVIEWS_ACTIVE] },
      },
    });
    const probationMandates = await prisma.jobMandate.count({
      where: { status: MandateStatus.PROBATION_TRACKING },
    });

    // 4. Fetch Candidate & Silver Medalist Stats
    const totalCandidates = await prisma.candidate.count();
    const silverMedalists = await prisma.candidate.count({
      where: { isSilverMedalist: true },
    });

    // 5. Fetch Placements & Partner Split Stats
    const totalPlacements = await prisma.candidateSubmission.count({
      where: { stage: SubmissionStage.JOINED_DAY_1_ACTIVE },
    });

    const partnerSubmissions = await prisma.candidateSubmission.count({
      where: { partnerSourcerEmail: { not: null } },
    });

    return NextResponse.json({
      metrics: {
        totalPlatformGmv,
        totalBaseFeeEarned,
        totalInvoicesCount: invoices.length,
        totalAgencies,
        activeAgencies,
        totalAllocatedSeats,
        totalUsedSeats,
        seatUtilizationRate: totalAllocatedSeats > 0 ? Math.round((totalUsedSeats / totalAllocatedSeats) * 100) : 0,
        totalMandates,
        activeMandates,
        probationMandates,
        totalCandidates,
        silverMedalists,
        totalPlacements,
        partnerSubmissions,
      },
    });
  } catch (error: any) {
    console.error("Error calculating master metrics:", error);
    return NextResponse.json({ error: error.message || "Failed to load master metrics" }, { status: 500 });
  }
}

