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

/**
 * Send a plain WhatsApp text message to any recipient
 */
export async function sendWhatsAppTextMessage(
  toPhone: string,
  messageText: string,
  sandboxContext?: WhatsAppSandboxContext
) {
  const config = await getWhatsAppConfig();
  const token = config.token;
  const phoneNumberId = config.phoneNumberId;

  const isSandbox = Boolean(sandboxContext?.isSandbox);
  const sanitizedTo = toPhone.replace(/[^0-9]/g, "");

  let recipientPhone = sanitizedTo;
  if (isSandbox) {
    const userTargetPhone = sandboxContext?.userPhone ? sandboxContext.userPhone.replace(/[^0-9]/g, "") : "";
    recipientPhone = userTargetPhone || config.devOverridePhone.replace(/[^0-9]/g, "") || "919818352440";
  }

  if (token && phoneNumberId && token.trim().length > 10) {
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
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
          text: { preview_url: false, body: messageText },
        }),
      });

      const json = await response.json();
      if (response.ok) {
        return { success: true, messageId: json.messages?.[0]?.id || `wa_live_${Date.now()}` };
      } else {
        console.warn("sendWhatsAppTextMessage API error:", json);
      }
    } catch (err) {
      console.error("sendWhatsAppTextMessage dispatch failed:", err);
    }
  }

  console.log(`📱 [WHATSAPP TEXT SIMULATION] Sent to ${recipientPhone}: ${messageText}`);
  return { success: true, simulated: true };
}

export interface WhatsAppSlotOption {
  id: string; // e.g. "SLOT_1"
  title: string; // max 24 chars, e.g. "Thu 15 Oct @ 11:00 AM"
  description?: string; // max 72 chars, e.g. "Primary client proposed slot"
}

export interface WhatsAppCandidateSlotPayload {
  candidateName: string;
  candidatePhone: string;
  roleTitle: string;
  clientOrgName: string;
  agencyName: string;
  submissionId: string;
  slots: WhatsAppSlotOption[];
}

/**
 * Dispatches an Interactive List Picker message (CE-01)
 * Allows candidate to pick from up to 3 client slots or suggest another time
 */
export async function sendWhatsAppInterviewSlotSelection(
  payload: WhatsAppCandidateSlotPayload,
  sandboxContext?: WhatsAppSandboxContext
) {
  const config = await getWhatsAppConfig();
  const token = config.token;
  const phoneNumberId = config.phoneNumberId;

  const isSandbox = sandboxContext?.isSandbox !== undefined ? sandboxContext.isSandbox : !config.isProductionMode;
  const sanitizedCandidatePhone = payload.candidatePhone.replace(/[^0-9]/g, "");

  let recipientPhone = sanitizedCandidatePhone;
  let devNotice = "";

  if (isSandbox) {
    const userTargetPhone = sandboxContext?.userPhone ? sandboxContext.userPhone.replace(/[^0-9]/g, "") : "";
    const devPhone = userTargetPhone || config.devOverridePhone.replace(/[^0-9]/g, "") || "919818352440";
    recipientPhone = devPhone;
    devNotice = `\n\n⚙️ *[QA DEMO SANDBOX]:* Intended candidate: ${payload.candidateName} (+${sanitizedCandidatePhone}). Delivered to demo device (+${devPhone}).`;
  }

  // Build rows: up to 3 slots + 1 "Suggest another time"
  const rows = payload.slots.slice(0, 3).map((slot, idx) => ({
    id: `SLOT_${idx + 1}:${payload.submissionId}`,
    title: slot.title.slice(0, 24),
    description: (slot.description || `Proposed Option ${idx + 1}`).slice(0, 72),
  }));

  // Append 4th option: Suggest another time
  rows.push({
    id: `SLOT_OTHER:${payload.submissionId}`,
    title: "Suggest another time".slice(0, 24),
    description: "Request alternative days or times".slice(0, 72),
  });

  const bodyText = `Hi ${payload.candidateName},\n\nGreat news! *${payload.clientOrgName}* has reviewed your profile for *${payload.roleTitle}* and would like to invite you for an interview.\n\nPlease select your preferred slot below with 1 click:${devNotice}`;

  // Try live Meta Interactive List Message
  if (token && phoneNumberId && token.trim().length > 10) {
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "interactive",
          interactive: {
            type: "list",
            header: {
              type: "text",
              text: "Interview Invitation",
            },
            body: {
              text: bodyText,
            },
            footer: {
              text: `${payload.agencyName} Talent Advisory`,
            },
            action: {
              button: "Choose Slot",
              sections: [
                {
                  title: "Available Slots",
                  rows,
                },
              ],
            },
          },
        }),
      });

      const json = await response.json();
      if (response.ok) {
        return {
          success: true,
          messageId: json.messages?.[0]?.id || `wa_live_${Date.now()}`,
        };
      } else {
        console.warn("WhatsApp Interactive List API failed, falling back to text:", json);
      }
    } catch (err) {
      console.error("WhatsApp Interactive List dispatch error:", err);
    }
  }

  // Fallback to text message if interactive list is not permitted in initial session window
  const textFallback = `${bodyText}\n\n${rows
    .map((r, i) => `${i + 1}. *${r.title}* - ${r.description}`)
    .join("\n")}\n\nReply with your option number (1-${rows.length}) to confirm!`;

  return sendWhatsAppTextMessage(recipientPhone, textFallback);
}


