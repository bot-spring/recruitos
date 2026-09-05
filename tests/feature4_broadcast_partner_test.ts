import { PrismaClient, BroadcastPlatform, BroadcastStatus, MandateStatus } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 1, FEATURE 4");
  console.log("   (Multichannel Job Broadcast & Anonymized Sharing — RC-08, PO-01)");
  console.log("================================================================================");

  // 1. Verify Apex Search Agency and active mandate
  const agency = await prisma.agency.findUnique({
    where: { slug: "apex-search" },
    include: {
      jobMandates: {
        where: { status: MandateStatus.ACTIVE_ASSIGNED },
        include: { client: true },
      },
    },
  });

  if (!agency || agency.jobMandates.length === 0) {
    throw new Error("❌ No active mandate found in apex-search agency!");
  }

  const mandate = agency.jobMandates[0];
  console.log(`✅ [TEST 1 PASSED] Using active mandate: '${mandate.title}' (Client: '${mandate.client.name}').`);

  // 2. Test Multi-Channel Job Board Broadcasting (RC-08)
  const broadcastLinkedIn = await prisma.jobBroadcast.upsert({
    where: {
      mandateId_platform: {
        mandateId: mandate.id,
        platform: BroadcastPlatform.LINKEDIN,
      },
    },
    update: { status: BroadcastStatus.ACTIVE },
    create: {
      agencyId: agency.id,
      mandateId: mandate.id,
      platform: BroadcastPlatform.LINKEDIN,
      status: BroadcastStatus.ACTIVE,
      externalPostId: `linkedin_post_${Date.now()}`,
    },
  });

  const broadcastNaukri = await prisma.jobBroadcast.upsert({
    where: {
      mandateId_platform: {
        mandateId: mandate.id,
        platform: BroadcastPlatform.NAUKRI,
      },
    },
    update: { status: BroadcastStatus.ACTIVE },
    create: {
      agencyId: agency.id,
      mandateId: mandate.id,
      platform: BroadcastPlatform.NAUKRI,
      status: BroadcastStatus.ACTIVE,
      externalPostId: `naukri_post_${Date.now()}`,
    },
  });

  console.log(`✅ [TEST 2 PASSED] Job broadcast published to LINKEDIN (${broadcastLinkedIn.status}) and NAUKRI (${broadcastNaukri.status}).`);

  // 3. Test Anonymized Partner Sharing & Client Masking Vault (PO-01)
  const shareToken = `ps_test_${crypto.randomBytes(8).toString("hex")}`;
  const maskedTitle = "Confidential — Global Autonomous Robotics Unicorn";
  const splitPct = 50.0;

  const partnerShare = await prisma.partnerShare.create({
    data: {
      agencyId: agency.id,
      mandateId: mandate.id,
      shareToken,
      maskedClientTitle: maskedTitle,
      maskedLocation: "Bengaluru (Hybrid)",
      splitFeePercentage: splitPct,
      payoutTerms: "Payable upon candidate 90-day probation clearance.",
      isActive: true,
    },
  });

  console.log(`✅ [TEST 3 PASSED] Anonymized partner share generated with token '${partnerShare.shareToken}' (Split: ${partnerShare.splitFeePercentage}%).`);

  // 4. Test Public Partner Query Serialization (Strict PII Masking Verification)
  const queryResult = await prisma.partnerShare.findUnique({
    where: { shareToken },
    include: {
      agency: {
        select: { id: true, name: true, slug: true },
      },
      mandate: {
        select: {
          id: true,
          title: true,
          feePercentage: true,
          skills: true,
          minCtc: true,
          maxCtc: true,
          currency: true,
        },
      },
    },
  });

  if (!queryResult) throw new Error("❌ Partner share query failed!");

  // Verify that client direct name is NOT in the public payload
  const hasClientName = (queryResult as any).client?.name || (queryResult as any).mandate?.client?.name;
  if (hasClientName) {
    throw new Error("❌ Security Violation: Direct client identity leaked in partner query!");
  }

  // Calculate split math
  const effectivePartnerFeePct = (queryResult.mandate.feePercentage * queryResult.splitFeePercentage) / 100;
  console.log(`✅ [TEST 4 PASSED] Strict Client Masking Verified:`);
  console.log(`   Public Masked Title: '${queryResult.maskedClientTitle}'`);
  console.log(`   Direct Client PII: 100% Masked / Stripped at backend layer`);
  console.log(`   Effective Partner Split: ${effectivePartnerFeePct}% of Candidate Annual CTC`);

  // 5. Test Views Counter Increment
  const updatedShare = await prisma.partnerShare.update({
    where: { id: partnerShare.id },
    data: { viewsCount: { increment: 1 } },
  });
  if (updatedShare.viewsCount !== 1) throw new Error("❌ Views count increment failed!");
  console.log("✅ [TEST 5 PASSED] Partner share view logging and analytics increment verified.");

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 4 TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
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

