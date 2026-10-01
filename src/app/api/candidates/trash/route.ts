import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/candidates/trash - List all soft-deleted candidates in Trash Bin
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const trashItems = await prisma.candidateTrashBin.findMany({
      where: { agencyId: session.user.agencyId },
      orderBy: { deletedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ trashItems });
  } catch (error: any) {
    console.error("Error fetching candidate trash bin:", error);
    return NextResponse.json({ error: "Failed to fetch trash items." }, { status: 500 });
  }
}

// POST /api/candidates/trash/restore - Restore a candidate from Trash Bin back into live Talent Bank
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const { trashId } = await req.json();
    if (!trashId) {
      return NextResponse.json({ error: "trashId is required." }, { status: 400 });
    }

    const trashRecord = await prisma.candidateTrashBin.findFirst({
      where: { id: trashId, agencyId: session.user.agencyId },
    });

    if (!trashRecord) {
      return NextResponse.json({ error: "Trash record not found." }, { status: 404 });
    }

    const snapshot: any = trashRecord.candidateSnapshot;

    // Check if another candidate currently exists with same email or phone
    const existing = await prisma.candidate.findFirst({
      where: {
        agencyId: session.user.agencyId,
        OR: [
          { email: trashRecord.email },
          { phoneNormalized: trashRecord.phoneNormalized },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Cannot restore: an active candidate profile with email '${trashRecord.email}' or phone '${trashRecord.phone}' already exists.`,
        },
        { status: 409 }
      );
    }

    const restored = await prisma.$transaction(async (tx) => {
      // 1. Re-create Candidate in main table
      const newCandidate = await tx.candidate.create({
        data: {
          agencyId: session.user.agencyId!,
          fullName: snapshot.fullName || trashRecord.fullName,
          email: trashRecord.email,
          phone: trashRecord.phone,
          phoneNormalized: trashRecord.phoneNormalized,
          currentCompany: snapshot.currentCompany || null,
          currentTitle: snapshot.currentTitle || null,
          totalExpYears: snapshot.totalExpYears || 0,
          currentCtc: snapshot.currentCtc || null,
          expectedCtc: snapshot.expectedCtc || null,
          currency: snapshot.currency || "INR",
          noticePeriodDays: snapshot.noticePeriodDays || 30,
          location: snapshot.location || null,
          skills: snapshot.skills || [],
          summary: snapshot.summary || null,
          qualification: snapshot.qualification || null,
          source: snapshot.source || "RESTORED_FROM_TRASH",
          resumeUrl: snapshot.resumeUrl || null,
          rawResumeText: snapshot.rawResumeText || null,
          isSilverMedalist: snapshot.isSilverMedalist || false,
          silverMedalistReason: snapshot.silverMedalistReason || null,
          lastCallDisposition: snapshot.lastCallDisposition || null,
          lastCallNotes: snapshot.lastCallNotes || null,
        },
      });

      // 2. Remove from trash bin
      await tx.candidateTrashBin.delete({ where: { id: trashRecord.id } });

      // 3. Log audit trail
      await tx.auditLog.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          action: "CANDIDATE_RESTORED_FROM_TRASH",
          entity: "Candidate",
          entityId: newCandidate.id,
          metadata: {
            candidateName: newCandidate.fullName,
            candidateEmail: newCandidate.email,
          },
        },
      });

      return newCandidate;
    });

    return NextResponse.json({
      message: `Candidate '${restored.fullName}' restored successfully to Talent Bank.`,
      candidate: restored,
    });
  } catch (error: any) {
    console.error("Error restoring candidate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore candidate." },
      { status: 500 }
    );
  }
}
