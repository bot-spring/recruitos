import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeUtf8 } from "@/lib/resume-parser";

export const dynamic = "force-dynamic";

// PATCH /api/interviews/[id] - Update interview meeting link, panelists, status (Scenario B)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const interviewId = params.id;
    const body = await req.json();
    const { meetingLink, status, panelistNames, instructions, location } = body;

    // 1. Verify existence & ownership
    const existing = await prisma.interviewSchedule.findFirst({
      where: {
        id: interviewId,
        agencyId: session.user.agencyId,
      },
      include: {
        candidate: { select: { fullName: true } },
        mandate: { select: { title: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Interview schedule not found." }, { status: 404 });
    }

    // 2. Build update payload
    const updateData: any = {};
    if (meetingLink !== undefined) {
      updateData.meetingLink = meetingLink ? sanitizeUtf8(meetingLink.trim()) : null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (panelistNames !== undefined) {
      updateData.panelistNames = Array.isArray(panelistNames)
        ? panelistNames.map((n: string) => sanitizeUtf8(n.trim())).filter(Boolean)
        : [];
    }
    if (instructions !== undefined) {
      updateData.instructions = sanitizeUtf8(instructions);
    }
    if (location !== undefined) {
      updateData.location = sanitizeUtf8(location);
    }

    const updated = await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: updateData,
    });

    // 3. Log audit entry for tracking
    try {
      await prisma.auditLog.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          action: "INTERVIEW_UPDATED",
          entity: "InterviewSchedule",
          entityId: interviewId,
          metadata: {
            candidateName: existing.candidate.fullName,
            mandateTitle: existing.mandate.title,
            updatedFields: Object.keys(updateData),
          },
        },
      });
    } catch (auditErr) {
      console.warn("Failed to write audit log for interview update:", auditErr);
    }

    return NextResponse.json({
      success: true,
      interview: updated,
      message: "Interview updated successfully.",
    });
  } catch (error: any) {
    console.error("PATCH /api/interviews/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update interview." },
      { status: 500 }
    );
  }
}

