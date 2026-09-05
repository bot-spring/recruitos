import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MandateStatus, ClientStatus, SlaStatus } from "@prisma/client";
import { sendClientOnboardingWelcomeEmail } from "@/lib/email";

// POST /api/mandates/[id]/approve - Owner/TL verification, commercial terms lock & recruiter allocation
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    // Role Gate: Only Agency Owners and Team Leads can verify & approve commercial terms
    if (session.user.role !== "AGENCY_OWNER" && session.user.role !== "TEAM_LEAD" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Agency Owners and Team Leads are authorized to approve client accounts and set commercial terms." },
        { status: 403 }
      );
    }

    const mandateId = params.id;
    const body = await req.json();
    const { assignedRecruiterId, feePercentage, guaranteeDays, slaTargetHours } = body;

    if (!assignedRecruiterId) {
      return NextResponse.json({ error: "Please select an assigned desk recruiter for this mandate." }, { status: 400 });
    }

    // Verify mandate exists and belongs to this agency
    const mandate = await prisma.jobMandate.findUnique({
      where: { id: mandateId },
      include: {
        client: true,
        contact: true,
        agency: true,
      },
    });

    if (!mandate || mandate.agencyId !== session.user.agencyId) {
      return NextResponse.json({ error: "Mandate not found or does not belong to your agency." }, { status: 404 });
    }

    // Verify assigned recruiter belongs to this agency and is active
    const recruiter = await prisma.user.findFirst({
      where: {
        id: assignedRecruiterId,
        agencyId: session.user.agencyId,
        isActive: true,
      },
    });

    if (!recruiter) {
      return NextResponse.json({ error: "Selected recruiter is invalid or inactive." }, { status: 400 });
    }

    const approvedFee = feePercentage ? parseFloat(feePercentage) : mandate.feePercentage;
    const approvedGuarantee = guaranteeDays ? parseInt(guaranteeDays, 10) : mandate.guaranteeDays;
    const approvedSlaHours = slaTargetHours ? parseInt(slaTargetHours, 10) : mandate.slaTargetHours;

    // Atomic Transaction: Promote ClientAccount -> ACTIVE, Update JobMandate -> ACTIVE_ASSIGNED, Log Audit
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Promote ClientAccount to ACTIVE
      await tx.clientAccount.update({
        where: { id: mandate.clientId },
        data: { status: ClientStatus.ACTIVE },
      });

      // 2. Update JobMandate
      const updatedMandate = await tx.jobMandate.update({
        where: { id: mandateId },
        data: {
          status: MandateStatus.ACTIVE_ASSIGNED,
          assignedRecruiterId: recruiter.id,
          feePercentage: approvedFee,
          guaranteeDays: approvedGuarantee,
          slaTargetHours: approvedSlaHours,
          slaStartedAt: new Date(),
          slaStatus: SlaStatus.HEALTHY,
          approvedAt: new Date(),
          approvedByUserId: session.user.id,
        },
      });

      // 3. Create Audit Trail
      await tx.auditLog.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          action: "MANDATE_VERIFIED_AND_ASSIGNED",
          entity: "JobMandate",
          entityId: mandate.id,
          metadata: {
            clientName: mandate.client.name,
            jobTitle: mandate.title,
            assignedRecruiter: recruiter.name,
            feePercentage: approvedFee,
            slaHours: approvedSlaHours,
          },
        },
      });

      return updatedMandate;
    });

    // 4. Trigger Client Onboarding Welcome Email
    if (mandate.contact?.email) {
      await sendClientOnboardingWelcomeEmail({
        to: mandate.contact.email,
        clientContactName: mandate.contact.name,
        companyName: mandate.client.name,
        jobTitle: mandate.title,
        agencyName: mandate.agency.name,
        mandateId: mandate.id,
        feePercentage: approvedFee,
        guaranteeDays: approvedGuarantee,
        slaHours: approvedSlaHours,
        recruiterName: recruiter.name,
        recruiterEmail: recruiter.email,
      });
    }

    return NextResponse.json({
      message: "Mandate approved and assigned successfully.",
      mandate: updated,
    });
  } catch (error: any) {
    console.error("Error approving mandate:", error);
    return NextResponse.json({ error: error.message || "Failed to approve mandate" }, { status: 500 });
  }
}

