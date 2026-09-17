import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppInterviewSlotSelection } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// POST /api/candidates/[id]/send-slot-invitation
// Manually triggers / re-triggers the candidate WhatsApp 4-option slot picker (CE-01)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.agencyId) {
      return NextResponse.json(
        { error: "Unauthorized: Missing agency tenant session" },
        { status: 401 }
      );
    }

    const candidateId = params.id;
    const body = await req.json().catch(() => ({}));
    const { submissionId, slots, customTimes } = body;

    // Fetch candidate and active submission
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        submissions: {
          where: submissionId ? { id: submissionId } : undefined,
          include: {
            mandate: {
              include: {
                client: true,
              },
            },
            agency: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const submission = candidate.submissions[0];
    if (!submission) {
      return NextResponse.json(
        { error: "No submission found for this candidate." },
        { status: 404 }
      );
    }

    if (!candidate.phone) {
      return NextResponse.json(
        { error: "Candidate does not have a phone number on profile." },
        { status: 400 }
      );
    }

    // Determine slots: from body.slots, or body.customTimes, or submission.preferredInterviewTimes
    let slotOptions: Array<{ id: string; title: string; description?: string }> = [];

    if (Array.isArray(slots) && slots.length > 0) {
      slotOptions = slots.slice(0, 3).map((s: any, idx: number) => ({
        id: `SLOT_${idx + 1}`,
        title: s.title ? String(s.title).slice(0, 24) : `Option ${idx + 1}`,
        description: s.description ? String(s.description).slice(0, 72) : `Proposed Option ${idx + 1}`,
      }));
    } else {
      const timesStr = customTimes || submission.preferredInterviewTimes;
      if (timesStr) {
        const parts = String(timesStr).split("|").map((p: string) => p.trim()).filter(Boolean);
        slotOptions = parts.slice(0, 3).map((p: string, idx: number) => {
          const cleanTitle = p.replace(/^Slot \d+:\s*/i, "").trim();
          return {
            id: `SLOT_${idx + 1}`,
            title: cleanTitle.slice(0, 24),
            description: `Proposed Option ${idx + 1}`,
          };
        });
      }
    }

    if (slotOptions.length === 0) {
      // If no slots stored yet, provide default slots for testing
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const d1 = tomorrow.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const d2 = dayAfter.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      slotOptions = [
        { id: "SLOT_1", title: `${d1} @ 11:00 AM`.slice(0, 24), description: "Primary Slot" },
        { id: "SLOT_2", title: `${d2} @ 3:00 PM`.slice(0, 24), description: "Alternative Slot" },
      ];
    }

    const result = await sendWhatsAppInterviewSlotSelection({
      candidateName: candidate.fullName,
      candidatePhone: candidate.phone,
      roleTitle: submission.mandate.title,
      clientOrgName: submission.mandate.client.name,
      agencyName: submission.agency.name,
      submissionId: submission.id,
      slots: slotOptions,
    });

    return NextResponse.json({
      success: true,
      message: `WhatsApp slot picker dispatched to ${candidate.fullName}!`,
      slotsSent: slotOptions,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/candidates/[id]/send-slot-invitation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch slot invitation" },
      { status: 500 }
    );
  }
}
