import { PrismaClient, SubscriptionTier, UserRole, SubmissionStage, MandateStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 5, FEATURE 12");
  console.log("   (Super Admin Multi-Tenant Governance & Master Metrics — SA-01, SA-02)");
  console.log("================================================================================");

  // 1. Verify Super Admin User Account
  const superAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (!superAdmin) {
    throw new Error("❌ Super Admin user account not found!");
  }
  console.log(`✅ [TEST 1 PASSED] Super Admin identified: '${superAdmin.name}' (${superAdmin.email}).`);

  // 2. Test Master Metrics Aggregation (SA-02)
  const invoices = await prisma.placementInvoice.findMany();
  const totalPlatformGmv = invoices.reduce((sum, i) => sum + i.totalInvoiceAmount, 0);

  const agencies = await prisma.agency.findMany({
    include: { _count: { select: { users: true } } },
  });

  const totalAgencies = agencies.length;
  const activeAgencies = agencies.filter((a) => a.isActive).length;
  const totalAllocatedSeats = agencies.reduce((sum, a) => sum + a.maxSeats, 0);
  const totalUsedSeats = agencies.reduce((sum, a) => sum + a._count.users, 0);

  const totalPlacements = await prisma.candidateSubmission.count({
    where: { stage: SubmissionStage.JOINED_DAY_1_ACTIVE },
  });

  const totalCandidates = await prisma.candidate.count();
  const silverMedalists = await prisma.candidate.count({ where: { isSilverMedalist: true } });

  console.log(`✅ [TEST 2 PASSED] Master Metrics Computed:`);
  console.log(`   • Platform GMV: ₹${(totalPlatformGmv / 100000).toFixed(1)}L across ${invoices.length} invoices`);
  console.log(`   • Active Tenants: ${activeAgencies} / ${totalAgencies} Agencies`);
  console.log(`   • Seat Utilization: ${totalUsedSeats} / ${totalAllocatedSeats} Seats (${Math.round((totalUsedSeats / (totalAllocatedSeats || 1)) * 100)}%)`);
  console.log(`   • Talent Vault: ${totalCandidates} Candidates (${silverMedalists} Silver Medalists)`);
  console.log(`   • Confirmed Placements: ${totalPlacements} Placements`);

  // 3. Test Provisioning New Agency Tenant (SA-01)
  const testSlug = `zenith-exec-${Date.now()}`;
  const testOwnerEmail = `director.${Date.now()}@zenithexec.com`;
  const passwordHash = await bcrypt.hash("ZenithAdmin2026!", 10);

  const newAgency = await prisma.agency.create({
    data: {
      name: "Zenith Executive Search",
      slug: testSlug,
      tier: SubscriptionTier.GROWTH,
      maxSeats: 20,
      customDomain: `search.${testSlug}.com`,
      users: {
        create: {
          name: "Siddharth Nambiar",
          email: testOwnerEmail,
          passwordHash,
          role: UserRole.AGENCY_OWNER,
        },
      },
    },
    include: { users: true },
  });

  if (!newAgency || newAgency.users.length === 0) {
    throw new Error("❌ Failed to provision new agency tenant with initial owner!");
  }

  console.log(`✅ [TEST 3 PASSED] New Agency Tenant Provisioned: '${newAgency.name}' (Tier: ${newAgency.tier}, Seats: ${newAgency.maxSeats}).`);
  console.log(`   Managing Director: ${newAgency.users[0].name} (${newAgency.users[0].email}).`);

  // 4. Test Tenant Configuration Update & Governance (SA-01)
  const updatedAgency = await prisma.agency.update({
    where: { id: newAgency.id },
    data: {
      tier: SubscriptionTier.ENTERPRISE,
      maxSeats: 50,
      isActive: true,
      customDomain: `executive.zenith-global.com`,
    },
  });

  if (updatedAgency.tier !== SubscriptionTier.ENTERPRISE || updatedAgency.maxSeats !== 50) {
    throw new Error("❌ Failed to update agency configuration!");
  }

  console.log(`✅ [TEST 4 PASSED] Tenant configuration upgraded to '${updatedAgency.tier}' (${updatedAgency.maxSeats} seats, Domain: ${updatedAgency.customDomain}).`);

  // 5. Test Live Platform Global Audit Stream (SA-02)
  const auditEntry = await prisma.auditLog.create({
    data: {
      agencyId: newAgency.id,
      userId: superAdmin.id,
      action: "TENANT_PROVISIONED_AND_ACTIVATED",
      entity: "Agency",
      entityId: newAgency.id,
      metadata: {
        agencyName: newAgency.name,
        slug: newAgency.slug,
        tier: SubscriptionTier.ENTERPRISE,
        maxSeats: 50,
        provisionedBy: superAdmin.name,
      },
    },
  });

  const recentLogs = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { agency: true, user: true },
  });

  if (recentLogs.length === 0 || !recentLogs.some((l) => l.id === auditEntry.id)) {
    throw new Error("❌ Audit stream failed to record global platform action!");
  }

  console.log(`✅ [TEST 5 PASSED] Global audit log stream verified (${recentLogs.length} recent system events).`);
  console.log(`   Latest event: '${recentLogs[0].action}' by ${recentLogs[0].user?.name || "Super Admin"}.`);

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 12 TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
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

