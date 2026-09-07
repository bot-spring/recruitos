import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// POST /api/super-admin/whatsapp/test - Dispatch test message or template to verify connection
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const config = await getWhatsAppConfig();
    const token = config.token;
    const phoneId = config.phoneNumberId;

    if (!token || !phoneId) {
      return NextResponse.json(
        { error: "WhatsApp credentials not configured. Please save credentials first." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      recipientPhone = config.devOverridePhone || "919818352440",
      type = "template",
      templateName = "hello_world",
      languageCode = "en_US",
      customText,
    } = body;

    const sanitizedPhone = String(recipientPhone).replace(/[^0-9]/g, "");
    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      return NextResponse.json({ error: "Valid 10+ digit recipient phone number is required." }, { status: 400 });
    }

    let metaBody: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: sanitizedPhone,
    };

    if (type === "template") {
      metaBody.type = "template";
      metaBody.template = {
        name: templateName,
        language: { code: languageCode },
      };
    } else {
      metaBody.type = "text";
      metaBody.text = {
        preview_url: true,
        body:
          customText?.trim() ||
          `🎯 RecruitOS Gateway Test: WhatsApp live connection test to ${sanitizedPhone} from Super Admin Dashboard!`,
      };
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || "Meta API returned an error.",
          metaError: data.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Test message dispatched successfully to +${sanitizedPhone}!`,
      metaMessageId: data.messages?.[0]?.id,
      response: data,
    });
  } catch (error: any) {
    console.error("Error dispatching test WhatsApp:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch test WhatsApp." }, { status: 500 });
  }
}

