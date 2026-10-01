import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/candidates/[id] - Soft-delete candidate by moving to CandidateTrashBin
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const candidateId = params.id;

    let deletionReason = "User deleted profile from Talent Bank";
    try {
      const body = await req.json();
      if (body.reason) deletionReason = body.reason;
    } catch {
      // Body is optional
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, agencyId },
      include: {
        submissions: {
          include: { mandate: { select: { id: true, title: true } } },
        },
        callLogs: true,
        interviews: true,
        placementInvoices: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    // Safety guardrail: If confirmed placement invoice is active, prevent delete
    if (candidate.placementInvoices.some((inv) => inv.status === "PAID")) {
      return NextResponse.json(
        {
          error: "Cannot delete a candidate with paid placement invoices on record for compliance reasons.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
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
            createdAt: candidate.createdAt,
            submissions: candidate.submissions.map((s) => ({
              mandateId: s.mandateId,
              mandateTitle: s.mandate.title,
              stage: s.stage,
              status: s.candidateJobStatus,
            })),
            callLogsCount: candidate.callLogs.length,
          },
          deletedByUserId: session.user.id,
          deletedByUserName: session.user.name || session.user.email,
          deletionReason,
        },
      });

      // 2. Cascade delete linked items
      await tx.interviewSchedule.deleteMany({ where: { candidateId } });
      await tx.callLog.deleteMany({ where: { candidateId } });
      await tx.candidateSubmission.deleteMany({ where: { candidateId } });
      await tx.placementInvoice.deleteMany({ where: { candidateId } });

      // 3. Delete Candidate record from main table
      await tx.candidate.delete({ where: { id: candidateId } });

      // 4. Record Audit Log
      await tx.auditLog.create({
        data: {
          agencyId,
          userId: session.user.id,
          action: "CANDIDATE_MOVED_TO_TRASH",
          entity: "Candidate",
          entityId: candidateId,
          metadata: {
            candidateName: candidate.fullName,
            candidateEmail: candidate.email,
            candidatePhone: candidate.phone,
            deletionReason,
          },
        },
      });
    });

    return NextResponse.json({
      message: `Candidate '${candidate.fullName}' moved to Trash Bin.`,
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete candidate." },
      { status: 500 }
    );
  }
}
