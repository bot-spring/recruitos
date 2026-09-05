import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CallDisposition } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/mandates/[id]/call-log - Log Structured Recruiter Call Disposition & Notes
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const mandateId = params.id;
    const body = await req.json();
    const {
      submissionId,
      disposition,
      notes,
      readyToRelocate,
      relevantExpYears,
      currentSalary,
      expectedSalary,
      noticePeriod,
      reasonForLeaving,
      offerInHand,
    } = body;

    if (!submissionId || !disposition || typeof disposition !== "string" || disposition.trim() === "") {
      return NextResponse.json(
        { error: "Please select a valid call outcome disposition before saving." },
        { status: 400 }
      );
    }

    // Verify submission belongs to this mandate and agency
    const submission = await prisma.candidateSubmission.findFirst({
      where: { id: submissionId, mandateId, agencyId },
      include: { candidate: true, mandate: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Candidate submission record not found." }, { status: 404 });
    }

    // Execute in transaction: Create CallLog & Update Submission
    const result = await prisma.$transaction(async (tx) => {
      const callLog = await tx.callLog.create({
        data: {
          agencyId,
          submissionId: submission.id,
          candidateId: submission.candidateId,
          mandateId: submission.mandateId,
          recruiterId: session.user.id,
          disposition: disposition as CallDisposition,
          notes: notes?.trim() || null,
          calledAt: new Date(),
        },
        include: {
          recruiter: { select: { id: true, name: true, email: true } },
        },
      });

      const parsedRelExp = relevantExpYears !== undefined && relevantExpYears !== null && relevantExpYears !== ""
        ? parseFloat(String(relevantExpYears))
        : undefined;

      const updatedSubmission = await tx.candidateSubmission.update({
        where: { id: submission.id },
        data: {
          lastCallDisposition: disposition as CallDisposition,
          lastCallNotes: notes?.trim() || null,
          lastCallAt: new Date(),
          readyToRelocate: readyToRelocate !== undefined ? readyToRelocate : submission.readyToRelocate,
          relevantExpYears: parsedRelExp !== undefined ? parsedRelExp : submission.relevantExpYears,
          currentSalary: currentSalary !== undefined ? currentSalary : submission.currentSalary,
          expectedSalary: expectedSalary !== undefined ? expectedSalary : submission.expectedSalary,
          noticePeriod: noticePeriod !== undefined ? noticePeriod : submission.noticePeriod,
          reasonForLeaving: reasonForLeaving !== undefined ? reasonForLeaving : submission.reasonForLeaving,
          offerInHand: offerInHand !== undefined ? offerInHand : submission.offerInHand,
          updatedAt: new Date(),
        },
      });

      // Log Audit Trail
      await tx.auditLog.create({
        data: {
          agencyId,
          userId: session.user.id,
          action: "RECRUITER_CALL_LOGGED",
          entity: "CandidateSubmission",
          entityId: submission.id,
          metadata: {
            candidateName: submission.candidate.fullName,
            mandateTitle: submission.mandate.title,
            disposition,
            notes: notes?.trim() || "",
          },
        },
      });

      return { callLog, submission: updatedSubmission };
    });

    return NextResponse.json({
      message: `Call outcome logged: '${disposition.replace(/_/g, " ")}' for ${submission.candidate.fullName}.`,
      callLog: result.callLog,
      submission: result.submission,
    });
  } catch (error: any) {
    console.error("Error logging call outcome:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log call outcome" },
      { status: 500 }
    );
  }
}

