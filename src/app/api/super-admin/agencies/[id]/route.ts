import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";

// GET /api/super-admin/agencies/[id] - Get specific agency tenant
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        auditLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json({ agency });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch agency" }, { status: 500 });
  }
}

// PATCH /api/super-admin/agencies/[id] - Update tier, seats, or toggle status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, tier, maxSeats, isActive, customDomain } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (tier !== undefined && Object.values(SubscriptionTier).includes(tier)) dataToUpdate.tier = tier;
    if (maxSeats !== undefined) dataToUpdate.maxSeats = parseInt(maxSeats, 10);
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (customDomain !== undefined) dataToUpdate.customDomain = customDomain?.trim() || null;

    const updatedAgency = await prisma.agency.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    // Log the update action
    await prisma.auditLog.create({
      data: {
        agencyId: updatedAgency.id,
        userId: session.user.id,
        action: "TENANT_CONFIG_UPDATED",
        entity: "Agency",
        entityId: updatedAgency.id,
        metadata: dataToUpdate,
      },
    });

    return NextResponse.json({ message: "Agency updated successfully", agency: updatedAgency });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update agency" }, { status: 500 });
  }
}

