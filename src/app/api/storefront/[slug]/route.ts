import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/storefront/[slug] - Fetch public agency profile & active roles
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const agency = await prisma.agency.findUnique({
      where: { slug: params.slug.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        logoUrl: true,
        primaryColor: true,
        isActive: true,
        jobMandates: {
          where: {
            status: {
              in: ["ACTIVE_ASSIGNED", "SOURCING_IN_PROGRESS", "INTERVIEWS_ACTIVE"],
            },
          },
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
            workMode: true,
            minExp: true,
            maxExp: true,
            skills: true,
            createdAt: true,
          },
          take: 6,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            jobMandates: true,
          },
        },
      },
    });

    if (!agency || !agency.isActive) {
      return NextResponse.json({ error: "Agency storefront not found or is currently inactive." }, { status: 404 });
    }

    return NextResponse.json({ agency });
  } catch (error: any) {
    console.error("Error fetching storefront profile:", error);
    return NextResponse.json({ error: error.message || "Failed to load storefront" }, { status: 500 });
  }
}

