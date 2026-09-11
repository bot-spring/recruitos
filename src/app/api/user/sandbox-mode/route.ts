import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/user/sandbox-mode - Fetch current user's sandbox mode setting
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        isSandboxMode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      isSandboxMode: Boolean(user.isSandboxMode),
      email: user.email,
      phone: user.phone,
      name: user.name,
    });
  } catch (error: any) {
    console.error("Error reading user sandbox mode:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve sandbox status" },
      { status: 500 }
    );
  }
}

// POST /api/user/sandbox-mode - Toggle or update current user's sandbox mode
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let targetMode: boolean;

    if (typeof body.isSandboxMode === "boolean") {
      targetMode = body.isSandboxMode;
    } else {
      // Toggle current value
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isSandboxMode: true },
      });
      targetMode = !currentUser?.isSandboxMode;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { isSandboxMode: targetMode },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        isSandboxMode: true,
      },
    });

    // Optional audit log
    try {
      if (session.user.agencyId) {
        await prisma.auditLog.create({
          data: {
            agencyId: session.user.agencyId,
            userId: session.user.id,
            action: targetMode ? "USER_SANDBOX_ENABLED" : "USER_SANDBOX_DISABLED",
            entity: "User",
            entityId: session.user.id,
            metadata: {
              email: updated.email,
              isSandboxMode: targetMode,
              toggledAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (auditErr: any) {
      console.warn("Audit log bypassed:", auditErr.message);
    }

    return NextResponse.json({
      success: true,
      isSandboxMode: updated.isSandboxMode,
      email: updated.email,
      phone: updated.phone,
      message: updated.isSandboxMode
        ? "🧪 QA Sandbox Mode active. All outbound communications will safely divert to your email and phone."
        : "🚀 Live Production Mode active. Standard live operations restored.",
    });
  } catch (error: any) {
    console.error("Error updating user sandbox mode:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sandbox mode" },
      { status: 500 }
    );
  }
}

