import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MandateStatus, ClientStatus, PriorityLevel, WorkMode, SlaStatus } from "@prisma/client";
import { sanitizeUtf8 } from "@/lib/resume-parser";

export const dynamic = "force-dynamic";

/**
 * POST /api/mandates/batch
 * Creates multiple JobMandates under a shared ClientAccount in a single transaction.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      feePercentage = 8.33,
      guaranteeDays = 90,
      slaTargetHours = 72,
      positions = [],
    } = body;

    const trimmedCompany = sanitizeUtf8(companyName?.trim());
    if (!trimmedCompany) {
      return NextResponse.json({ error: "Client Company Name is required." }, { status: 400 });
    }

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json({ error: "At least one position is required." }, { status: 400 });
    }

    const companySlug = trimmedCompany.toLowerCase().replace(/[^a-z0-9]/g, "");
    const effectiveEmail = sanitizeUtf8((contactEmail?.trim() || `hiring@${companySlug || "client"}.com`).toLowerCase());
    const effectiveContactName = sanitizeUtf8(contactName?.trim() || "Hiring Lead");
    const effectiveRecruiterId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create ClientAccount
      let client = await tx.clientAccount.findFirst({
        where: {
          agencyId: session.user.agencyId!,
          name: { equals: trimmedCompany, mode: "insensitive" },
        },
      });

      if (!client) {
        client = await tx.clientAccount.create({
          data: {
            agencyId: session.user.agencyId!,
            name: trimmedCompany,
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
          email: { equals: effectiveEmail, mode: "insensitive" },
        },
      });

      if (!contact) {
        contact = await tx.clientContact.create({
          data: {
            agencyId: session.user.agencyId!,
            clientId: client.id,
            name: effectiveContactName,
            email: effectiveEmail,
            phone: contactPhone ? sanitizeUtf8(contactPhone.trim()) : null,
          },
        });
      }

      // 3. Create all JobMandate entries
      const createdMandates = [];
      for (const pos of positions) {
        const title = sanitizeUtf8(pos.title?.trim() || "Untitled Role");
        const openings = typeof pos.openings === "number" && pos.openings > 0 ? Math.floor(pos.openings) : 1;
        const minExp = typeof pos.minExp === "number" ? Math.max(0, Math.floor(pos.minExp)) : 0;
        const maxExp = typeof pos.maxExp === "number" ? Math.max(0, Math.floor(pos.maxExp)) : minExp + 3;
        const minCtc = typeof pos.minCtc === "number" ? pos.minCtc : null;
        const maxCtc = typeof pos.maxCtc === "number" ? pos.maxCtc : null;
        const location = pos.location ? sanitizeUtf8(pos.location.trim()) : null;
        const description = pos.description ? sanitizeUtf8(pos.description.trim()) : null;
        const workMode = ["REMOTE", "HYBRID", "ONSITE"].includes(pos.workMode) ? pos.workMode : WorkMode.HYBRID;
        const skills: string[] = Array.isArray(pos.skills)
          ? pos.skills.map((s: string) => sanitizeUtf8(String(s).trim())).filter(Boolean)
          : [];

        const mandate = await tx.jobMandate.create({
          data: {
            agencyId: session.user.agencyId!,
            clientId: client.id,
            contactId: contact.id,
            assignedRecruiterId: effectiveRecruiterId,
            title,
            openings,
            minExp,
            maxExp,
            minCtc,
            maxCtc,
            currency: pos.currency || "INR",
            location,
            workMode,
            skills,
            description,
            priority: PriorityLevel.MEDIUM,
            feePercentage: typeof feePercentage === "number" ? feePercentage : 8.33,
            guaranteeDays: typeof guaranteeDays === "number" ? guaranteeDays : 90,
            slaTargetHours: typeof slaTargetHours === "number" ? slaTargetHours : 72,
            slaStartedAt: new Date(),
            slaStatus: SlaStatus.HEALTHY,
            status: MandateStatus.ACTIVE_ASSIGNED,
            source: "SPREADSHEET_BATCH",
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            agencyId: session.user.agencyId!,
            userId: session.user.id,
            action: "MANDATE_BATCH_CREATED",
            entity: "JobMandate",
            entityId: mandate.id,
            metadata: {
              title: mandate.title,
              openings: mandate.openings,
              company: trimmedCompany,
              batchSize: positions.length,
            },
          },
        });

        createdMandates.push(mandate);
      }

      return {
        client,
        contact,
        mandates: createdMandates,
      };
    });

    return NextResponse.json({
      success: true,
      count: result.mandates.length,
      clientName: result.client.name,
      mandates: result.mandates.map((m) => ({
        id: m.id,
        title: m.title,
        openings: m.openings,
        location: m.location,
        status: m.status,
      })),
    });
  } catch (error: any) {
    console.error("Batch mandate creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create batch mandates." },
      { status: 500 }
    );
  }
}
