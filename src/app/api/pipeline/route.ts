import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/pipeline - Tactical Pipeline Kanban + Today's Interview Lineup (RC-04, CL-01, CL-02)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mandateId = searchParams.get("mandateId") || undefined;

    // 1. 3-Day Interviews Queries (Yesterday, Today, Tomorrow)
    const now = new Date();
    
    // Today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Yesterday
    const startOfYesterday = new Date(now);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(now);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Tomorrow
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(now);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const interviewInclude = {
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          currentTitle: true,
          currentCompany: true,
        },
      },
      mandate: {
        select: {
          id: true,
          title: true,
          client: { select: { id: true, name: true } },
        },
      },
      submission: {
        select: {
          id: true,
          stage: true,
          clientDecision: true,
        },
      },
    };

    const [interviewsYesterday, interviewsToday, interviewsTomorrow] = await Promise.all([
      prisma.interviewSchedule.findMany({
        where: {
          agencyId: session.user.agencyId,
          scheduledAt: { gte: startOfYesterday, lte: endOfYesterday },
          ...(mandateId ? { mandateId } : {}),
        },
        include: interviewInclude,
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.interviewSchedule.findMany({
        where: {
          agencyId: session.user.agencyId,
          scheduledAt: { gte: startOfToday, lte: endOfToday },
          ...(mandateId ? { mandateId } : {}),
        },
        include: interviewInclude,
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.interviewSchedule.findMany({
        where: {
          agencyId: session.user.agencyId,
          scheduledAt: { gte: startOfTomorrow, lte: endOfTomorrow },
          ...(mandateId ? { mandateId } : {}),
        },
        include: interviewInclude,
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

    // 2. Column 1: Screened Candidates (<24h vetted, awaiting client presentation)
    const screenedSubmissions = await prisma.candidateSubmission.findMany({
      where: {
        agencyId: session.user.agencyId,
        stage: SubmissionStage.SCREENED_QUALIFIED,
        ...(mandateId ? { mandateId } : {}),
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            currentTitle: true,
            currentCompany: true,
            totalExpYears: true,
            expectedCtc: true,
            currency: true,
            noticePeriodDays: true,
            skills: true,
          },
        },
        mandate: {
          select: {
            id: true,
            title: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 3. Column 2: Submitted to Client (<48h feedback SLA aging)
    const submittedSubmissions = await prisma.candidateSubmission.findMany({
      where: {
        agencyId: session.user.agencyId,
        stage: SubmissionStage.SUBMITTED_TO_CLIENT,
        ...(mandateId ? { mandateId } : {}),
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            currentTitle: true,
            currentCompany: true,
            totalExpYears: true,
            expectedCtc: true,
            currency: true,
            noticePeriodDays: true,
            skills: true,
          },
        },
        mandate: {
          select: {
            id: true,
            title: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { submittedToClientAt: "asc" },
      take: 50,
    });

    const nowMs = Date.now();
    const formattedSubmitted = submittedSubmissions.map((sub) => {
      const submittedAt = sub.submittedToClientAt ? new Date(sub.submittedToClientAt).getTime() : new Date(sub.createdAt).getTime();
      const hoursWaiting = Math.max(0, Math.floor((nowMs - submittedAt) / (1000 * 60 * 60)));
      let slaStatus: "HEALTHY" | "WARNING" | "BREACHED" = "HEALTHY";
      if (hoursWaiting >= 72) {
        slaStatus = "BREACHED";
      } else if (hoursWaiting >= 48) {
        slaStatus = "WARNING";
      }
      return {
        ...sub,
        hoursWaiting,
        slaStatus,
      };
    });

    // Sort so breached & warnings are front-and-center
    const chasesDue = [...formattedSubmitted].sort((a, b) => (b.hoursWaiting || 0) - (a.hoursWaiting || 0));

    // 4. Column 3: Interviewing (<24h debrief)
    const interviewingSubmissions = await prisma.candidateSubmission.findMany({
      where: {
        agencyId: session.user.agencyId,
        stage: {
          in: [
            SubmissionStage.CLIENT_SHORTLISTED,
            SubmissionStage.INTERVIEW_SCHEDULED,
            SubmissionStage.INTERVIEW_COMPLETED,
          ],
        },
        ...(mandateId ? { mandateId } : {}),
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            currentTitle: true,
            currentCompany: true,
            totalExpYears: true,
            expectedCtc: true,
            currency: true,
            noticePeriodDays: true,
            skills: true,
          },
        },
        mandate: {
          select: {
            id: true,
            title: true,
            client: { select: { id: true, name: true } },
          },
        },
        interviews: {
          orderBy: { scheduledAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // 5. RC-05: Notice Period & Post-Offer Drop-Off Radar
    const noticePeriodSubmissions = await prisma.candidateSubmission.findMany({
      where: {
        agencyId: session.user.agencyId,
        stage: {
          in: [
            SubmissionStage.OFFER_ACCEPTED,
            SubmissionStage.NOTICE_PERIOD_ACTIVE,
          ],
        },
        ...(mandateId ? { mandateId } : {}),
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            currentTitle: true,
            currentCompany: true,
            expectedCtc: true,
            currency: true,
            noticePeriodDays: true,
          },
        },
        mandate: {
          select: {
            id: true,
            title: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });

    const formattedNoticePeriod = noticePeriodSubmissions.map((sub) => {
      const daysInNotice = sub.candidate.noticePeriodDays || 30;
      const acceptedAt = new Date(sub.updatedAt).getTime();
      const daysSinceAccepted = Math.max(0, Math.floor((nowMs - acceptedAt) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, daysInNotice - daysSinceAccepted);

      return {
        ...sub,
        daysInNotice,
        daysSinceAccepted,
        daysRemaining,
      };
    });

    // Calculate SLA Compliance
    const totalSubmitted = formattedSubmitted.length;
    const breachedCount = formattedSubmitted.filter((s) => s.slaStatus === "BREACHED").length;
    const warningCount = formattedSubmitted.filter((s) => s.slaStatus === "WARNING").length;
    const healthyCount = totalSubmitted - breachedCount;
    const complianceRate = totalSubmitted > 0 ? Math.round((healthyCount / totalSubmitted) * 100) : 100;

    return NextResponse.json({
      interviewsToday,
      interviewsYesterday,
      interviewsTomorrow,
      chasesDue,
      noticePeriodWatch: formattedNoticePeriod,
      columns: {
        screened: screenedSubmissions,
        submitted: formattedSubmitted,
        interviewing: interviewingSubmissions,
      },
      stats: {
        totalScreened: screenedSubmissions.length,
        totalSubmitted,
        totalInterviewing: interviewingSubmissions.length,
        totalInterviewsYesterday: interviewsYesterday.length,
        totalInterviewsToday: interviewsToday.length,
        totalInterviewsTomorrow: interviewsTomorrow.length,
        slaComplianceRate: complianceRate,
        breachedCount,
        warningCount,
        noticePeriodCount: formattedNoticePeriod.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/pipeline error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load pipeline data." },
      { status: 500 }
    );
  }
}

