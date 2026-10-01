import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MandateStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// PATCH /api/mandates/[id] - Update Mandate Status (Close / Retire / Re-activate)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const mandateId = params.id;
    const body = await req.json();
    const { status, closeReason, recycleCandidates } = body;

    let targetStatus: MandateStatus = status as MandateStatus;
    if (status === "ACTIVE" || status === "ACTIVE_ASSIGNED" || status === "OPEN") {
      targetStatus = MandateStatus.ACTIVE_ASSIGNED;
    }

    const mandate = await prisma.jobMandate.findFirst({
      where: { id: mandateId, agencyId },
      include: {
        client: true,
        submissions: {
          include: { candidate: true },
        },
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    const updatedMandate = await prisma.$transaction(async (tx) => {
      // 1. Update mandate status
      const updated = await tx.jobMandate.update({
        where: { id: mandateId },
        data: {
          status: targetStatus,
        },
      });

      // 2. Recycle candidates to Talent Bank if requested
      if (recycleCandidates && mandate.submissions.length > 0) {
        for (const sub of mandate.submissions) {
          if (sub.candidateJobStatus !== "JOINED") {
            await tx.candidate.update({
              where: { id: sub.candidateId },
              data: {
                isSilverMedalist: true,
                silverMedalistReason: `Recycled from closed search '${mandate.title}' (${mandate.client.name}): ${closeReason || "Role closed / alternate selection"}`,
              },
            });
          }
        }
      }

      // 3. Log audit trail
      await tx.auditLog.create({
        data: {
          agencyId,
          userId: session.user.id,
          action: "MANDATE_STATUS_UPDATED",
          entity: "JobMandate",
          entityId: mandate.id,
          metadata: {
            mandateTitle: mandate.title,
            clientName: mandate.client.name,
            oldStatus: mandate.status,
            newStatus: status,
            closeReason: closeReason || null,
            recycledCount: recycleCandidates ? mandate.submissions.length : 0,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: `Mandate '${mandate.title}' status updated to ${status.replace(/_/g, " ")}.`,
      mandate: updatedMandate,
    });
  } catch (error: any) {
    console.error("Error updating mandate status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update mandate status." },
      { status: 500 }
    );
  }
}

// DELETE /api/mandates/[id] - Soft-delete mandate by moving to MandateTrashBin
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const mandateId = params.id;

    let deletionReason = "User removed from panel";
    try {
      const body = await req.json();
      if (body.reason) deletionReason = body.reason;
    } catch {
      // Body is optional
    }

    const mandate = await prisma.jobMandate.findFirst({
      where: { id: mandateId, agencyId },
      include: {
        client: true,
        submissions: {
          include: { candidate: true },
        },
        placementInvoices: true,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    // Safety guardrail: If an active paid placement invoice exists, prevent hard purge
    if (mandate.placementInvoices.some((inv) => inv.status === "PAID")) {
      return NextResponse.json(
        {
          error: "Cannot delete a mandate with verified paid placement invoices. Please close or archive the mandate instead.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Move snapshot to MandateTrashBin
      await tx.mandateTrashBin.create({
        data: {
          agencyId,
          originalMandateId: mandate.id,
          title: mandate.title,
          clientName: mandate.client?.name || "Client",
          mandateSnapshot: {
            title: mandate.title,
            clientId: mandate.clientId,
            clientName: mandate.client?.name,
            minCtc: mandate.minCtc,
            maxCtc: mandate.maxCtc,
            currency: mandate.currency,
            minExp: mandate.minExp,
            maxExp: mandate.maxExp,
            location: mandate.location,
            skills: mandate.skills,
            description: mandate.description,
            priority: mandate.priority,
            feePercentage: mandate.feePercentage,
            guaranteeDays: mandate.guaranteeDays,
            source: mandate.source,
            createdAt: mandate.createdAt,
            submissionsCount: mandate.submissions.length,
          },
          deletedByUserId: session.user.id,
          deletedByUserName: session.user.name || session.user.email,
          deletionReason,
        },
      });

      // 2. Clean up associated cascade items
      await tx.jobBroadcast.deleteMany({ where: { mandateId } });
      await tx.partnerShare.deleteMany({ where: { mandateId } });
      await tx.clientPortalShare.deleteMany({ where: { mandateId } });
      await tx.interviewSchedule.deleteMany({ where: { mandateId } });
      await tx.callLog.deleteMany({ where: { mandateId } });
      await tx.placementInvoice.deleteMany({ where: { mandateId } });
      await tx.candidateSubmission.deleteMany({ where: { mandateId } });

      // 3. Delete the JobMandate record from main table
      await tx.jobMandate.delete({ where: { id: mandateId } });

      // 4. Log Audit Trail
      await tx.auditLog.create({
        data: {
          agencyId,
          userId: session.user.id,
          action: "MANDATE_MOVED_TO_TRASH",
          entity: "JobMandate",
          entityId: mandateId,
          metadata: {
            mandateTitle: mandate.title,
            clientName: mandate.client?.name,
            deletionReason,
          },
        },
      });
    });

    return NextResponse.json({
      message: `Mandate '${mandate.title}' moved to Trash Bin successfully.`,
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting mandate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete mandate." },
      { status: 500 }
    );
  }
}
