import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MandateStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/mandates/inbound - List unreviewed inbound mandates for Owner/Team Lead review
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    // Role Gate: Only Agency Owners and Team Leads can review inbound mandates
    if (session.user.role !== "AGENCY_OWNER" && session.user.role !== "TEAM_LEAD" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Agency Owner or Team Lead privileges required." }, { status: 403 });
    }

    const inboundMandates = await prisma.jobMandate.findMany({
      where: {
        agencyId: session.user.agencyId,
        status: MandateStatus.UNREVIEWED_INBOUND,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
            location: true,
            status: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ inboundMandates });
  } catch (error: any) {
    console.error("Error fetching inbound mandates:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch inbound mandates" }, { status: 500 });
  }
}
