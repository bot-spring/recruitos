import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, CounterOfferRisk } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/offers/[id]/pre-offer-lock - Lock offer CTC, joining date, & generate resignation letter (RC-06)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const submissionId = params.id;
    const body = await req.json();
    const {
      offeredCtc,
      offeredJoiningDate,
      resignationDate,
      currentManagerName = "Reporting Manager",
      noticePeriodDays = 30,
      customResignationNotes,
    } = body;

    if (!offeredCtc || !offeredJoiningDate) {
      return NextResponse.json(
        { error: "Offered CTC and Confirmed Joining Date are required to lock offer." },
        { status: 400 }
      );
    }

    // 1. Fetch submission with candidate and mandate details
    const submission = await prisma.candidateSubmission.findFirst({
      where: {
        id: submissionId,
        agencyId: session.user.agencyId,
      },
      include: {
        candidate: true,
        mandate: { include: { client: true, agency: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Candidate submission not found." }, { status: 404 });
    }

    const parsedJoiningDate = new Date(offeredJoiningDate);
    const parsedResignationDate = resignationDate ? new Date(resignationDate) : new Date();

    const formattedJoiningDate = parsedJoiningDate.toLocaleDateString("en-US", {
      dateStyle: "full",
    });

    // 2. Generate Professional Counter-Offer Immunized Resignation Letter
    const resignationDraft = `
Date: ${parsedResignationDate.toLocaleDateString("en-US", { dateStyle: "long" })}

To: ${currentManagerName}
Company: ${submission.candidate.currentCompany || "Current Organization"}

Dear ${currentManagerName},

Please accept this formal letter as notice of my resignation from my position as ${submission.candidate.currentTitle || "Software Engineer"}. In accordance with my employment terms, my final working day will be ${new Date(parsedResignationDate.getTime() + noticePeriodDays * 24 * 3600 * 1000).toLocaleDateString("en-US", { dateStyle: "long" })}.

I want to express my sincere appreciation for the opportunities and professional development I have experienced during my time with the company. Over the coming ${noticePeriodDays} days, I am fully committed to ensuring a smooth and comprehensive handover of all my active projects and responsibilities.

${customResignationNotes ? `Note: ${customResignationNotes}\n` : ""}
I wish the team and the organization continued growth and success.

Sincerely,
${submission.candidate.fullName}
${submission.candidate.email} | ${submission.candidate.phone}
`.trim();

    // 3. Update Submission with Offer Lockdown details
    const updatedSubmission = await prisma.candidateSubmission.update({
      where: { id: submission.id },
      data: {
        stage: SubmissionStage.OFFER_ACCEPTED,
        offeredCtc: parseFloat(String(offeredCtc)),
        offeredJoiningDate: parsedJoiningDate,
        resignationDate: parsedResignationDate,
        resignationLetterDraft: resignationDraft,
        counterOfferRiskLevel: CounterOfferRisk.LOW,
        counterOfferRiskReason: "Offer locked and counter-offer immunization briefing completed.",
        updatedAt: new Date(),
      },
    });

    // 4. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: "OFFER_LOCKED_AND_PLAYBOOK_GENERATED",
        entity: "CandidateSubmission",
        entityId: submission.id,
        metadata: {
          candidateName: submission.candidate.fullName,
          jobTitle: submission.mandate.title,
          clientName: submission.mandate.client.name,
          offeredCtc: parseFloat(String(offeredCtc)),
          joiningDate: formattedJoiningDate,
        },
      },
    });

    return NextResponse.json({
      message: `Offer locked for '${submission.candidate.fullName}'. Resignation playbook & letter generated successfully!`,
      submission: updatedSubmission,
      resignationDraft,
    });
  } catch (error: any) {
    console.error("Error locking offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lock offer and generate resignation playbook" },
      { status: 500 }
    );
  }
}

