import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CandidateJobStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/mandates/[id]/workspace - Full Mandate Specification, Attached Candidates with Call Logs, & Matching Talent Pool
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const mandateId = params.id;

    // 1. Fetch Mandate Specifications
    const mandate = await prisma.jobMandate.findFirst({
      where: { id: mandateId, agencyId },
      include: {
        client: true,
        contact: true,
        assignedRecruiter: {
          select: { id: true, name: true, email: true },
        },
        broadcasts: true,
        partnerShares: true,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Search mandate not found." }, { status: 404 });
    }

    // 2. Fetch Attached Candidates for this Mandate with Call Logs
    const submissions = await prisma.candidateSubmission.findMany({
      where: { mandateId, agencyId },
      include: {
        candidate: {
          include: {
            submissions: {
              where: { mandateId: { not: mandateId } },
              include: {
                mandate: { select: { id: true, title: true, client: { select: { name: true } } } },
                callLogs: {
                  orderBy: { calledAt: "desc" },
                  include: { recruiter: { select: { name: true } } },
                },
              },
            },
          },
        },
        callLogs: {
          orderBy: { calledAt: "desc" },
          include: {
            recruiter: { select: { id: true, name: true, email: true } },
          },
        },
        interviews: {
          orderBy: { scheduledAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const attachedCandidateIds = new Set(submissions.map((s) => s.candidateId));

    const formattedAttached = submissions.map((sub) => {
      // Cross-job history: other mandates this candidate was considered for in the agency
      const otherJobsHistory = sub.candidate.submissions.map((otherSub) => ({
        mandateId: otherSub.mandate.id,
        mandateTitle: otherSub.mandate.title,
        clientName: otherSub.mandate.client.name,
        stage: otherSub.stage,
        candidateJobStatus: otherSub.candidateJobStatus,
        createdAt: otherSub.createdAt,
        callLogs: otherSub.callLogs.map((cl) => ({
          id: cl.id,
          disposition: cl.disposition,
          notes: cl.notes,
          calledAt: cl.calledAt,
          recruiterName: cl.recruiter?.name || "Recruiter",
        })),
      }));

      return {
        submissionId: sub.id,
        candidateId: sub.candidate.id,
        fullName: sub.candidate.fullName,
        email: sub.candidate.email,
        phone: sub.candidate.phone,
        phoneNormalized: sub.candidate.phoneNormalized,
        currentCompany: sub.candidate.currentCompany,
        currentTitle: sub.candidate.currentTitle,
        totalExpYears: sub.candidate.totalExpYears,
        expectedCtc: sub.candidate.expectedCtc,
        currentCtc: sub.candidate.currentCtc,
        currency: sub.candidate.currency,
        noticePeriodDays: sub.candidate.noticePeriodDays,
        location: sub.candidate.location,
        skills: sub.candidate.skills,
        summary: sub.candidate.summary,
        rawResumeText: sub.candidate.rawResumeText,
        resumeUrl: sub.candidate.resumeUrl,
        qualification: sub.candidate.qualification,
        source: sub.candidate.source || "DIRECT_UPLOAD",
        dateOfSourcing: sub.createdAt,
        status: sub.candidateJobStatus || CandidateJobStatus.NOT_SHARED,
        stage: sub.stage,
        clientDecision: sub.clientDecision,
        submittedToClientAt: sub.submittedToClientAt,
        lastCallOutcome: sub.lastCallDisposition || null,
        lastCallNotes: sub.lastCallNotes || null,
        lastCallAt: sub.lastCallAt || null,
        readyToRelocate: sub.readyToRelocate,
        relevantExpYears: sub.relevantExpYears,
        currentSalary: sub.currentSalary,
        expectedSalary: sub.expectedSalary,
        noticePeriod: sub.noticePeriod,
        reasonForLeaving: sub.reasonForLeaving,
        offerInHand: sub.offerInHand,
        isSilverMedalist: sub.candidate.isSilverMedalist,
        silverMedalistReason: sub.candidate.silverMedalistReason,
        // Call history for THIS job
        thisJobCallLogs: sub.callLogs.map((cl) => ({
          id: cl.id,
          disposition: cl.disposition,
          notes: cl.notes,
          calledAt: cl.calledAt,
          recruiterName: cl.recruiter?.name || "Recruiter",
        })),
        // History from OTHER jobs in this agency
        otherJobsHistory,
      };
    });

    // 3. Fetch Matching Pool Candidates (Candidates in agency pool NOT yet attached to this mandate)
    const allPoolCandidates = await prisma.candidate.findMany({
      where: {
        agencyId,
        id: { notIn: Array.from(attachedCandidateIds) },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        currentCompany: true,
        currentTitle: true,
        totalExpYears: true,
        expectedCtc: true,
        noticePeriodDays: true,
        location: true,
        skills: true,
        summary: true,
        source: true,
        isSilverMedalist: true,
        silverMedalistReason: true,
        createdAt: true,
      },
    });

    const mandateSkillsLower = (mandate.skills || []).map((s) => s.toLowerCase().trim());

    const matchingPool = allPoolCandidates
      .map((c) => {
        const candidateSkillsLower = (c.skills || []).map((s) => s.toLowerCase().trim());
        const matched = candidateSkillsLower.filter((cs) =>
          mandateSkillsLower.some((ms) => ms.includes(cs) || cs.includes(ms))
        );

        const matchScore =
          mandateSkillsLower.length > 0
            ? Math.min(100, Math.round((matched.length / mandateSkillsLower.length) * 100))
            : 50;

        return {
          ...c,
          matchedSkills: matched,
          matchScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      mandate,
      attachedCandidates: formattedAttached,
      matchingPool,
      totalAttached: formattedAttached.length,
      totalMatchingPool: matchingPool.length,
    });
  } catch (error: any) {
    console.error("Error loading mandate workspace:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load mandate workspace" },
      { status: 500 }
    );
  }
}

