import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeUtf8 } from "@/lib/resume-parser";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/whatsapp
 * Meta Webhook Handshake Verification
 * Meta validates the endpoint by sending:
 * hub.mode=subscribe, hub.verify_token=<TOKEN>, hub.challenge=<CHALLENGE>
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedVerifyToken =
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "recruitos_waba_webhook_token_2026";

    if (mode === "subscribe" && token === expectedVerifyToken) {
      console.log("✅ [WHATSAPP WEBHOOK] Handshake verified successfully by Meta.");
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn(
      `⚠️ [WHATSAPP WEBHOOK] Verification failed. Received token: "${token}", Expected: "${expectedVerifyToken}"`
    );
    return NextResponse.json({ error: "Forbidden: Verification token mismatch" }, { status: 403 });
  } catch (error: any) {
    console.error("GET /api/webhooks/whatsapp error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/webhooks/whatsapp
 * Receives incoming WhatsApp events from Meta:
 * - Candidate interactive slot selections (list_reply / button_reply)
 * - Candidate text replies (e.g. suggesting custom times or asking questions)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta sends webhook updates in entries
    const entries = body?.entry;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ status: "ignored_no_entries" }, { status: 200 });
    }

    for (const entry of entries) {
      const changes = entry?.changes;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          continue;
        }

        for (const msg of messages) {
          const senderPhone = msg.from; // e.g. "919818352440"
          const msgType = msg.type; // "interactive" | "text"

          let chosenSlotId: string | null = null;
          let userResponseText: string = "";

          if (msgType === "interactive") {
            const interactive = msg.interactive;
            if (interactive?.type === "list_reply") {
              chosenSlotId = interactive.list_reply?.id || null;
              userResponseText = interactive.list_reply?.title || "";
            } else if (interactive?.type === "button_reply") {
              chosenSlotId = interactive.button_reply?.id || null;
              userResponseText = interactive.button_reply?.title || "";
            }
          } else if (msgType === "text") {
            userResponseText = msg.text?.body || "";
          }

          if (!senderPhone) continue;

          // Normalize sender phone (last 10 digits for matching candidate in DB)
          const cleanDigits = senderPhone.replace(/[^0-9]/g, "");
          const last10Digits = cleanDigits.slice(-10);

          // Find candidate by phone number
          const candidate = await prisma.candidate.findFirst({
            where: {
              phone: {
                contains: last10Digits,
              },
            },
            include: {
              submissions: {
                include: {
                  mandate: {
                    include: {
                      client: true,
                    },
                  },
                },
                orderBy: {
                  updatedAt: "desc",
                },
                take: 1,
              },
            },
          });

          if (!candidate || candidate.submissions.length === 0) {
            console.log(
              `ℹ️ [WHATSAPP WEBHOOK] Message received from ${senderPhone}, but no matching candidate submission found.`
            );
            continue;
          }

          const submission = candidate.submissions[0];
          const mandate = submission.mandate;
          const agencyId = submission.agencyId;

          const isReschedule =
            chosenSlotId?.startsWith("SLOT_OTHER") ||
            userResponseText.toLowerCase().includes("suggest") ||
            userResponseText.toLowerCase().includes("other time") ||
            userResponseText.toLowerCase().includes("reschedule");

          const isSlotConfirmed =
            (chosenSlotId?.startsWith("SLOT_") && !isReschedule) ||
            userResponseText.toLowerCase().includes("option 1") ||
            userResponseText.toLowerCase().includes("option 2") ||
            userResponseText.toLowerCase().includes("option 3");

          // 1. Log to AuditLog (surfaces instantly in Recruiter Activity Feed)
          await prisma.auditLog.create({
            data: {
              agencyId,
              action: isSlotConfirmed
                ? "CANDIDATE_SLOT_CONFIRMED"
                : isReschedule
                ? "CANDIDATE_RESCHEDULE_REQUEST"
                : "CANDIDATE_WHATSAPP_REPLY",
              entity: "CandidateSubmission",
              entityId: submission.id,
              metadata: {
                candidateName: candidate.fullName,
                candidatePhone: senderPhone,
                mandateTitle: mandate.title,
                clientName: mandate.client.name,
                selectionId: chosenSlotId || "TEXT_MESSAGE",
                responseText: userResponseText,
                confirmedSlot: isSlotConfirmed ? userResponseText : null,
              },
            },
          });

          // 2. Append timestamped update to submission client notes
          const nowStr = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

          const notePrefix = isSlotConfirmed
            ? `[Candidate WhatsApp ${nowStr}]: Confirmed Slot -> "${userResponseText}"`
            : isReschedule
            ? `[Candidate WhatsApp ${nowStr}]: Requested alternative slot -> "${userResponseText}"`
            : `[Candidate WhatsApp ${nowStr}]: Reply -> "${userResponseText}"`;

          const existingNotes = submission.clientFeedbackNotes || "";
          await prisma.candidateSubmission.update({
            where: { id: submission.id },
            data: {
              clientFeedbackNotes: sanitizeUtf8(
                existingNotes ? `${existingNotes}\n${notePrefix}` : notePrefix
              ),
            },
          });

          // 3. Send automated WhatsApp acknowledgement back to the candidate
          try {
            if (isSlotConfirmed) {
              const confirmMsg = `✅ *Interview Slot Confirmed!*\n\nHi ${candidate.fullName},\n\nWe have locked in your selected slot (*${userResponseText}*) for the *${mandate.title}* interview with *${mandate.client.name}*.\n\nOur team is finalizing the meeting link and calendar invite, which will be sent to your email shortly.\n\nBest regards,\n*Botspring Recruitment Advisory*`;
              await sendWhatsAppTextMessage(senderPhone, confirmMsg);
            } else if (isReschedule) {
              const rescheduleMsg = `👍 *Alternative Slot Request Received*\n\nHi ${candidate.fullName},\n\nThank you for letting us know! Please reply with 1-2 days and time windows when you are available, and our recruiter will coordinate directly with the hiring manager.\n\nBest regards,\n*Botspring Recruitment Advisory*`;
              await sendWhatsAppTextMessage(senderPhone, rescheduleMsg);
            }
          } catch (replyErr) {
            console.error("Failed to send auto-reply to candidate:", replyErr);
          }
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/webhooks/whatsapp error:", error);
    // Always return 200 to Meta so it does not retry failed spam
    return NextResponse.json({ status: "error", error: error.message }, { status: 200 });
  }
}
