import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/super-admin/users - List all users across all agencies
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get("agencyId");
    const query = searchParams.get("q")?.trim().toLowerCase();

    const whereClause: any = {};
    if (agencyId) {
      whereClause.agencyId = agencyId;
    }
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isSandboxMode: true,
        agencyId: true,
        createdAt: true,
        updatedAt: true,
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            tier: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    console.error("Error fetching users for super-admin:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}
