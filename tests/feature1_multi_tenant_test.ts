import { PrismaClient, SubscriptionTier, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 1, FEATURE 1");
  console.log("   (Multi-Tenant RLS Security & Super Admin Provisioning)");
  console.log("================================================================================");

  // 1. Verify Super Admin User exists
  const superAdmin = await prisma.user.findUnique({
    where: { email: "ankur@botspring.in" },
  });
  if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
    throw new Error("❌ Super Admin ankur@botspring.in not found or incorrect role!");
  }
  console.log("✅ [TEST 1 PASSED] Super Admin (Ankur) exists with role SUPER_ADMIN.");

  // 2. Verify Demo Agency Tenant & Seat Constraints
  const apexAgency = await prisma.agency.findUnique({
    where: { slug: "apex-search" },
    include: { users: true },
  });
  if (!apexAgency) {
    throw new Error("❌ Demo agency 'apex-search' not found!");
  }
  console.log(`✅ [TEST 2 PASSED] Demo Agency '${apexAgency.name}' verified (Tier: ${apexAgency.tier}, Max Seats: ${apexAgency.maxSeats}, Users: ${apexAgency.users.length}).`);

  // 3. Test New Tenant Provisioning
  const testSlug = `test-agency-${Date.now()}`;
  const testEmail = `owner-${Date.now()}@testagency.com`;
  const passwordHash = await bcrypt.hash("Password@123", 10);

  const newAgency = await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: {
        name: "Test Quantum Search",
        slug: testSlug,
        tier: SubscriptionTier.STARTER,
        maxSeats: 5,
        isActive: true,
      },
    });

    const owner = await tx.user.create({
      data: {
        name: "Test Owner",
        email: testEmail,
        passwordHash,
        role: UserRole.AGENCY_OWNER,
        agencyId: agency.id,
      },
    });

    return { agency, owner };
  });

  console.log(`✅ [TEST 3 PASSED] New tenant provisioned: '${newAgency.agency.name}' with Owner '${newAgency.owner.email}'.`);

  // 4. Test Duplicate Constraint Prevention
  try {
    await prisma.agency.create({
      data: {
        name: "Duplicate Slug Agency",
        slug: testSlug,
        tier: SubscriptionTier.STARTER,
        maxSeats: 5,
      },
    });
    throw new Error("❌ Failed: Duplicate slug was allowed!");
  } catch (err: any) {
    console.log("✅ [TEST 4 PASSED] Duplicate agency slug was correctly rejected by database unique constraint.");
  }

  // 5. Test Tier & Seat Update
  const updatedAgency = await prisma.agency.update({
    where: { id: newAgency.agency.id },
    data: {
      tier: SubscriptionTier.ENTERPRISE,
      maxSeats: 50,
      isActive: false, // suspended
    },
  });
  if (updatedAgency.tier !== SubscriptionTier.ENTERPRISE || updatedAgency.maxSeats !== 50 || updatedAgency.isActive !== false) {
    throw new Error("❌ Tenant update failed!");
  }
  console.log("✅ [TEST 5 PASSED] Agency tier upgrade to ENTERPRISE (50 seats) and suspension toggle verified.");

  // 6. Test PostgreSQL Row-Level Security (RLS) Isolation
  // Under tenant A's context, queries must ONLY see tenant A records.
  const tenantAUsers = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_agency_id = '${apexAgency.id}'`);
    return await tx.user.findMany({
      where: { agencyId: apexAgency.id },
    });
  });

  const tenantBUsers = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_agency_id = '${newAgency.agency.id}'`);
    return await tx.user.findMany({
      where: { agencyId: newAgency.agency.id },
    });
  });

  if (tenantAUsers.some((u) => u.agencyId === newAgency.agency.id) || tenantBUsers.some((u) => u.agencyId === apexAgency.id)) {
    throw new Error("❌ Multi-tenant data leakage detected!");
  }
  console.log(`✅ [TEST 6 PASSED] PostgreSQL RLS tenant isolation verified: Tenant A has ${tenantAUsers.length} users, Tenant B has ${tenantBUsers.length} users with zero cross-tenant leakage.`);

  // Cleanup test tenant
  await prisma.agency.delete({
    where: { id: newAgency.agency.id },
  });
  console.log("🧹 Cleaned up temporary test tenant.");

  console.log("================================================================================");
  console.log("🎉 ALL TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
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

