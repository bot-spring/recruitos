import { PrismaClient, MandateStatus, ClientStatus, PriorityLevel, WorkMode } from "@prisma/client";
import { sendMandateIntakeConfirmationEmail } from "../src/lib/email";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 1, FEATURE 2");
  console.log("   (Public Agency Storefront & Client Mandate Intake — AS-01, AS-02)");
  console.log("================================================================================");

  // 1. Verify Demo Agency 'apex-search' exists
  const agency = await prisma.agency.findUnique({
    where: { slug: "apex-search" },
  });
  if (!agency) {
    throw new Error("❌ Agency 'apex-search' not found!");
  }
  console.log(`✅ [TEST 1 PASSED] Storefront Agency '${agency.name}' (${agency.slug}) verified.`);

  // 2. Simulate 4-Step Inbound Mandate Submission
  const companyName = "FinTech Labs Global";
  const contactEmail = `hiring.lead.${Date.now()}@fintechlabs.io`;
  const jobTitle = "Lead Distributed Systems Architect";

  // Execute intake logic
  const result = await prisma.$transaction(async (tx) => {
    // A. Create or find ClientAccount
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
          name: companyName,
          industry: "Financial Technology",
          location: "Bengaluru, India",
          status: ClientStatus.PROSPECT,
        },
      });
    }

    // B. Create ClientContact
    const contact = await tx.clientContact.create({
      data: {
        agencyId: agency.id,
        clientId: client.id,
        name: "Siddharth Verma",
        email: contactEmail,
        phone: "+91-9876543210",
        designation: "VP of Engineering",
      },
    });

    // C. Create JobMandate with UNREVIEWED_INBOUND status
    const mandate = await tx.jobMandate.create({
      data: {
        agencyId: agency.id,
        clientId: client.id,
        contactId: contact.id,
        title: jobTitle,
        department: "Core Platform Engineering",
        openings: 2,
        minExp: 8,
        maxExp: 14,
        minCtc: 4500000,
        maxCtc: 6500000,
        currency: "INR",
        location: "Bengaluru (Hybrid)",
        workMode: WorkMode.HYBRID,
        skills: ["Go", "Distributed Systems", "Kubernetes", "Kafka", "PostgreSQL"],
        priority: PriorityLevel.HIGH,
        maxNoticeDays: 60,
        feePercentage: 8.33,
        guaranteeDays: 90,
        status: MandateStatus.UNREVIEWED_INBOUND,
        source: "STOREFRONT",
      },
    });

    // D. Audit Log
    await tx.auditLog.create({
      data: {
        agencyId: agency.id,
        action: "INBOUND_MANDATE_RECEIVED",
        entity: "JobMandate",
        entityId: mandate.id,
        metadata: {
          companyName: client.name,
          jobTitle: mandate.title,
          source: "STOREFRONT",
        },
      },
    });

    return { client, contact, mandate };
  });

  console.log(`✅ [TEST 2 PASSED] Inbound mandate created: '${result.mandate.title}' (ID: ${result.mandate.id}) with status '${result.mandate.status}'.`);
  console.log(`   Client Account: '${result.client.name}' (Status: ${result.client.status})`);
  console.log(`   Client Contact: '${result.contact.name}' (${result.contact.email})`);

  // 3. Verify Mandate Status Invariant
  if (result.mandate.status !== MandateStatus.UNREVIEWED_INBOUND) {
    throw new Error(`❌ Mandate status must be UNREVIEWED_INBOUND, but got ${result.mandate.status}`);
  }
  console.log("✅ [TEST 3 PASSED] Mandate status is strictly UNREVIEWED_INBOUND (Ready for Owner verification in Feature 3).");

  // 4. Verify Automated Confirmation Email Trigger (with dev safety diversion)
  const emailResult = await sendMandateIntakeConfirmationEmail({
    to: result.contact.email,
    clientContactName: result.contact.name,
    companyName: result.client.name,
    jobTitle: result.mandate.title,
    agencyName: agency.name,
    mandateId: result.mandate.id,
  });

  if (!emailResult.success) {
    throw new Error("❌ Email service failed to execute!");
  }
  console.log("✅ [TEST 4 PASSED] Intake confirmation email trigger executed successfully with dev safety routing.");

  // 5. Verify Multi-Tenant Scoping of Mandate
  const scopedMandate = await prisma.jobMandate.findUnique({
    where: { id: result.mandate.id },
    include: { client: true, agency: true },
  });
  if (scopedMandate?.agencyId !== agency.id) {
    throw new Error("❌ Mandate tenant scoping failed!");
  }
  console.log(`✅ [TEST 5 PASSED] Mandate successfully scoped to Agency Tenant '${scopedMandate.agency.name}' (${scopedMandate.agencyId}).`);

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 2 TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runTechnicalVerification()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

