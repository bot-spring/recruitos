import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/team/recruiters - Fetch active recruiters and delivery team members for the tenant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const recruiters = await prisma.user.findMany({
      where: {
        agencyId: session.user.agencyId,
        isActive: true,
        role: {
          in: [UserRole.RECRUITER, UserRole.TEAM_LEAD, UserRole.AGENCY_OWNER],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            assignedJobs: {
              where: {
                status: {
                  in: [
                    "ACTIVE_ASSIGNED",
                    "SOURCING_IN_PROGRESS",
                    "INTERVIEWS_ACTIVE",
                    "OFFER_STAGED",
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ recruiters });
  } catch (error: any) {
    console.error("Error fetching team recruiters:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch recruiters" }, { status: 500 });
  }
}
