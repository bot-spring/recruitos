import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

// PATCH /api/super-admin/users/[id] - Update user mode, phone, role, or active status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { isSandboxMode, phone, name, role, isActive } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { agency: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (typeof isSandboxMode === "boolean") {
      dataToUpdate.isSandboxMode = isSandboxMode;
    }
    if (typeof phone === "string") {
      dataToUpdate.phone = phone.trim() || null;
    }
    if (typeof name === "string" && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (role && Object.values(UserRole).includes(role)) {
      dataToUpdate.role = role;
    }
    if (typeof isActive === "boolean") {
      dataToUpdate.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isSandboxMode: true,
        agencyId: true,
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create an audit log entry
    await prisma.auditLog.create({
      data: {
        agencyId: updatedUser.agencyId || null,
        userId: session.user.id,
        action: typeof isSandboxMode === "boolean" ? "USER_SANDBOX_MODE_UPDATED" : "USER_UPDATED",
        entity: "User",
        entityId: updatedUser.id,
        metadata: {
          updatedFields: dataToUpdate,
          targetUserEmail: updatedUser.email,
        },
      },
    });

    return NextResponse.json({
      message: `User ${updatedUser.name} (${updatedUser.email}) updated successfully`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user in super-admin:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}
