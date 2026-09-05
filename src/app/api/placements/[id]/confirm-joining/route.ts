import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CandidateJobStatus, InvoiceStatus, ProbationStatus, SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/placements/[id]/confirm-joining - Confirm Day 1 Joining & Generate Invoice (RC-06)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const submissionId = params.id;
    const body = await req.json();
    const {
      actualJoiningDate = new Date().toISOString(),
      agreedCtc,
      clientBillingEmail,
      clientGstin,
    } = body;

    const submission = await prisma.candidateSubmission.findFirst({
      where: {
        id: submissionId,
        agencyId: session.user.agencyId,
      },
      include: {
        candidate: true,
        mandate: {
          include: { client: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Candidate submission record not found." }, { status: 404 });
    }

    const joiningDate = new Date(actualJoiningDate);
    const guaranteeDays = submission.mandate.guaranteeDays || 90;
    const probationEndDate = new Date(joiningDate.getTime() + guaranteeDays * 24 * 60 * 60 * 1000);

    const agreedCtcNum = parseFloat(agreedCtc) || (submission.candidate.expectedCtc || 10);
    // If agreedCtc is provided in LPA (e.g. 24 or 30), normalize to INR
    const ctcInr = agreedCtcNum < 1000 ? agreedCtcNum * 100000 : agreedCtcNum;
    const feePercentage = submission.mandate.feePercentage || 8.33;
    const baseFeeAmount = Math.round((ctcInr * feePercentage) / 100);
    const taxAmount = Math.round(baseFeeAmount * 0.18);
    const totalInvoiceAmount = baseFeeAmount + taxAmount;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const dueDate = new Date(joiningDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day net terms

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Candidate Submission
      const updatedSub = await tx.candidateSubmission.update({
        where: { id: submission.id },
        data: {
          stage: SubmissionStage.JOINED_DAY_1_ACTIVE,
          candidateJobStatus: CandidateJobStatus.JOINED,
          probationStatus: ProbationStatus.ACTIVE_TRACKING,
          probationEndDate: probationEndDate,
          actualJoiningDate: joiningDate,
        },
      });

      // 2. Create Placement Tax Invoice
      const invoice = await tx.placementInvoice.create({
        data: {
          agencyId: submission.agencyId,
          submissionId: submission.id,
          mandateId: submission.mandateId,
          candidateId: submission.candidateId,
          clientId: submission.mandate.clientId,
          invoiceNumber,
          baseFeeAmount,
          feePercentage,
          taxPercentage: 18.0,
          taxAmount,
          totalInvoiceAmount,
          currency: "INR",
          status: InvoiceStatus.DISPATCHED,
          issuedAt: joiningDate,
          dueDate,
          clientBillingName: submission.mandate.client.name,
          clientBillingEmail: clientBillingEmail || null,
          clientGstin: clientGstin || null,
          paymentTermsNotes: "Payment due strictly within 30 days of candidate joining date.",
        },
      });

      return { updatedSub, invoice };
    });

    return NextResponse.json({
      success: true,
      submission: result.updatedSub,
      invoice: result.invoice,
    });
  } catch (error: any) {
    console.error("Failed to confirm joining placement:", error);
    return NextResponse.json({ error: error.message || "Failed to confirm candidate joining." }, { status: 500 });
  }
}
