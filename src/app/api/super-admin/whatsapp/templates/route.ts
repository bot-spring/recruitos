import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// POST /api/super-admin/whatsapp/templates - Submit a new template to Meta for approval
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required." }, { status: 401 });
    }

    const config = await getWhatsAppConfig();
    const token = config.token;
    const wabaId = config.businessAccountId;

    if (!token || !wabaId) {
      return NextResponse.json(
        { error: "WhatsApp API Token and WhatsApp Business Account ID (WABA) are required to create templates." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      category = "UTILITY",
      language = "en_US",
      headerText,
      bodyText,
      footerText,
      buttonText,
      buttonUrl,
      exampleBodyValues = [],
    } = body;

    if (!name || !bodyText) {
      return NextResponse.json({ error: "Template name and body text are required." }, { status: 400 });
    }

    // Build Meta Template Components
    const components: any[] = [];

    if (headerText?.trim()) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: headerText.trim(),
      });
    }

    const bodyComponent: any = {
      type: "BODY",
      text: bodyText.trim(),
    };

    if (exampleBodyValues.length > 0) {
      bodyComponent.example = {
        body_text: [exampleBodyValues],
      };
    }
    components.push(bodyComponent);

    if (footerText?.trim()) {
      components.push({
        type: "FOOTER",
        text: footerText.trim(),
      });
    }

    if (buttonText?.trim() && buttonUrl?.trim()) {
      const isDynamicUrl = buttonUrl.includes("{{1}}");
      const buttonObj: any = {
        type: "URL",
        text: buttonText.trim(),
        url: buttonUrl.trim(),
      };
      if (isDynamicUrl) {
        buttonObj.example = ["demo-token-123"];
      }
      components.push({
        type: "BUTTONS",
        buttons: [buttonObj],
      });
    }

    const metaPayload = {
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      category: category.toUpperCase(),
      language,
      components,
    };

    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaPayload),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return NextResponse.json(
        {
          error: metaData.error?.message || "Meta rejected template submission.",
          metaError: metaData.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Template '${name}' submitted to Meta successfully! Status: ${metaData.status || "PENDING"}`,
      template: metaData,
    });
  } catch (error: any) {
    console.error("Error submitting WhatsApp template:", error);
    return NextResponse.json({ error: error.message || "Failed to submit template." }, { status: 500 });
  }
}

