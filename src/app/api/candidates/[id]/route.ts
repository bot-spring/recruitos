import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, CandidateJobStatus } from "@prisma/client";

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

// PATCH /api/candidates/[id] - Update candidate pipeline stage or details
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const candidateId = params.id;
    const body = await req.json();
    const { status, submissionId } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    // Determine target stage
    const validStages = Object.values(SubmissionStage);
    const targetStage = validStages.includes(status as SubmissionStage)
      ? (status as SubmissionStage)
      : SubmissionStage.SCREENED_QUALIFIED;

    // Map to CandidateJobStatus if applicable
    let jobStatus: CandidateJobStatus = CandidateJobStatus.NOT_SHARED;
    if (targetStage === SubmissionStage.SUBMITTED_TO_CLIENT) {
      jobStatus = CandidateJobStatus.SHARED_WITH_COMPANY;
    } else if (targetStage === SubmissionStage.CLIENT_SHORTLISTED || targetStage === SubmissionStage.INTERVIEW_SCHEDULED) {
      jobStatus = CandidateJobStatus.SELECTED_FOR_NEXT_ROUND;
    } else if (targetStage === SubmissionStage.OFFER_ISSUED || targetStage === SubmissionStage.OFFER_ACCEPTED) {
      jobStatus = CandidateJobStatus.OFFERED;
    } else if (targetStage === SubmissionStage.STAGE_REJECTED) {
      jobStatus = CandidateJobStatus.REJECTED;
    } else if (targetStage === SubmissionStage.JOINED_DAY_1_ACTIVE) {
      jobStatus = CandidateJobStatus.JOINED;
    }

    let updatedSubmission = null;

    if (submissionId) {
      const existing = await prisma.candidateSubmission.findFirst({
        where: { id: submissionId, agencyId },
      });
      if (existing) {
        updatedSubmission = await prisma.candidateSubmission.update({
          where: { id: existing.id },
          data: {
            stage: targetStage,
            candidateJobStatus: jobStatus,
            updatedAt: new Date(),
          },
        });
      }
    } else {
      // Find latest submission for this candidate in this agency
      const latestSub = await prisma.candidateSubmission.findFirst({
        where: { candidateId, agencyId },
        orderBy: { updatedAt: "desc" },
      });
      if (latestSub) {
        updatedSubmission = await prisma.candidateSubmission.update({
          where: { id: latestSub.id },
          data: {
            stage: targetStage,
            candidateJobStatus: jobStatus,
            updatedAt: new Date(),
          },
        });
      } else {
        // If candidate doesn't have an active submission, attach to the most recent active mandate
        const firstMandate = await prisma.jobMandate.findFirst({
          where: {
            agencyId,
            status: { notIn: ["CLOSED_FULFILLED", "CLOSED_CANCELLED"] },
          },
          orderBy: { createdAt: "desc" },
        });
        if (firstMandate) {
          updatedSubmission = await prisma.candidateSubmission.create({
            data: {
              agencyId,
              candidateId,
              mandateId: firstMandate.id,
              submittedByUserId: session.user.id,
              stage: targetStage,
              candidateJobStatus: jobStatus,
            },
          });
        }
      }
    }

    // Touch candidate updatedAt
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      stage: targetStage,
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error("Error updating candidate status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update candidate status." },
      { status: 500 }
    );
  }
}

