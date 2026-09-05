import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/super-admin/audit-logs - Fetch platform-wide audit logs for Super Admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        agency: {
          select: { name: true, slug: true },
        },
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: error.message || "Failed to load audit logs" }, { status: 500 });
  }
}

