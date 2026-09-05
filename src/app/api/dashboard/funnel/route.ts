import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage, ClientDecision } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/dashboard/funnel - Macro & Mandate-Wise Candidate Funnel Analytics for Agency Owner
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;

    // 1. Fetch all mandates in agency with their submissions, candidate details, and interview schedules
    const mandates = await prisma.jobMandate.findMany({
      where: { agencyId },
      include: {
        client: true,
        contact: true,
        assignedRecruiter: {
          select: { id: true, name: true, email: true },
        },
        submissions: {
          include: {
            candidate: true,
            interviews: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Helper to categorize a submission into the 8 agreed funnel stages
    // 1. Ingested: Any submission attached to mandate
    // 2. Shortlisted: stage is SCREENED_QUALIFIED or beyond
    // 3. Shared with Company: submittedToClientAt exists or stage is SUBMITTED_TO_CLIENT or beyond
    // 4. Selected for Interview: clientDecision == SHORTLISTED_FOR_INTERVIEW or stage is CLIENT_SHORTLISTED / INTERVIEW_SCHEDULED / beyond
    // 5. Interviews Done: has completed interview schedule OR stage is INTERVIEW_COMPLETED / beyond
    // 6. Selected: stage is OFFER_ISSUED or beyond (or client selected)
    // 7. Offered: stage is OFFER_ISSUED, OFFER_ACCEPTED, NOTICE_PERIOD_ACTIVE, JOINED_DAY_1_ACTIVE
    // 8. Joined: stage is JOINED_DAY_1_ACTIVE

    const isShortlisted = (s: any) =>
      [
        SubmissionStage.SCREENED_QUALIFIED,
        SubmissionStage.SUBMITTED_TO_CLIENT,
        SubmissionStage.CLIENT_SHORTLISTED,
        SubmissionStage.INTERVIEW_SCHEDULED,
        SubmissionStage.INTERVIEW_COMPLETED,
        SubmissionStage.OFFER_ISSUED,
        SubmissionStage.OFFER_ACCEPTED,
        SubmissionStage.NOTICE_PERIOD_ACTIVE,
        SubmissionStage.JOINED_DAY_1_ACTIVE,
      ].includes(s.stage);

    const isSharedWithCompany = (s: any) =>
      Boolean(s.submittedToClientAt) ||
      [
        SubmissionStage.SUBMITTED_TO_CLIENT,
        SubmissionStage.CLIENT_SHORTLISTED,
        SubmissionStage.INTERVIEW_SCHEDULED,
        SubmissionStage.INTERVIEW_COMPLETED,
        SubmissionStage.OFFER_ISSUED,
        SubmissionStage.OFFER_ACCEPTED,
        SubmissionStage.NOTICE_PERIOD_ACTIVE,
        SubmissionStage.JOINED_DAY_1_ACTIVE,
      ].includes(s.stage);

    const isSelectedForInterview = (s: any) =>
      s.clientDecision === ClientDecision.SHORTLISTED_FOR_INTERVIEW ||
      [
        SubmissionStage.CLIENT_SHORTLISTED,
        SubmissionStage.INTERVIEW_SCHEDULED,
        SubmissionStage.INTERVIEW_COMPLETED,
        SubmissionStage.OFFER_ISSUED,
        SubmissionStage.OFFER_ACCEPTED,
        SubmissionStage.NOTICE_PERIOD_ACTIVE,
        SubmissionStage.JOINED_DAY_1_ACTIVE,
      ].includes(s.stage);

    const isInterviewDone = (s: any) =>
      (s.interviews && s.interviews.some((i: any) => i.status === "COMPLETED" || Boolean(i.debriefLoggedAt))) ||
      [
        SubmissionStage.INTERVIEW_COMPLETED,
        SubmissionStage.OFFER_ISSUED,
        SubmissionStage.OFFER_ACCEPTED,
        SubmissionStage.NOTICE_PERIOD_ACTIVE,
        SubmissionStage.JOINED_DAY_1_ACTIVE,
      ].includes(s.stage);

    const isSelected = (s: any) =>
      [
        SubmissionStage.OFFER_ISSUED,
        SubmissionStage.OFFER_ACCEPTED,
        SubmissionStage.NOTICE_PERIOD_ACTIVE,
        SubmissionStage.JOINED_DAY_1_ACTIVE,
      ].includes(s.stage);

    const isOffered = (s: any) =>
      [
        SubmissionStage.OFFER_ISSUED,
        SubmissionStage.OFFER_ACCEPTED,
        SubmissionStage.NOTICE_PERIOD_ACTIVE,
        SubmissionStage.JOINED_DAY_1_ACTIVE,
      ].includes(s.stage);

    const isJoined = (s: any) => s.stage === SubmissionStage.JOINED_DAY_1_ACTIVE;

    // Macro Funnel Totals (across all agency mandates)
    let macroIngested = 0;
    let macroShortlisted = 0;
    let macroSharedWithCompany = 0;
    let macroSelectedForInterview = 0;
    let macroInterviewsDone = 0;
    let macroSelected = 0;
    let macroOffered = 0;
    let macroJoined = 0;

    const mandateFunnels = mandates.map((m) => {
      const subs = m.submissions;
      const ingested = subs.length;
      const shortlisted = subs.filter(isShortlisted).length;
      const sharedWithCompany = subs.filter(isSharedWithCompany).length;
      const selectedForInterview = subs.filter(isSelectedForInterview).length;
      const interviewsDone = subs.filter(isInterviewDone).length;
      const selected = subs.filter(isSelected).length;
      const offered = subs.filter(isOffered).length;
      const joined = subs.filter(isJoined).length;

      // Accumulate macro counts
      macroIngested += ingested;
      macroShortlisted += shortlisted;
      macroSharedWithCompany += sharedWithCompany;
      macroSelectedForInterview += selectedForInterview;
      macroInterviewsDone += interviewsDone;
      macroSelected += selected;
      macroOffered += offered;
      macroJoined += joined;

      // Calculate mandate overall conversion rate (Joined / Ingested or Offered / Ingested)
      const conversionRate = ingested > 0 ? Math.round((joined / ingested) * 100) : 0;

      return {
        id: m.id,
        title: m.title,
        department: m.department,
        openings: m.openings,
        minExp: m.minExp,
        maxExp: m.maxExp,
        minCtc: m.minCtc,
        maxCtc: m.maxCtc,
        currency: m.currency,
        location: m.location,
        workMode: m.workMode,
        skills: m.skills,
        description: m.description,
        specialInstructions: m.specialInstructions,
        priority: m.priority,
        feePercentage: m.feePercentage,
        guaranteeDays: m.guaranteeDays,
        status: m.status,
        slaTargetHours: m.slaTargetHours,
        slaStartedAt: m.slaStartedAt,
        slaStatus: m.slaStatus,
        createdAt: m.createdAt,
        client: {
          id: m.client.id,
          name: m.client.name,
          website: m.client.website,
          industry: m.client.industry,
          location: m.client.location,
        },
        contact: m.contact
          ? {
              id: m.contact.id,
              name: m.contact.name,
              email: m.contact.email,
              phone: m.contact.phone,
              designation: m.contact.designation,
            }
          : null,
        assignedRecruiter: m.assignedRecruiter
          ? {
              id: m.assignedRecruiter.id,
              name: m.assignedRecruiter.name,
              email: m.assignedRecruiter.email,
            }
          : null,
        funnel: {
          ingested,
          shortlisted,
          sharedWithCompany,
          selectedForInterview,
          interviewsDone,
          selected,
          offered,
          joined,
          conversionRate,
        },
        candidates: subs.map((s) => ({
          submissionId: s.id,
          candidateId: s.candidate.id,
          fullName: s.candidate.fullName,
          email: s.candidate.email,
          phone: s.candidate.phone,
          currentCompany: s.candidate.currentCompany,
          currentTitle: s.candidate.currentTitle,
          totalExpYears: s.candidate.totalExpYears,
          expectedCtc: s.candidate.expectedCtc,
          noticePeriodDays: s.candidate.noticePeriodDays,
          stage: s.stage,
          clientDecision: s.clientDecision,
          offeredCtc: s.offeredCtc,
          actualJoiningDate: s.actualJoiningDate,
          counterOfferRiskLevel: s.counterOfferRiskLevel,
          isSilverMedalist: s.candidate.isSilverMedalist,
          createdAt: s.createdAt,
        })),
      };
    });

    const macroConversionRate = macroIngested > 0 ? Math.round((macroJoined / macroIngested) * 100) : 0;

    return NextResponse.json({
      macroFunnel: {
        ingested: macroIngested,
        shortlisted: macroShortlisted,
        sharedWithCompany: macroSharedWithCompany,
        selectedForInterview: macroSelectedForInterview,
        interviewsDone: macroInterviewsDone,
        selected: macroSelected,
        offered: macroOffered,
        joined: macroJoined,
        conversionRate: macroConversionRate,
      },
      mandateFunnels,
      totalMandates: mandates.length,
    });
  } catch (error: any) {
    console.error("Error calculating dashboard funnel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate candidate funnel analytics" },
      { status: 500 }
    );
  }
}

