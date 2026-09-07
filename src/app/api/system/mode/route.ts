import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/system/mode - Public endpoint to check current platform environment mode
export async function GET() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { id: "global" },
      select: { isProductionMode: true, whatsappDevOverridePhone: true },
    });

    const isProductionMode = Boolean(setting?.isProductionMode);

    return NextResponse.json({
      isProductionMode,
      isDemoMode: !isProductionMode,
      modeLabel: isProductionMode ? "Live Production Mode" : "Internal QA & Demo Sandbox",
      devOverridePhone: setting?.whatsappDevOverridePhone || "919818352440",
    });
  } catch (error: any) {
    console.error("Error reading system mode:", error);
    // Safe fallback: defaults to demo mode so nothing breaks
    return NextResponse.json({
      isProductionMode: false,
      isDemoMode: true,
      modeLabel: "Internal QA & Demo Sandbox",
      devOverridePhone: "919818352440",
    });
  }
}

// POST /api/system/mode - Super Admin endpoint to toggle platform mode
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const { isProductionMode } = body;

    if (typeof isProductionMode !== "boolean") {
      return NextResponse.json({ error: "Invalid payload: 'isProductionMode' must be a boolean." }, { status: 400 });
    }

    const updated = await prisma.platformSetting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        isProductionMode,
      },
      update: {
        isProductionMode,
      },
    });

    // Record audit log for security compliance
    try {
      let validAgencyId: string | null = null;
      if (session.user.agencyId) {
        const agency = await prisma.agency.findUnique({
          where: { id: session.user.agencyId },
          select: { id: true },
        });
        if (agency) validAgencyId = agency.id;
      }

      await prisma.auditLog.create({
        data: {
          agencyId: validAgencyId,
          userId: session.user.id,
          action: isProductionMode ? "SWITCHED_TO_PRODUCTION_MODE" : "SWITCHED_TO_SANDBOX_DEMO_MODE",
          entity: "PlatformSetting",
          entityId: updated.id,
          metadata: {
            isProductionMode,
            toggledBy: session.user.email,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (auditErr: any) {
      console.warn("Audit log creation bypassed:", auditErr.message);
    }

    return NextResponse.json({
      message: isProductionMode
        ? "🚀 Platform switched to Live Production Mode. Outbound messages will route to real candidates and login test credentials are hidden."
        : "🧪 Platform switched to Internal QA & Demo Sandbox. Safe routing active and login test credentials are visible.",
      isProductionMode: updated.isProductionMode,
      isDemoMode: !updated.isProductionMode,
      modeLabel: updated.isProductionMode ? "Live Production Mode" : "Internal QA & Demo Sandbox",
    });
  } catch (error: any) {
    console.error("Error updating system mode:", error);
    return NextResponse.json({ error: error.message || "Failed to update system mode." }, { status: 500 });
  }
}

