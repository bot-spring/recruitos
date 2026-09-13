import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/notifications - Activity Bell Feed (Client Decisions, Candidate Slot Confirmations, SLA Alerts)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;

    // 1. Fetch recent audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 2. Fetch recent candidate submissions with client decisions
    const recentDecisions = await prisma.candidateSubmission.findMany({
      where: {
        agencyId,
        clientFeedbackAt: { not: null },
      },
      include: {
        candidate: { select: { fullName: true } },
        mandate: { select: { id: true, title: true, client: { select: { name: true } } } },
      },
      orderBy: { clientFeedbackAt: "desc" },
      take: 10,
    });

    // 3. Fetch recent interviews scheduled or pending meeting links
    const recentInterviews = await prisma.interviewSchedule.findMany({
      where: { agencyId },
      include: {
        candidate: { select: { fullName: true } },
        mandate: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Build unified notifications list
    const notifications: Array<{
      id: string;
      type: "DECISION_SHORTLIST" | "DECISION_REJECT" | "SLOT_CONFIRMED" | "AUDIT" | "INFO";
      title: string;
      message: string;
      timestamp: string;
      read: boolean;
    }> = [];

    // Decisions
    for (const sub of recentDecisions) {
      const isShortlist = sub.clientDecision === "SHORTLISTED_FOR_INTERVIEW";
      notifications.push({
        id: `decision-${sub.id}`,
        type: isShortlist ? "DECISION_SHORTLIST" : "DECISION_REJECT",
        title: isShortlist ? "Candidate Shortlisted for Interview" : "Candidate Rejected by Client",
        message: `${sub.mandate.client.name} ${isShortlist ? "approved" : "passed on"} ${sub.candidate.fullName} for ${sub.mandate.title}.`,
        timestamp: sub.clientFeedbackAt?.toISOString() || new Date().toISOString(),
        read: false,
      });
    }

    // Interviews
    for (const iv of recentInterviews) {
      notifications.push({
        id: `interview-${iv.id}`,
        type: "SLOT_CONFIRMED",
        title: !iv.meetingLink ? "Meeting Link Needed" : "Interview Slot Confirmed",
        message: `${iv.candidate.fullName} (${iv.mandate.title}) scheduled for ${new Date(iv.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`,
        timestamp: iv.createdAt.toISOString(),
        read: false,
      });
    }

    // Audit logs for other key actions
    for (const log of auditLogs) {
      if (!notifications.some((n) => n.id.includes(log.id))) {
        notifications.push({
          id: `audit-${log.id}`,
          type: "INFO",
          title: log.action.replace(/_/g, " "),
          message: `${(log.metadata as any)?.candidateName || log.entity || "System event"} - ${(log.metadata as any)?.mandateTitle || ""}`.trim(),
          timestamp: log.createdAt.toISOString(),
          read: true,
        });
      }
    }

    // Sort combined feed by timestamp desc
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Deduplicate and cap at 15
    const uniqueNotifications = notifications.slice(0, 15);
    const unreadCount = uniqueNotifications.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: uniqueNotifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

