import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/candidates/[id]/silver-medalist - Tag or untag candidate as Silver Medalist (RC-07)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const candidateId = params.id;
    const body = await req.json();
    const { isSilverMedalist = true, reason } = body;

    // Verify candidate belongs to agency
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        agencyId: session.user.agencyId,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        isSilverMedalist: Boolean(isSilverMedalist),
        silverMedalistReason: isSilverMedalist ? reason?.trim() || "Finalist candidate pre-vetted in final client interview rounds." : null,
      },
    });

    // Record audit event
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: isSilverMedalist ? "CANDIDATE_TAGGED_SILVER_MEDALIST" : "CANDIDATE_UNTAGGED_SILVER_MEDALIST",
        entity: "Candidate",
        entityId: candidate.id,
        metadata: {
          candidateName: candidate.fullName,
          isSilverMedalist,
          reason: updated.silverMedalistReason,
        },
      },
    });

    return NextResponse.json({
      message: isSilverMedalist
        ? `Candidate '${candidate.fullName}' tagged as Silver Medalist.`
        : `Candidate '${candidate.fullName}' removed from Silver Medalist pool.`,
      candidate: updated,
    });
  } catch (error: any) {
    console.error("Error updating silver medalist status:", error);
    return NextResponse.json({ error: error.message || "Failed to update silver medalist status" }, { status: 500 });
  }
}

