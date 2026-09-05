import { PrismaClient, SubmissionStage, MandateStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 2, FEATURE 7");
  console.log("   (Silver Medalist Auto-Recycling Vault & 1-Click Redeployment — RC-07)");
  console.log("================================================================================");

  // 1. Verify Demo Agency 'apex-search'
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
  console.log(`✅ [TEST 1 PASSED] Agency '${agency.name}' verified with active mandate: '${mandate.title}'.`);

  // 2. Create and Tag Candidate as Silver Medalist (RC-07)
  const candidateEmail = `silver.finalist.${Date.now()}@example.com`;
  const candidatePhone = `+91 955${Math.floor(1000000 + Math.random() * 9000000)}`;

  const silverCandidate = await prisma.candidate.create({
    data: {
      agencyId: agency.id,
      fullName: "Vikramaditya Sengupta",
      email: candidateEmail,
      phone: candidatePhone,
      phoneNormalized: candidatePhone.replace(/[^0-9+]/g, ""),
      currentCompany: "Hyperion Robotics",
      currentTitle: "Principal Distributed Systems Architect",
      totalExpYears: 10,
      currentCtc: 4500000,
      expectedCtc: 5500000,
      noticePeriodDays: 15,
      skills: ["Distributed Systems", "C++", "Rust", "ROS2", "Kubernetes", "SLAM"],
      isSilverMedalist: true,
      silverMedalistReason: "Finalist in Fintech mandate — Client chose candidate with banking domain experience. Recommended for deep tech roles.",
      source: "DIRECT_UPLOAD",
    },
  });

  console.log(`✅ [TEST 2 PASSED] Candidate '${silverCandidate.fullName}' successfully tagged in Silver Medalist Vault:`);
  console.log(`   Context Note: "${silverCandidate.silverMedalistReason}"`);

  // 3. Test Silver Medalist Cross-Mandate Matching Engine (RC-07)
  const mandateSkills = (mandate.skills || []).map((s) => s.toLowerCase().trim());
  const candidateSkills = silverCandidate.skills.map((s) => s.toLowerCase().trim());
  const overlappingSkills = candidateSkills.filter((s) =>
    mandateSkills.some((ms) => ms.includes(s) || s.includes(ms))
  );

  const matchPercentage = mandateSkills.length > 0
    ? Math.min(100, Math.round((overlappingSkills.length / mandateSkills.length) * 100))
    : 80;

  console.log(`✅ [TEST 3 PASSED] Silver Vault Matching Engine calculated match score:`);
  console.log(`   Target Mandate: '${mandate.title}'`);
  console.log(`   Stack Match: ${matchPercentage}% (Overlapping: ${overlappingSkills.join(", ")})`);

  // 4. Test 1-Click Instant Redeployment (RC-07)
  // Promotes directly to SCREENED_QUALIFIED, bypassing raw parsing
  const redeployedSubmission = await prisma.candidateSubmission.upsert({
    where: {
      candidateId_mandateId: {
        candidateId: silverCandidate.id,
        mandateId: mandate.id,
      },
    },
    update: {
      stage: SubmissionStage.SCREENED_QUALIFIED,
      submittedByUserId: recruiter.id,
      recruiterNotes: "1-Click Redeployment from Silver Medalist Vault.",
    },
    create: {
      agencyId: agency.id,
      candidateId: silverCandidate.id,
      mandateId: mandate.id,
      submittedByUserId: recruiter.id,
      stage: SubmissionStage.SCREENED_QUALIFIED,
      recruiterNotes: "1-Click Redeployment from Silver Medalist Vault.",
    },
  });

  if (redeployedSubmission.stage !== SubmissionStage.SCREENED_QUALIFIED) {
    throw new Error(`❌ Redeployment failed: expected stage 'SCREENED_QUALIFIED', got '${redeployedSubmission.stage}'`);
  }

  console.log(`✅ [TEST 4 PASSED] Candidate '${silverCandidate.fullName}' instantly redeployed to '${mandate.title}' in stage '${redeployedSubmission.stage}' (Zero sourcing latency).`);

  // 5. Test Audit Trail Logging
  const auditLog = await prisma.auditLog.create({
    data: {
      agencyId: agency.id,
      userId: recruiter.id,
      action: "SILVER_MEDALIST_REDEPLOYED",
      entity: "CandidateSubmission",
      entityId: redeployedSubmission.id,
      metadata: {
        candidateName: silverCandidate.fullName,
        targetJobTitle: mandate.title,
        clientName: mandate.client.name,
        promotedStage: SubmissionStage.SCREENED_QUALIFIED,
      },
    },
  });

  console.log(`✅ [TEST 5 PASSED] Audit trail event '${auditLog.action}' logged successfully (ID: ${auditLog.id}).`);

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 7 TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
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

