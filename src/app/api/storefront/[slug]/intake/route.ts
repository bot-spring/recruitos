import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MandateStatus, PriorityLevel, WorkMode, ClientStatus } from "@prisma/client";
import { sendMandateIntakeConfirmationEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const agency = await prisma.agency.findUnique({
      where: { slug: params.slug.toLowerCase().trim() },
    });

    if (!agency || !agency.isActive) {
      return NextResponse.json({ error: "Agency not found or inactive." }, { status: 404 });
    }

    const body = await req.json();
    const {
      // Step 1: Company Profile & Contact
      companyName,
      website,
      industry,
      companyLocation,
      contactName,
      contactEmail,
      contactPhone,
      contactDesignation,

      // Step 2: Role Details
      title,
      department,
      openings,
      minExp,
      maxExp,
      workMode,
      location,
      skills,
      description,

      // Step 3: Compensation & Notice
      minCtc,
      maxCtc,
      currency = "INR",
      maxNoticeDays,

      // Step 4: Engagement & Commercials
      feePercentage = 8.33,
      guaranteeDays = 90,
      priority = "MEDIUM",
      specialInstructions,
    } = body;

    // Field validations
    if (!companyName || !contactName || !contactEmail || !title) {
      return NextResponse.json(
        { error: "Missing mandatory fields: Company Name, Contact Name, Email, and Job Title are required." },
        { status: 400 }
      );
    }

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

    const selectedWorkMode: WorkMode =
      workMode && Object.values(WorkMode).includes(workMode) ? workMode : WorkMode.HYBRID;

    const selectedPriority: PriorityLevel =
      priority && Object.values(PriorityLevel).includes(priority) ? priority : PriorityLevel.MEDIUM;

    // Transaction to create/find ClientAccount, create/update ClientContact, create JobMandate
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create ClientAccount under agency_id
      let client = await tx.clientAccount.findFirst({
        where: {
          agencyId: agency.id,
          name: { equals: companyName.trim(), mode: "insensitive" },
        },
      });

      if (!client) {
        client = await tx.clientAccount.create({
          data: {
            agencyId: agency.id,
            name: companyName.trim(),
            website: website?.trim() || null,
            industry: industry?.trim() || null,
            location: companyLocation?.trim() || null,
            status: ClientStatus.PROSPECT,
          },
        });
      }

      // 2. Find or create ClientContact
      let contact = await tx.clientContact.findFirst({
        where: {
          agencyId: agency.id,
          clientId: client.id,
          email: { equals: contactEmail.toLowerCase().trim(), mode: "insensitive" },
        },
      });

      if (!contact) {
        contact = await tx.clientContact.create({
          data: {
            agencyId: agency.id,
            clientId: client.id,
            name: contactName.trim(),
            email: contactEmail.toLowerCase().trim(),
            phone: contactPhone?.trim() || null,
            designation: contactDesignation?.trim() || null,
          },
        });
      }

      // 3. Create the Job Mandate with UNREVIEWED_INBOUND status
      const mandate = await tx.jobMandate.create({
        data: {
          agencyId: agency.id,
          clientId: client.id,
          contactId: contact.id,
          title: title.trim(),
          department: department?.trim() || null,
          openings: parseInt(openings, 10) || 1,
          minExp: parseInt(minExp, 10) || 0,
          maxExp: parseInt(maxExp, 10) || 0,
          minCtc: minCtc ? parseFloat(minCtc) : null,
          maxCtc: maxCtc ? parseFloat(maxCtc) : null,
          currency: currency.toUpperCase().trim(),
          location: location?.trim() || null,
          workMode: selectedWorkMode,
          skills: skillsArray,
          description: description?.trim() || null,
          priority: selectedPriority,
          maxNoticeDays: maxNoticeDays ? parseInt(maxNoticeDays, 10) : 60,
          feePercentage: parseFloat(feePercentage) || 8.33,
          guaranteeDays: parseInt(guaranteeDays, 10) || 90,
          status: MandateStatus.UNREVIEWED_INBOUND,
          source: "STOREFRONT",
          specialInstructions: specialInstructions?.trim() || null,
        },
      });

      // 4. Record Audit Log for agency dashboard
      await tx.auditLog.create({
        data: {
          agencyId: agency.id,
          action: "INBOUND_MANDATE_RECEIVED",
          entity: "JobMandate",
          entityId: mandate.id,
          metadata: {
            companyName: client.name,
            jobTitle: mandate.title,
            contactEmail: contact.email,
            source: "STOREFRONT",
          },
        },
      });

      return { client, contact, mandate };
    });

    // 5. Send automated confirmation email to client hiring manager
    await sendMandateIntakeConfirmationEmail({
      to: result.contact.email,
      clientContactName: result.contact.name,
      companyName: result.client.name,
      jobTitle: result.mandate.title,
      agencyName: agency.name,
      mandateId: result.mandate.id,
    });

    return NextResponse.json(
      {
        message: "Hiring requirement submitted successfully.",
        mandate: {
          id: result.mandate.id,
          title: result.mandate.title,
          status: result.mandate.status,
          companyName: result.client.name,
          createdAt: result.mandate.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error ingesting storefront mandate:", error);
    return NextResponse.json({ error: error.message || "Failed to process mandate submission" }, { status: 500 });
  }
}

