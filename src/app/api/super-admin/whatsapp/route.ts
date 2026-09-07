import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// GET /api/super-admin/whatsapp - Fetch current WhatsApp config, live Meta status & templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const config = await getWhatsAppConfig();
    const token = config.token;
    const phoneId = config.phoneNumberId;
    const wabaId = config.businessAccountId;

    let metaHealth: any = null;
    let templates: any[] = [];
    let connectionError: string | null = null;

    // If credentials are present, query Meta Graph API live
    if (token && token.trim().length > 10 && phoneId) {
      try {
        // 1. Fetch Phone Details & Quality
        const phoneRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}?access_token=${token}`);
        const phoneData = await phoneRes.json();

        if (phoneRes.ok) {
          metaHealth = {
            verifiedName: phoneData.verified_name || "Unverified Name",
            displayPhoneNumber: phoneData.display_phone_number || "N/A",
            qualityRating: phoneData.quality_rating || "UNKNOWN",
            codeVerificationStatus: phoneData.code_verification_status || "UNKNOWN",
            platformType: phoneData.platform_type || "CLOUD_API",
            throughput: phoneData.throughput?.level || "STANDARD",
            id: phoneData.id,
          };
        } else {
          connectionError = phoneData.error?.message || "Failed to authenticate with Meta Graph API.";
        }

        // 2. Fetch Templates if WABA ID is configured
        if (wabaId && phoneRes.ok) {
          try {
            const tmplRes = await fetch(
              `https://graph.facebook.com/v19.0/${wabaId}/message_templates?limit=100&access_token=${token}`
            );
            const tmplData = await tmplRes.json();
            if (tmplRes.ok && Array.isArray(tmplData.data)) {
              templates = tmplData.data.map((t: any) => ({
                id: t.id,
                name: t.name,
                status: t.status, // APPROVED, PENDING, REJECTED
                category: t.category,
                language: t.language,
                components: t.components,
              }));
            }
          } catch (tmplErr: any) {
            console.warn("Failed to fetch templates from Meta:", tmplErr.message);
          }
        }
      } catch (err: any) {
        connectionError = err.message || "Network error communicating with Meta.";
      }
    }

    // Mask token for security preview
    const maskedToken =
      token && token.length > 12
        ? `${token.slice(0, 7)}••••••••••••••••${token.slice(-6)}`
        : "";

    return NextResponse.json({
      config: {
        token: maskedToken,
        rawTokenConfigured: Boolean(token && token.length > 10),
        phoneNumberId: phoneId,
        businessAccountId: wabaId,
        devOverridePhone: config.devOverridePhone,
      },
      metaHealth,
      templates,
      connectionError,
      isConnected: Boolean(metaHealth && !connectionError),
    });
  } catch (error: any) {
    console.error("Error loading Super Admin WhatsApp config:", error);
    return NextResponse.json({ error: error.message || "Failed to load WhatsApp config." }, { status: 500 });
  }
}

// POST /api/super-admin/whatsapp - Save & verify new WhatsApp credentials
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const { token, phoneNumberId, businessAccountId, devOverridePhone } = body;

    if (!phoneNumberId) {
      return NextResponse.json({ error: "Phone Number ID is required." }, { status: 400 });
    }

    // Determine token to save (preserve existing if masked or blank)
    let tokenToSave = token?.trim();
    if (!tokenToSave || tokenToSave.includes("••••")) {
      const existing = await prisma.platformSetting.findUnique({ where: { id: "global" } });
      tokenToSave =
        existing?.whatsappApiToken ||
        process.env.WHATSAPP_API_TOKEN ||
        process.env.WHATSAPP_ACCESS_TOKEN ||
        "";
    }

    // Test credentials with Meta Graph API
    let metaHealth: any = null;
    let testError: string | null = null;

    if (tokenToSave && tokenToSave.length > 10) {
      try {
        const testRes = await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId.trim()}?access_token=${tokenToSave}`
        );
        const testData = await testRes.json();

        if (testRes.ok) {
          metaHealth = {
            verifiedName: testData.verified_name || "Unverified Name",
            displayPhoneNumber: testData.display_phone_number || "N/A",
            qualityRating: testData.quality_rating || "UNKNOWN",
          };
        } else {
          testError = testData.error?.message || "Invalid Meta credentials.";
        }
      } catch (err: any) {
        testError = "Could not reach Meta Graph API: " + err.message;
      }
    }

    if (testError) {
      return NextResponse.json(
        {
          error: `Meta Verification Failed: ${testError}`,
        },
        { status: 400 }
      );
    }

    // Upsert into PlatformSetting
    const updated = await prisma.platformSetting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        whatsappApiToken: tokenToSave,
        whatsappPhoneNumberId: phoneNumberId.trim(),
        whatsappBusinessAccountId: businessAccountId?.trim() || null,
        whatsappDevOverridePhone: devOverridePhone?.trim() || "919818352440",
      },
      update: {
        whatsappApiToken: tokenToSave,
        whatsappPhoneNumberId: phoneNumberId.trim(),
        whatsappBusinessAccountId: businessAccountId?.trim() || null,
        whatsappDevOverridePhone: devOverridePhone?.trim() || "919818352440",
      },
    });

    // Log in audit trail (agencyId is nullable for platform-level Super Admin events)
    try {
      let validAgencyId: string | null = null;
      if (session.user.agencyId) {
        const existingAgency = await prisma.agency.findUnique({
          where: { id: session.user.agencyId },
          select: { id: true },
        });
        if (existingAgency) {
          validAgencyId = existingAgency.id;
        }
      }

      await prisma.auditLog.create({
        data: {
          agencyId: validAgencyId,
          userId: session.user.id,
          action: "WHATSAPP_GATEWAY_CONFIG_UPDATED",
          entity: "PlatformSetting",
          entityId: updated.id,
          metadata: {
            phoneNumberId: updated.whatsappPhoneNumberId,
            businessAccountId: updated.whatsappBusinessAccountId,
            devOverridePhone: updated.whatsappDevOverridePhone,
            verifiedName: metaHealth?.verifiedName,
          },
        },
      });
    } catch (auditErr: any) {
      console.warn("Audit log creation bypassed:", auditErr.message);
    }

    return NextResponse.json({
      message: `WhatsApp Gateway settings saved and verified with Meta! (${metaHealth?.verifiedName || "Active"})`,
      metaHealth,
      setting: {
        phoneNumberId: updated.whatsappPhoneNumberId,
        businessAccountId: updated.whatsappBusinessAccountId,
        devOverridePhone: updated.whatsappDevOverridePhone,
      },
    });
  } catch (error: any) {
    console.error("Error updating Super Admin WhatsApp config:", error);
    return NextResponse.json({ error: error.message || "Failed to save WhatsApp config." }, { status: 500 });
  }
}
