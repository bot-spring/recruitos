import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BroadcastPlatform, BroadcastStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/mandates/[id]/broadcast - Fetch all broadcast channels for a mandate
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const mandateId = params.id;
    const broadcasts = await prisma.jobBroadcast.findMany({
      where: {
        agencyId: session.user.agencyId,
        mandateId,
      },
    });

    return NextResponse.json({ broadcasts });
  } catch (error: any) {
    console.error("Error fetching broadcasts:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch broadcasts" }, { status: 500 });
  }
}

// POST /api/mandates/[id]/broadcast - Toggle job board broadcast (LinkedIn, Naukri, Bayt, Indeed)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const mandateId = params.id;
    const body = await req.json();
    const { platform, status = "ACTIVE" } = body;

    if (!platform || !Object.values(BroadcastPlatform).includes(platform)) {
      return NextResponse.json({ error: "Invalid or missing job board platform." }, { status: 400 });
    }

    // Verify mandate belongs to agency
    const mandate = await prisma.jobMandate.findFirst({
      where: {
        id: mandateId,
        agencyId: session.user.agencyId,
      },
      include: { client: true },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    const broadcastStatus: BroadcastStatus = status === "PAUSED" ? BroadcastStatus.PAUSED : BroadcastStatus.ACTIVE;
    const externalPostId = `${platform.toLowerCase()}_post_${mandateId.substring(0, 8)}_${Date.now().toString(36)}`;

    // Upsert broadcast record
    const broadcast = await prisma.jobBroadcast.upsert({
      where: {
        mandateId_platform: {
          mandateId,
          platform: platform as BroadcastPlatform,
        },
      },
      update: {
        status: broadcastStatus,
        updatedAt: new Date(),
      },
      create: {
        agencyId: session.user.agencyId,
        mandateId,
        platform: platform as BroadcastPlatform,
        status: broadcastStatus,
        externalPostId,
        publishedAt: new Date(),
      },
    });

    // Record audit event
    await prisma.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: broadcastStatus === BroadcastStatus.ACTIVE ? "JOB_BOARD_BROADCAST_PUBLISHED" : "JOB_BOARD_BROADCAST_PAUSED",
        entity: "JobBroadcast",
        entityId: broadcast.id,
        metadata: {
          platform,
          jobTitle: mandate.title,
          status: broadcastStatus,
        },
      },
    });

    return NextResponse.json({
      message: `Job broadcast to ${platform} ${broadcastStatus === BroadcastStatus.ACTIVE ? "published" : "paused"} successfully.`,
      broadcast,
    });
  } catch (error: any) {
    console.error("Error managing broadcast:", error);
    return NextResponse.json({ error: error.message || "Failed to update broadcast" }, { status: 500 });
  }
}

