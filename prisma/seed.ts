import { PrismaClient, SubscriptionTier, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting RecruitOS Database Seed...");

  // 1. Create or Update Super Admin (Ankur)
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "ankur@botspring.in").toLowerCase().trim();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "Password@123";
  const superAdminName = process.env.SUPER_ADMIN_NAME || "Ankur (Botspring Platform Admin)";
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      passwordHash: superAdminHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: superAdminEmail,
      name: superAdminName,
      passwordHash: superAdminHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Super Admin configured: ${superAdmin.email} (Role: ${superAdmin.role})`);

  // 2. Create Demo Agency: Apex Search Partners
  const demoAgencySlug = "apex-search";
  const defaultPasswordHash = await bcrypt.hash("Password@123", 10);

  let agency = await prisma.agency.findUnique({
    where: { slug: demoAgencySlug },
  });

  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: "Apex Search Partners",
        slug: demoAgencySlug,
        tier: SubscriptionTier.GROWTH,
        maxSeats: 20,
        isActive: true,
        customDomain: "careers.apexsearch.com",
      },
    });
    console.log(`✅ Demo Agency provisioned: ${agency.name} (${agency.slug}) - Tier: ${agency.tier}, Seats: ${agency.maxSeats}`);
  }

  // 3. Create Demo Agency Owner
  const ownerEmail = "owner@apexsearch.com";
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: "Vikram Malhotra",
      passwordHash: defaultPasswordHash,
      role: UserRole.AGENCY_OWNER,
      agencyId: agency.id,
      isActive: true,
    },
    create: {
      email: ownerEmail,
      name: "Vikram Malhotra",
      passwordHash: defaultPasswordHash,
      role: UserRole.AGENCY_OWNER,
      agencyId: agency.id,
      isActive: true,
    },
  });
  console.log(`✅ Agency Owner created: ${owner.email} (${owner.name})`);

  // 4. Create Demo Desk Recruiter
  const recruiterEmail = "priya@apexsearch.com";
  const recruiter = await prisma.user.upsert({
    where: { email: recruiterEmail },
    update: {
      name: "Priya Sharma",
      passwordHash: defaultPasswordHash,
      role: UserRole.RECRUITER,
      agencyId: agency.id,
      isActive: true,
    },
    create: {
      email: recruiterEmail,
      name: "Priya Sharma",
      passwordHash: defaultPasswordHash,
      role: UserRole.RECRUITER,
      agencyId: agency.id,
      isActive: true,
    },
  });
  console.log(`✅ Desk Recruiter created: ${recruiter.email} (${recruiter.name})`);

  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

