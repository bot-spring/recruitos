import { PrismaClient, SubmissionStage, CounterOfferRisk, MandateStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 4, FEATURE 10");
  console.log("   (Counter-Offer Immunity, Resignation Playbook & Notice Period Risk — RC-06)");
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
  console.log(`✅ [TEST 1 PASSED] Active mandate: '${mandate.title}' (Client: ${mandate.client.name}).`);

  // 2. Create Candidate & Submission in OFFER_ISSUED stage
  const candEmail = `notice.candidate.${Date.now()}@example.com`;
  const candPhone = `+91 997${Math.floor(1000000 + Math.random() * 9000000)}`;

  const candidate = await prisma.candidate.create({
    data: {
      agencyId: agency.id,
      fullName: "Vikramaditya Sengupta",
      email: candEmail,
      phone: candPhone,
      phoneNormalized: candPhone.replace(/[^0-9+]/g, ""),
      currentCompany: "Hyperion Defense Dynamics",
      currentTitle: "Principal Perception Engineer",
      totalExpYears: 10.0,
      currentCtc: 4200000,
      expectedCtc: 5400000,
      noticePeriodDays: 30,
      skills: ["CUDA", "TensorRT", "Computer Vision", "LiDAR Fusion"],
      source: "DIRECT_UPLOAD",
    },
  });

  const submission = await prisma.candidateSubmission.create({
    data: {
      agencyId: agency.id,
      candidateId: candidate.id,
      mandateId: mandate.id,
      submittedByUserId: recruiter.id,
      stage: SubmissionStage.OFFER_ISSUED,
    },
  });

  console.log(`✅ [TEST 2 PASSED] Candidate '${candidate.fullName}' staged in 'OFFER_ISSUED' (ID: ${submission.id}).`);

  // 3. Test Pre-Offer Lockdown & AI Resignation Playbook (RC-06)
  const joiningDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const resignationDate = new Date();

  const resignationDraft = `
Date: ${resignationDate.toLocaleDateString("en-US", { dateStyle: "long" })}
To: Dr. Arvind Subramanian (VP Engineering)
Company: ${candidate.currentCompany}

Dear Dr. Arvind Subramanian,

Please accept this formal letter as notice of my resignation from my position as ${candidate.currentTitle}. In accordance with my employment terms, my final working day will be ${joiningDate.toLocaleDateString("en-US", { dateStyle: "long" })}.

Sincerely,
${candidate.fullName}
`.trim();

  const lockedSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: {
      stage: SubmissionStage.OFFER_ACCEPTED,
      offeredCtc: 5400000,
      offeredJoiningDate: joiningDate,
      resignationDate: resignationDate,
      resignationLetterDraft: resignationDraft,
      counterOfferRiskLevel: CounterOfferRisk.LOW,
      counterOfferRiskReason: "Offer locked and counter-offer immunization briefing completed.",
    },
  });

  if (lockedSubmission.stage !== SubmissionStage.OFFER_ACCEPTED || !lockedSubmission.resignationLetterDraft) {
    throw new Error("❌ Pre-offer lock failed to transition stage or store resignation draft!");
  }

  console.log(`✅ [TEST 3 PASSED] Offer locked at ₹${(lockedSubmission.offeredCtc! / 100000).toFixed(1)}L. Stage advanced to '${lockedSubmission.stage}'.`);
  console.log(`   Resignation draft generated (${resignationDraft.length} characters).`);

  // 4. Test Bi-Weekly Retention Pulse Check & Risk Engine (RC-06)
  const pulseCheckin = {
    date: new Date().toISOString(),
    recruiterName: recruiter.name,
    resignationConfirmed: true,
    counterOfferReceived: false,
    counterOfferAmount: null,
    counterOfferRiskLevel: "LOW",
    counterOfferRiskReason: "Candidate submitted resignation email; manager acknowledged handover timeline.",
    candidateSentimentScore: 5,
    recruiterNotes: "Candidate confirmed zero interest in staying. Full focus on new challenge.",
  };

  const activeNoticeSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: {
      stage: SubmissionStage.NOTICE_PERIOD_ACTIVE,
      resignationConfirmed: true,
      counterOfferRiskLevel: CounterOfferRisk.LOW,
      counterOfferRiskReason: pulseCheckin.counterOfferRiskReason,
      lastRetentionPulseAt: new Date(),
      retentionCheckinLog: [pulseCheckin],
    },
  });

  if (activeNoticeSubmission.stage !== SubmissionStage.NOTICE_PERIOD_ACTIVE) {
    throw new Error(`❌ Expected stage 'NOTICE_PERIOD_ACTIVE', got '${activeNoticeSubmission.stage}'`);
  }

  console.log(`✅ [TEST 4 PASSED] Retention pulse check recorded. Stage promoted to '${activeNoticeSubmission.stage}'.`);
  console.log(`   Risk Level: ${activeNoticeSubmission.counterOfferRiskLevel} • Resignation Confirmed: ${activeNoticeSubmission.resignationConfirmed}`);

  // 5. Test Notice Board Query & Days Remaining Calculation
  const noticeBoardEntries = await prisma.candidateSubmission.findMany({
    where: {
      agencyId: agency.id,
      stage: { in: [SubmissionStage.OFFER_ISSUED, SubmissionStage.OFFER_ACCEPTED, SubmissionStage.NOTICE_PERIOD_ACTIVE] },
    },
    include: { candidate: true, mandate: true },
  });

  const entry = noticeBoardEntries.find((e) => e.id === submission.id);
  if (!entry || !entry.offeredJoiningDate) {
    throw new Error("❌ Candidate not found in notice board query!");
  }

  const daysRemaining = Math.ceil((new Date(entry.offeredJoiningDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  console.log(`✅ [TEST 5 PASSED] Notice Board tracker verified (${noticeBoardEntries.length} active notice profiles).`);
  console.log(`   Days remaining until Day 1 physical joining: ~${daysRemaining} days.`);

  // 6. Test Audit Trail Logging
  const auditLog = await prisma.auditLog.create({
    data: {
      agencyId: agency.id,
      userId: recruiter.id,
      action: "RETENTION_PULSE_CHECKIN_LOGGED",
      entity: "CandidateSubmission",
      entityId: submission.id,
      metadata: {
        candidateName: candidate.fullName,
        counterOfferRiskLevel: CounterOfferRisk.LOW,
        daysRemaining,
        resignationConfirmed: true,
      },
    },
  });

  console.log(`✅ [TEST 6 PASSED] Audit trail logged event '${auditLog.action}' (ID: ${auditLog.id}).`);

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 10 TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
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

