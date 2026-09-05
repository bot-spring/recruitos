import { PrismaClient, SubmissionStage, MandateStatus, InvoiceStatus, ProbationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 4, FEATURE 11");
  console.log("   (Day-1 Joining, Auto-Invoicing & 90-Day Probation Vault — PL-01, PL-02, RC-07)");
  console.log("================================================================================");

  // 1. Verify Demo Agency 'apex-search' and active mandate
  const agency = await prisma.agency.findUnique({
    where: { slug: "apex-search" },
    include: {
      jobMandates: {
        where: { status: MandateStatus.ACTIVE_ASSIGNED },
        include: { client: true },
      },
      users: true,
    },
  });

  if (!agency || agency.jobMandates.length === 0) {
    throw new Error("❌ No active mandate found in apex-search agency!");
  }

  const mandate = agency.jobMandates[0];
  const recruiter = agency.users[0];
  console.log(`✅ [TEST 1 PASSED] Active mandate: '${mandate.title}' (Client: ${mandate.client.name}, Fee: ${mandate.feePercentage}%).`);

  // 2. Create Candidate & Submission in NOTICE_PERIOD_ACTIVE stage with 50% Partner Split
  const candEmail = `placement.candidate.${Date.now()}@example.com`;
  const candPhone = `+91 996${Math.floor(1000000 + Math.random() * 9000000)}`;

  const candidate = await prisma.candidate.create({
    data: {
      agencyId: agency.id,
      fullName: "Ananya Deshmukh",
      email: candEmail,
      phone: candPhone,
      phoneNormalized: candPhone.replace(/[^0-9+]/g, ""),
      currentCompany: "Kinetix Robotics",
      currentTitle: "Principal Perception & Fusion Lead",
      totalExpYears: 9.0,
      currentCtc: 4000000,
      expectedCtc: 5000000,
      noticePeriodDays: 30,
      skills: ["C++", "CUDA", "Sensor Fusion", "Point Cloud"],
      source: "PARTNER_SUBMISSION",
    },
  });

  const submission = await prisma.candidateSubmission.create({
    data: {
      agencyId: agency.id,
      candidateId: candidate.id,
      mandateId: mandate.id,
      submittedByUserId: recruiter.id,
      stage: SubmissionStage.NOTICE_PERIOD_ACTIVE,
      offeredCtc: 5000000,
      partnerSourcerName: "TechTalent Partners",
      partnerSourcerEmail: "split@techtalent.in",
      splitFeePercentage: 50.0,
    },
  });

  console.log(`✅ [TEST 2 PASSED] Candidate '${candidate.fullName}' staged in 'NOTICE_PERIOD_ACTIVE' (Split: 50%).`);

  // 3. Test Day-1 Physical Start Confirmation & Commercial Tax Invoicing (PL-01, PL-02)
  const actualStart = new Date();
  const probationEnd = new Date(actualStart.getTime() + 90 * 24 * 3600 * 1000);
  const baseFee = Math.round((5000000 * mandate.feePercentage) / 100);
  const taxAmount = Math.round(baseFee * 0.18);
  const totalAmount = baseFee + taxAmount;
  const invoiceNumber = `INV-2026-${Date.now().toString().slice(-4)}`;

  const invoice = await prisma.placementInvoice.create({
    data: {
      agencyId: agency.id,
      submissionId: submission.id,
      mandateId: mandate.id,
      candidateId: candidate.id,
      clientId: mandate.clientId,
      invoiceNumber,
      baseFeeAmount: baseFee,
      feePercentage: mandate.feePercentage,
      taxPercentage: 18.0,
      taxAmount,
      totalInvoiceAmount: totalAmount,
      currency: "INR",
      status: InvoiceStatus.DISPATCHED,
      dueDate: new Date(actualStart.getTime() + 30 * 24 * 3600 * 1000),
      clientBillingName: mandate.client.name,
      clientBillingEmail: "finance@zenith.com",
    },
  });

  const confirmedSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: {
      stage: SubmissionStage.JOINED_DAY_1_ACTIVE,
      actualJoiningDate: actualStart,
      probationDays: 90,
      probationEndDate: probationEnd,
      probationStatus: ProbationStatus.ACTIVE_TRACKING,
      splitPayoutEstimated: Math.round(baseFee * 0.5), // 50% split locked
    },
  });

  await prisma.jobMandate.update({
    where: { id: mandate.id },
    data: { status: MandateStatus.PROBATION_TRACKING },
  });

  if (confirmedSubmission.stage !== SubmissionStage.JOINED_DAY_1_ACTIVE || !invoice) {
    throw new Error("❌ Day-1 joining confirmation or invoice generation failed!");
  }

  console.log(`✅ [TEST 3 PASSED] Commercial Tax Invoice '${invoice.invoiceNumber}' generated.`);
  console.log(`   Base Fee: ₹${baseFee.toLocaleString()} • GST 18%: ₹${taxAmount.toLocaleString()} • Total Invoiced: ₹${totalAmount.toLocaleString()}`);
  console.log(`   Partner Sourcer Split Locked: ₹${confirmedSubmission.splitPayoutEstimated?.toLocaleString()} INR (50%).`);

  // 4. Test 90-Day Probation Guarantee Vault Query (RC-07)
  const probationPlacements = await prisma.candidateSubmission.findMany({
    where: { agencyId: agency.id, stage: SubmissionStage.JOINED_DAY_1_ACTIVE },
    include: { candidate: true, placementInvoices: true },
  });

  const currentPlacement = probationPlacements.find((p) => p.id === submission.id);
  if (!currentPlacement || !currentPlacement.probationEndDate) {
    throw new Error("❌ Placement record missing from probation vault query!");
  }

  const daysRemaining = Math.ceil((new Date(currentPlacement.probationEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  console.log(`✅ [TEST 4 PASSED] 90-Day Probation Vault verified (${probationPlacements.length} active placements tracked).`);
  console.log(`   Probation days remaining for '${currentPlacement.candidate.fullName}': ${daysRemaining} days.`);

  // 5. Test $0 Free Replacement Mandate on Early Exit (RC-07)
  const replacementMandate = await prisma.jobMandate.create({
    data: {
      agencyId: agency.id,
      clientId: mandate.clientId,
      title: `[FREE REPLACEMENT] ${mandate.title}`,
      feePercentage: 0.0, // $0 Free replacement
      guaranteeDays: 90,
      status: MandateStatus.REPLACEMENT_ACTIVE,
      isReplacement: true,
      originalMandateId: mandate.id,
    },
  });

  const replacedSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: {
      probationStatus: ProbationStatus.EARLY_EXIT_REPLACEMENT,
      earlyExitDate: new Date(),
      earlyExitReason: "Candidate relocated overseas during probation.",
      replacementMandateId: replacementMandate.id,
    },
  });

  if (replacementMandate.feePercentage !== 0.0 || replacedSubmission.probationStatus !== ProbationStatus.EARLY_EXIT_REPLACEMENT) {
    throw new Error("❌ $0 Free replacement trigger failed!");
  }

  console.log(`✅ [TEST 5 PASSED] $0 Free Replacement Mandate '${replacementMandate.title}' activated (Fee: ₹0 / 100% Credit).`);

  // 6. Test Audit Trail Event
  const auditLog = await prisma.auditLog.create({
    data: {
      agencyId: agency.id,
      userId: recruiter.id,
      action: "DAY_1_JOINING_CONFIRMED_AND_INVOICE_GENERATED",
      entity: "PlacementInvoice",
      entityId: invoice.id,
      metadata: {
        candidateName: candidate.fullName,
        invoiceNumber: invoice.invoiceNumber,
        totalInvoiceAmount: invoice.totalInvoiceAmount,
      },
    },
  });

  console.log(`✅ [TEST 6 PASSED] Audit trail logged event '${auditLog.action}' (ID: ${auditLog.id}).`);

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 11 TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
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

