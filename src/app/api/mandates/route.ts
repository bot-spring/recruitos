import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MandateStatus, ClientStatus, PriorityLevel, WorkMode, SlaStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/mandates - List active mandates for the agency tenant
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // "my" or "all"

    const isDeskRecruiter = session.user.role === "RECRUITER";
    const whereClause: any = {
      agencyId: session.user.agencyId,
      status: {
        not: MandateStatus.UNREVIEWED_INBOUND, // Exclude unreviewed from main board
      },
    };

    // If desk recruiter and not explicitly requesting all, filter by assigned
    if (isDeskRecruiter && scope !== "all") {
      whereClause.assignedRecruiterId = session.user.id;
    }

    const mandates = await prisma.jobMandate.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            industry: true,
            status: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedRecruiter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate live SLA velocity metrics for each mandate (RC-03)
    const now = new Date().getTime();
    const enrichedMandates = mandates.map((m) => {
      let hoursInStage = 0;
      let calculatedSlaStatus = m.slaStatus;

      if (m.slaStartedAt) {
        hoursInStage = Math.max(0, Math.floor((now - new Date(m.slaStartedAt).getTime()) / (1000 * 60 * 60)));

        if (hoursInStage >= m.slaTargetHours) {
          calculatedSlaStatus = SlaStatus.BREACHED;
        } else if (hoursInStage >= m.slaTargetHours / 2) {
          calculatedSlaStatus = SlaStatus.WARNING;
        } else {
          calculatedSlaStatus = SlaStatus.HEALTHY;
        }
      }

      return {
        ...m,
        hoursInStage,
        calculatedSlaStatus,
      };
    });

    return NextResponse.json({ mandates: enrichedMandates });
  } catch (error: any) {
    console.error("Error fetching mandates:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch mandates" }, { status: 500 });
  }
}

// POST /api/mandates - Create Offline BD Mandate (Owner/TL only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    if (session.user.role !== "AGENCY_OWNER" && session.user.role !== "TEAM_LEAD" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Agency Owners and Team Leads can create client billing mandates." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      title,
      department,
      openings = 1,
      minExp = 0,
      maxExp = 0,
      minCtc,
      maxCtc,
      currency = "INR",
      location,
      workMode = "HYBRID",
      skills,
      description,
      priority = "MEDIUM",
      feePercentage = 8.33,
      guaranteeDays = 90,
      slaTargetHours = 72,
      assignedRecruiterId,
      specialInstructions,
    } = body;

    if (!companyName || !contactEmail || !title) {
      return NextResponse.json(
        { error: "Missing required fields: Company Name, Contact Email, and Job Title." },
        { status: 400 }
      );
    }

    const effectiveRecruiterId = assignedRecruiterId || session.user.id;
    const effectiveContactName = contactName?.trim() || contactEmail.split("@")[0] || "Hiring Lead";

    // Process skills array
    let skillsArray: string[] = [];
    if (Array.isArray(skills)) {
      skillsArray = skills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === "string") {
      skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create ClientAccount
      let client = await tx.clientAccount.findFirst({
        where: {
          agencyId: session.user.agencyId!,
          name: { equals: companyName.trim(), mode: "insensitive" },
        },
      });

      if (!client) {
        client = await tx.clientAccount.create({
          data: {
            agencyId: session.user.agencyId!,
            name: companyName.trim(),
            status: ClientStatus.ACTIVE,
          },
        });
      } else if (client.status !== ClientStatus.ACTIVE) {
        client = await tx.clientAccount.update({
          where: { id: client.id },
          data: { status: ClientStatus.ACTIVE },
        });
      }

      // 2. Find or create ClientContact
      let contact = await tx.clientContact.findFirst({
        where: {
          agencyId: session.user.agencyId!,
          clientId: client.id,
          email: { equals: contactEmail.toLowerCase().trim(), mode: "insensitive" },
        },
      });

      if (!contact) {
        contact = await tx.clientContact.create({
          data: {
            agencyId: session.user.agencyId!,
            clientId: client.id,
            name: effectiveContactName,
            email: contactEmail.toLowerCase().trim(),
            phone: contactPhone?.trim() || null,
          },
        });
      }

      // 3. Create Job Mandate directly in ACTIVE_ASSIGNED
      const mandate = await tx.jobMandate.create({
        data: {
          agencyId: session.user.agencyId!,
          clientId: client.id,
          contactId: contact.id,
          assignedRecruiterId: effectiveRecruiterId,
          title: title.trim(),
          department: department?.trim() || null,
          openings: parseInt(openings, 10) || 1,
          minExp: parseInt(minExp, 10) || 0,
          maxExp: parseInt(maxExp, 10) || 0,
          minCtc: minCtc ? parseFloat(minCtc) : null,
          maxCtc: maxCtc ? parseFloat(maxCtc) : null,
          currency: currency.toUpperCase().trim(),
          location: location?.trim() || null,
          workMode: (workMode as WorkMode) || WorkMode.HYBRID,
          skills: skillsArray,
          description: description?.trim() || null,
          priority: (priority as PriorityLevel) || PriorityLevel.MEDIUM,
          feePercentage: parseFloat(feePercentage) || 8.33,
          guaranteeDays: parseInt(guaranteeDays, 10) || 90,
          slaTargetHours: parseInt(slaTargetHours, 10) || 72,
          slaStartedAt: new Date(),
          slaStatus: SlaStatus.HEALTHY,
          status: MandateStatus.ACTIVE_ASSIGNED,
          source: "OFFLINE_BD",
          approvedAt: new Date(),
          approvedByUserId: session.user.id,
          specialInstructions: specialInstructions?.trim() || null,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          agencyId: session.user.agencyId!,
          userId: session.user.id,
          action: "OFFLINE_MANDATE_CREATED",
          entity: "JobMandate",
          entityId: mandate.id,
          metadata: {
            companyName: client.name,
            jobTitle: mandate.title,
            assignedRecruiterId: effectiveRecruiterId,
          },
        },
      });

      return { client, contact, mandate };
    });

    return NextResponse.json(
      {
        message: "Offline mandate created and assigned successfully.",
        mandate: result.mandate,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating offline mandate:", error);
    return NextResponse.json({ error: error.message || "Failed to create mandate" }, { status: 500 });
  }
}
