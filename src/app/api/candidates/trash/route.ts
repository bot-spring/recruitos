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

    const { trashId, trashIds } = await req.json();

    // Support single or batch restore
    const idsToRestore: string[] = trashIds && Array.isArray(trashIds) ? trashIds : trashId ? [trashId] : [];
    if (idsToRestore.length === 0) {
      return NextResponse.json({ error: "trashId or trashIds array is required." }, { status: 400 });
    }

    const trashRecords = await prisma.candidateTrashBin.findMany({
      where: { id: { in: idsToRestore }, agencyId: session.user.agencyId },
    });

    if (trashRecords.length === 0) {
      return NextResponse.json({ error: "Trash record(s) not found." }, { status: 404 });
    }

    let restoredCount = 0;
    const restoredCandidates: any[] = [];
    const conflicts: string[] = [];

    for (const trashRecord of trashRecords) {
      const snapshot: any = trashRecord.candidateSnapshot;

      // Check if another candidate currently exists with same email or phone
      const existing = await prisma.candidate.findFirst({
        where: {
          agencyId: session.user.agencyId,
          OR: [
            { email: trashRecord.email },
            ...(trashRecord.phoneNormalized ? [{ phoneNormalized: trashRecord.phoneNormalized }] : []),
          ],
        },
      });

      if (existing) {
        conflicts.push(`'${trashRecord.fullName}' (${trashRecord.email})`);
        continue;
      }

      await prisma.$transaction(async (tx) => {
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

        await tx.candidateTrashBin.delete({ where: { id: trashRecord.id } });

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

        restoredCandidates.push(newCandidate);
        restoredCount++;
      });
    }

    if (restoredCount === 0 && conflicts.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot restore: active profile(s) with conflicting email/phone already exist for ${conflicts.join(", ")}.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: `${restoredCount} candidate(s) restored successfully to Talent Bank.`,
      restoredCount,
      candidates: restoredCandidates,
      conflicts,
    });
  } catch (error: any) {
    console.error("Error restoring candidate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore candidate." },
      { status: 500 }
    );
  }
}

// DELETE /api/candidates/trash - Batch move active candidates to Trash Bin
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const body = await req.json();
    const { candidateIds, reason } = body;

    const ids: string[] = Array.isArray(candidateIds) ? candidateIds : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "candidateIds array is required." }, { status: 400 });
    }

    const deletionReason = reason || `Bulk deleted ${ids.length} candidates from Talent Bank`;

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: ids }, agencyId },
      include: {
        submissions: {
          include: { mandate: { select: { id: true, title: true } } },
        },
        callLogs: true,
        interviews: true,
        placementInvoices: true,
      },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No matching candidate records found." }, { status: 404 });
    }

    // Safety guardrail: filter out any candidate with paid placement invoices
    const eligibleCandidates = candidates.filter(
      (c) => !c.placementInvoices.some((inv) => inv.status === "PAID")
    );
    const blockedCount = candidates.length - eligibleCandidates.length;

    if (eligibleCandidates.length === 0) {
      return NextResponse.json(
        { error: "Selected candidate(s) have verified paid placement invoices on record and cannot be deleted." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const candidate of eligibleCandidates) {
        // 1. Move snapshot into CandidateTrashBin
        await tx.candidateTrashBin.create({
          data: {
            agencyId,
            originalCandidateId: candidate.id,
            fullName: candidate.fullName,
            email: candidate.email,
            phone: candidate.phone,
            phoneNormalized: candidate.phoneNormalized,
            candidateSnapshot: {
              id: candidate.id,
              fullName: candidate.fullName,
              email: candidate.email,
              phone: candidate.phone,
              currentCompany: candidate.currentCompany,
              currentTitle: candidate.currentTitle,
              totalExpYears: candidate.totalExpYears,
              currentCtc: candidate.currentCtc,
              expectedCtc: candidate.expectedCtc,
              currency: candidate.currency,
              noticePeriodDays: candidate.noticePeriodDays,
              location: candidate.location,
              skills: candidate.skills,
              summary: candidate.summary,
              qualification: candidate.qualification,
              source: candidate.source,
              resumeUrl: candidate.resumeUrl,
              rawResumeText: candidate.rawResumeText,
              isSilverMedalist: candidate.isSilverMedalist,
              silverMedalistReason: candidate.silverMedalistReason,
              lastCallDisposition: candidate.lastCallDisposition,
              lastCallNotes: candidate.lastCallNotes,
              submissions: candidate.submissions.map((s) => ({
                id: s.id,
                mandateId: s.mandateId,
                mandateTitle: s.mandate?.title,
                stage: s.stage,
                candidateJobStatus: s.candidateJobStatus,
              })),
            },
            deletedByUserId: session.user.id,
            deletedByUserName: session.user.name || session.user.email,
            deletionReason,
          },
        });

        // 2. Cascade delete dependent candidate submissions, calls, interviews, invoices
        await tx.interviewSchedule.deleteMany({ where: { candidateId: candidate.id } });
        await tx.callLog.deleteMany({ where: { candidateId: candidate.id } });
        await tx.candidateSubmission.deleteMany({ where: { candidateId: candidate.id } });
        await tx.placementInvoice.deleteMany({ where: { candidateId: candidate.id } });

        // 3. Delete Candidate
        await tx.candidate.delete({ where: { id: candidate.id } });

        // 4. Log Audit Trail
        await tx.auditLog.create({
          data: {
            agencyId,
            userId: session.user.id,
            action: "CANDIDATE_MOVED_TO_TRASH",
            entity: "Candidate",
            entityId: candidate.id,
            metadata: {
              candidateName: candidate.fullName,
              email: candidate.email,
              deletionReason,
            },
          },
        });
      }
    });

    return NextResponse.json({
      message: `${eligibleCandidates.length} candidate(s) moved to Trash Bin.`,
      deletedCount: eligibleCandidates.length,
      blockedCount,
      deletedIds: eligibleCandidates.map((c) => c.id),
    });
  } catch (error: any) {
    console.error("Error bulk deleting candidates:", error);
    return NextResponse.json({ error: error.message || "Failed to bulk delete candidates." }, { status: 500 });
  }
}
