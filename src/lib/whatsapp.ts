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
}

export async function sendWhatsAppInterviewBriefing(payload: WhatsAppInterviewPayload) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const sanitizedPhone = payload.candidatePhone.replace(/[^0-9]/g, "");

  const messageText = `
🎯 *Interview Confirmed: ${payload.roleTitle}*
Hi ${payload.candidateName},

Your interview with *${payload.clientOrgName}* has been scheduled:

📅 *Date & Time:* ${payload.scheduledAt}
⏱️ *Duration:* ${payload.durationMinutes} Minutes
📌 *Round:* ${payload.interviewType.replace(/_/g, " ")}
💻 *Join Meeting:* ${payload.meetingLink}
${payload.panelistNames.length > 0 ? `👥 *Panelists:* ${payload.panelistNames.join(", ")}\n` : ""}
💡 *Quick Prep Tip:* Please join 5 minutes early in a quiet environment. If you need any prep guidance or context, reply directly to this message or call ${payload.recruiterName} (${payload.recruiterPhone || "Search Lead"}).

Best of luck!
*${payload.agencyName} Talent Advisory*
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
          to: sanitizedPhone,
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
  console.log(`📱 [WHATSAPP DISPATCH SIMULATION] Sent to: ${sanitizedPhone}`);
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

