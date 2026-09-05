import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/interviews - List scheduled interviews across agency
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mandateId = searchParams.get("mandateId");

    const whereClause: any = {
      agencyId: session.user.agencyId,
    };

    if (mandateId) {
      whereClause.mandateId = mandateId;
    }

    const interviews = await prisma.interviewSchedule.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            currentTitle: true,
            totalExpYears: true,
          },
        },
        mandate: {
          select: {
            id: true,
            title: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ interviews });
  } catch (error: any) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load interviews" },
      { status: 500 }
    );
  }
}

