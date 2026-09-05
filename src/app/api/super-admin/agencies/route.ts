import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SubscriptionTier, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/super-admin/agencies - List all provisioned agencies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    const agencies = await prisma.agency.findMany({
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
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      totalAgencies: agencies.length,
      activeAgencies: agencies.filter((a) => a.isActive).length,
      totalAllocatedSeats: agencies.reduce((acc, a) => acc + a.maxSeats, 0),
      totalUsedSeats: agencies.reduce((acc, a) => acc + a._count.users, 0),
    };

    return NextResponse.json({ agencies, summary });
  } catch (error: any) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch agencies" }, { status: 500 });
  }
}

// POST /api/super-admin/agencies - Provision new Agency Tenant & Initial Agency Owner
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, tier, maxSeats, ownerName, ownerEmail, ownerPassword, customDomain } = body;

    // Basic validations
    if (!name || !slug || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, ownerName, ownerEmail, ownerPassword are required." },
        { status: 400 }
      );
    }

    // Slug format validation: lowercase alphanumeric and hyphens
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

    // Check slug uniqueness
    const existingAgency = await prisma.agency.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingAgency) {
      return NextResponse.json({ error: `An agency with slug '${cleanSlug}' already exists.` }, { status: 409 });
    }

    // Check owner email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json({ error: `A user with email '${ownerEmail}' already exists.` }, { status: 409 });
    }

    // Determine seat limit based on tier if not explicitly provided
    let seats = maxSeats ? parseInt(maxSeats, 10) : 5;
    const selectedTier: SubscriptionTier = tier && Object.values(SubscriptionTier).includes(tier) ? tier : SubscriptionTier.STARTER;
    if (!maxSeats) {
      if (selectedTier === SubscriptionTier.STARTER) seats = 5;
      if (selectedTier === SubscriptionTier.GROWTH) seats = 20;
      if (selectedTier === SubscriptionTier.ENTERPRISE) seats = 50;
    }

    // Hash owner password
    const passwordHash = await bcrypt.hash(ownerPassword, 10);

    // Create agency and initial owner in a single database transaction
    const newAgency = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: name.trim(),
          slug: cleanSlug,
          tier: selectedTier,
          maxSeats: seats,
          customDomain: customDomain?.trim() || null,
          isActive: true,
        },
      });

      const owner = await tx.user.create({
        data: {
          name: ownerName.trim(),
          email: ownerEmail.toLowerCase().trim(),
          passwordHash,
          role: UserRole.AGENCY_OWNER,
          agencyId: agency.id,
          isActive: true,
        },
      });

      // Log the provisioning audit event
      await tx.auditLog.create({
        data: {
          agencyId: agency.id,
          userId: session.user.id,
          action: "TENANT_PROVISIONED",
          entity: "Agency",
          entityId: agency.id,
          metadata: {
            agencyName: agency.name,
            tier: agency.tier,
            maxSeats: agency.maxSeats,
            ownerEmail: owner.email,
          },
        },
      });

      return { agency, owner };
    });

    return NextResponse.json(
      {
        message: "Agency tenant provisioned successfully.",
        agency: newAgency.agency,
        owner: {
          id: newAgency.owner.id,
          name: newAgency.owner.name,
          email: newAgency.owner.email,
          role: newAgency.owner.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error provisioning agency:", error);
    return NextResponse.json({ error: error.message || "Failed to provision agency" }, { status: 500 });
  }
}
