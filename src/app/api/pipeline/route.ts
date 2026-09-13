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

    // 1. Today's Interviews Query (00:00:00 to 23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const interviewsToday = await prisma.interviewSchedule.findMany({
      where: {
        agencyId: session.user.agencyId,
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
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
      },
      orderBy: { scheduledAt: "asc" },
    });

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

    const now = Date.now();
    const formattedSubmitted = submittedSubmissions.map((sub) => {
      const submittedAt = sub.submittedToClientAt ? new Date(sub.submittedToClientAt).getTime() : new Date(sub.createdAt).getTime();
      const hoursWaiting = Math.max(0, Math.floor((now - submittedAt) / (1000 * 60 * 60)));
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

    // Calculate SLA Compliance
    const totalSubmitted = formattedSubmitted.length;
    const breachedCount = formattedSubmitted.filter((s) => s.slaStatus === "BREACHED").length;
    const warningCount = formattedSubmitted.filter((s) => s.slaStatus === "WARNING").length;
    const healthyCount = totalSubmitted - breachedCount;
    const complianceRate = totalSubmitted > 0 ? Math.round((healthyCount / totalSubmitted) * 100) : 100;

    return NextResponse.json({
      interviewsToday,
      columns: {
        screened: screenedSubmissions,
        submitted: formattedSubmitted,
        interviewing: interviewingSubmissions,
      },
      stats: {
        totalScreened: screenedSubmissions.length,
        totalSubmitted,
        totalInterviewing: interviewingSubmissions.length,
        totalInterviewsToday: interviewsToday.length,
        slaComplianceRate: complianceRate,
        breachedCount,
        warningCount,
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

