import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/autocomplete?q=...
 * Returns matching client accounts and their primary contacts for the agency.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    const clients = await prisma.clientAccount.findMany({
      where: {
        agencyId: session.user.agencyId,
        ...(query
          ? {
              name: {
                contains: query,
                mode: "insensitive",
              },
            }
          : {}),
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        industry: true,
        location: true,
        contacts: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        industry: c.industry || "",
        location: c.location || "",
        primaryContact: c.contacts[0] || null,
        contacts: c.contacts,
      })),
    });
  } catch (error: any) {
    console.error("Client autocomplete error:", error);
    return NextResponse.json({ error: error.message || "Failed to search clients" }, { status: 500 });
  }
}
