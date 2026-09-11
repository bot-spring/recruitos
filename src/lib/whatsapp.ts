import { prisma } from "@/lib/prisma";

/**
 * Meta WhatsApp Cloud API Integration Helper (RC-04, RC-05)
 * Dispatches candidate interview briefing & logistics notifications
 */

export interface WhatsAppInterviewPayload {
  candidateName: string;
  candidatePhone: string;
  roleTitle: string;
  clientOrgName: string;
  scheduledAt: string; // Formatted date time string
  durationMinutes: number;
  interviewType: string;
  meetingLink: string;
  panelistNames: string[];
  agencyName: string;
  recruiterName: string;
  recruiterPhone?: string;
  instructions?: string;
}

export interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  businessAccountId: string;
  devOverridePhone: string;
  isConfigured: boolean;
  isProductionMode: boolean;
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { id: "global" },
    });

    const isProductionMode = Boolean(setting?.isProductionMode);

    const token =
      setting?.whatsappApiToken?.trim() ||
      process.env.WHATSAPP_API_TOKEN ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      "";
    const phoneNumberId =
      setting?.whatsappPhoneNumberId?.trim() ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      "";
    const businessAccountId =
      setting?.whatsappBusinessAccountId?.trim() ||
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
      "";
    const devOverridePhone = isProductionMode
      ? ""
      : (setting?.whatsappDevOverridePhone?.trim() || process.env.DEV_OVERRIDE_PHONE || "919818352440");

    return {
      token,
      phoneNumberId,
      businessAccountId,
      devOverridePhone,
      isConfigured: Boolean(token && phoneNumberId),
      isProductionMode,
    };
  } catch (err) {
    return {
      token: process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || "",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
      devOverridePhone: process.env.DEV_OVERRIDE_PHONE || "919818352440",
      isConfigured: Boolean(
        (process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN) &&
          process.env.WHATSAPP_PHONE_NUMBER_ID
      ),
      isProductionMode: false,
    };
  }
}

export interface WhatsAppSandboxContext {
  isSandbox?: boolean;
  userPhone?: string | null;
  userName?: string | null;
}

export async function sendWhatsAppInterviewBriefing(
  payload: WhatsAppInterviewPayload,
  sandboxContext?: WhatsAppSandboxContext
) {
  const config = await getWhatsAppConfig();
  const token = config.token;
  const phoneNumberId = config.phoneNumberId;

  const isSandbox = Boolean(sandboxContext?.isSandbox);
  const sanitizedCandidatePhone = payload.candidatePhone.replace(/[^0-9]/g, "");

  let recipientPhone = sanitizedCandidatePhone;
  let devNotice = "";

  if (isSandbox) {
    const userTargetPhone = sandboxContext?.userPhone ? sandboxContext.userPhone.replace(/[^0-9]/g, "") : "";
    const devPhone = userTargetPhone || config.devOverridePhone.replace(/[^0-9]/g, "") || "919818352440";
    recipientPhone = devPhone;
    devNotice = `\n\n⚙️ *[QA DEMO SANDBOX]:* Intended candidate: ${payload.candidateName} (+${sanitizedCandidatePhone}). Delivered exclusively to demo device (+${devPhone}).`;
  }

  const messageText = `
🎯 *Interview Confirmed: ${payload.roleTitle}*
Hi ${payload.candidateName},

Your interview with *${payload.clientOrgName}* has been scheduled:

📅 *Date & Time:* ${payload.scheduledAt}
⏱️ *Duration:* ${payload.durationMinutes} Minutes
📌 *Round:* ${payload.interviewType.replace(/_/g, " ")}
💻 *Join Meeting:* ${payload.meetingLink}
${payload.panelistNames.length > 0 ? `👥 *Panelists:* ${payload.panelistNames.join(", ")}\n` : ""}${payload.instructions ? `📝 *Prep Guidance:* ${payload.instructions}\n` : ""}
💡 *Key Interview Prep Tips:*
1. Join 5 minutes early in a quiet environment with camera enabled.
2. Structure technical answers with situation, architecture approach, and trade-offs.
3. Prepare 2-3 thoughtful questions about the team's engineering roadmap.

For any prep support, reply directly to this message or contact ${payload.recruiterName} (${payload.recruiterPhone || "Search Lead"}).

Best of luck!
*${payload.agencyName} Talent Advisory*${devNotice}
`.trim();

  // If live Meta API token is configured, make the live API call
  if (token && phoneNumberId && token.trim().length > 10) {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { preview_url: true, body: messageText },
        }),
      });

      const json = await response.json();
      if (response.ok) {
        return {
          success: true,
          messageId: json.messages?.[0]?.id || `wa_live_${Date.now()}`,
          messageText,
        };
      } else {
        console.warn("WhatsApp API returned error response:", json);
      }
    } catch (err) {
      console.error("WhatsApp API dispatch failed:", err);
    }
  }

  // Graceful simulation / fallback logger for test & dev environments
  console.log("================================================================================");
  console.log(`📱 [WHATSAPP DISPATCH SIMULATION] Sent to: ${recipientPhone} (Intended: ${sanitizedCandidatePhone})`);
  console.log("--------------------------------------------------------------------------------");
  console.log(messageText);
  console.log("================================================================================");

  return {
    success: true,
    simulated: true,
    messageId: `wa_mock_${Date.now()}`,
    messageText,
  };
}

