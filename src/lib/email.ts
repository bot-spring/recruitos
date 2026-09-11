import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Nodemailer Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_SMTP_USER || "ankur@botspring.in",
    pass: process.env.GMAIL_SMTP_PASS || "",
  },
});

export interface EmailSandboxContext {
  isSandbox?: boolean;
  userEmail?: string;
  userName?: string;
}

export function resolveEmailRouting({
  to,
  cc = [],
  subject,
  sandboxContext,
}: {
  to: string;
  cc?: string[];
  subject: string;
  sandboxContext?: EmailSandboxContext;
}) {
  const isSandbox = Boolean(sandboxContext?.isSandbox);
  if (isSandbox) {
    const destination =
      sandboxContext?.userEmail?.trim() || process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in";
    return {
      recipient: destination,
      ccRecipients: [] as string[],
      subject: `[DEMO TEST] ${subject}`,
      isSandbox: true,
      originalTo: to,
      originalCc: cc,
      bannerHtml: `
        <div style="background-color: #fef3c7; border: 1.5px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;">
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center;">
            🧪 QA SANDBOX DEMO DISPATCH
          </div>
          <div>Initiated by: <strong>${sandboxContext?.userName || sandboxContext?.userEmail || "Demo User"}</strong></div>
          <div style="margin-top: 2px;">Original intended recipient: <code style="background-color: #fde68a; padding: 1px 4px; border-radius: 4px;">${to}</code> ${cc.length > 0 ? `(CC: <code style="background-color: #fde68a; padding: 1px 4px; border-radius: 4px;">${cc.join(", ")}</code>)` : ""}</div>
          <div style="margin-top: 4px; font-weight: 600; color: #b45309;">🛡️ Safe Sandbox Guarantee: Delivered exclusively to your test inbox. Real client/candidate was NOT contacted.</div>
        </div>
      `,
    };
  }

  // Live production routing: recipient receives email, CCs receive email
  return {
    recipient: to,
    ccRecipients: cc.filter((c) => c && c.toLowerCase() !== to.toLowerCase()),
    subject,
    isSandbox: false,
    originalTo: to,
    originalCc: cc,
    bannerHtml: "",
  };
}

export interface MandateIntakeEmailProps {
  to: string;
  clientContactName: string;
  companyName: string;
  jobTitle: string;
  agencyName: string;
  mandateId: string;
  sandboxContext?: EmailSandboxContext;
}

export interface ClientOnboardingEmailProps {
  to: string;
  clientContactName: string;
  companyName: string;
  jobTitle: string;
  agencyName: string;
  mandateId: string;
  feePercentage: number;
  guaranteeDays: number;
  slaHours: number;
  recruiterName: string;
  recruiterEmail: string;
  sandboxContext?: EmailSandboxContext;
}

export interface InterviewInviteEmailProps {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  agencyName: string;
  scheduledAt: string;
  durationMinutes: number;
  interviewType: string;
  meetingLink: string;
  panelistNames: string[];
  instructions?: string | null;
  keySkills?: string[];
  sandboxContext?: EmailSandboxContext;
}

/**
 * Sends a confirmation email to the hiring manager after storefront mandate submission.
 * In development mode, recipient is diverted or logged to ankur@botspring.in for dev safety.
 */
export async function sendMandateIntakeConfirmationEmail({
  to,
  clientContactName,
  companyName,
  jobTitle,
  agencyName,
  mandateId,
  sandboxContext,
}: MandateIntakeEmailProps) {
  const routing = resolveEmailRouting({
    to,
    subject: `Mandate Received: ${jobTitle} — ${agencyName}`,
    sandboxContext,
  });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      ${routing.bannerHtml}
      <div style="background-color: #d3dbed; padding: 24px; text-align: center; border-bottom: 1px solid #cbd5e1;">
        <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${agencyName}</h1>
        <p style="margin: 4px 0 0 0; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Hiring Mandate Intake Acknowledgment</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
          Dear <strong>${clientContactName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          Thank you for trusting <strong>${agencyName}</strong> with your hiring requirements for <strong>${companyName}</strong>. We have successfully logged your mandate in our recruitment operating engine.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 40%;">Position:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${jobTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Organization:</td>
              <td style="padding: 6px 0; color: #0f172a;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Mandate Reference:</td>
              <td style="padding: 6px 0; font-family: monospace; color: #0f172a;">${mandateId.substring(0, 8)}...</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Status:</td>
              <td style="padding: 6px 0; color: #d97706; font-weight: 700;">Under Senior Partner Review</td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.6;">
          <strong>Next Steps:</strong> An assigned Delivery Lead from our team will review the specifications, verify commercial parameters, and begin sourcing pre-vetted shortlists within our 72-hour velocity commitment.
        </p>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b;">
          Warm regards,<br />
          <strong>The Team at ${agencyName}</strong><br />
          <span style="font-size: 11px; color: #94a3b8;">Powered by RecruitOS Digital Talent Engine</span>
        </p>
      </div>
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Email logged for: ${routing.recipient}`);
      console.log(`   Subject: ${routing.subject}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} via RecruitOS" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: routing.recipient,
      subject: routing.subject,
      html: htmlContent,
    });

    console.log(`📧 Intake confirmation email dispatched: ${info.messageId} to ${routing.recipient}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch email via SMTP (continuing workflow):", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an official onboarding welcome & kickoff email when Owner/TL approves the mandate and assigns a recruiter.
 */
export async function sendClientOnboardingWelcomeEmail({
  to,
  clientContactName,
  companyName,
  jobTitle,
  agencyName,
  mandateId,
  feePercentage,
  guaranteeDays,
  slaHours,
  recruiterName,
  recruiterEmail,
  sandboxContext,
}: ClientOnboardingEmailProps) {
  const routing = resolveEmailRouting({
    to,
    subject: `Search Mandate Activated: ${jobTitle} — ${agencyName}`,
    sandboxContext,
  });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      ${routing.bannerHtml}
      <div style="background-color: #d3dbed; padding: 24px; text-align: center; border-bottom: 1px solid #cbd5e1;">
        <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${agencyName}</h1>
        <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Executive Search Mandate Activated</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
          Dear <strong>${clientContactName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          We are pleased to inform you that your search mandate for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been officially approved and activated on our talent delivery desk.
        </p>

        <!-- Terms & SLAs Grid -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Role Title:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${jobTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Placement Fee:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${feePercentage}% of CTC</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Replacement Guarantee:</td>
              <td style="padding: 6px 0; color: #0f172a;">${guaranteeDays} Calendar Days</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">First Shortlist SLA:</td>
              <td style="padding: 6px 0; color: #059669; font-weight: 700;">Within ${slaHours} Hours</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Assigned Recruiter:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${recruiterName} (${recruiterEmail})</td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.6;">
          Your assigned Desk Lead <strong>${recruiterName}</strong> has begun screening qualified profiles and will present your first candidate shortlist via our zero-login interactive review link.
        </p>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b;">
          Warm regards,<br />
          <strong>The Leadership Team at ${agencyName}</strong><br />
          <span style="font-size: 11px; color: #94a3b8;">Powered by RecruitOS Multi-Tenant Talent Engine</span>
        </p>
      </div>
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Onboarding kickoff email logged for: ${routing.recipient}`);
      console.log(`   Subject: ${routing.subject}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Executive Search" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: routing.recipient,
      subject: routing.subject,
      html: htmlContent,
    });

    console.log(`📧 Onboarding email dispatched: ${info.messageId} to ${routing.recipient}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch onboarding email via SMTP:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends formatted interview invitation email with meeting link and panelist details (RC-04).
 */
export async function sendInterviewInvitationEmail({
  to,
  candidateName,
  jobTitle,
  companyName,
  agencyName,
  scheduledAt,
  durationMinutes,
  interviewType,
  meetingLink,
  panelistNames,
  instructions,
  keySkills = [],
  sandboxContext,
}: InterviewInviteEmailProps) {
  const routing = resolveEmailRouting({
    to,
    subject: `Interview Invitation: ${jobTitle} with ${companyName}`,
    sandboxContext,
  });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      ${routing.bannerHtml}
      <div style="background-color: #d3dbed; padding: 24px; text-align: center; border-bottom: 1px solid #cbd5e1;">
        <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${agencyName}</h1>
        <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Interview Confirmed</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
          Dear <strong>${candidateName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          Your interview round for the <strong>${jobTitle}</strong> position with <strong>${companyName}</strong> has been confirmed.
        </p>

        <!-- Interview Logistics Table -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 35%;">Date & Time:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${scheduledAt}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Duration:</td>
              <td style="padding: 6px 0; color: #0f172a;">${durationMinutes} Minutes</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Format / Round:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${interviewType.replace(/_/g, " ")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Video Meeting Link:</td>
              <td style="padding: 6px 0; font-weight: 700;"><a href="${meetingLink}" style="color: #2563eb;">${meetingLink}</a></td>
            </tr>
            ${
              panelistNames.length > 0
                ? `<tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Panelists:</td>
                    <td style="padding: 6px 0; color: #0f172a;">${panelistNames.join(", ")}</td>
                  </tr>`
                : ""
            }
          </table>
        </div>

        <!-- Automated Interview Preparation Kit (CE-02) -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; font-size: 14px; color: #166534; font-weight: 800;">
              🎯 Interview Success & Preparation Kit (CE-02)
            </h3>
          </div>

          ${
            instructions
              ? `<div style="background-color: #ffffff; border: 1px solid #dcfce7; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; font-size: 12px; color: #15803d;">
                  <strong>Special Recruiter Instructions:</strong><br />
                  <span style="color: #1e293b;">${instructions}</span>
                </div>`
              : ""
          }

          ${
            keySkills.length > 0
              ? `<p style="margin: 0 0 10px 0; font-size: 12px; color: #166534;">
                  <strong>Core Evaluation Focus:</strong> ${keySkills.join(", ")}
                </p>`
              : ""
          }

          <div style="font-size: 12px; color: #334155; line-height: 1.6;">
            <strong style="color: #0f172a;">Candidate Best Practice Frameworks:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px;">
              <li><strong>The Orange Test (Clarify Objectives):</strong> Before answering complex technical or architectural questions, always clarify the underlying requirements and constraints first.</li>
              <li><strong>The STAR Framework:</strong> Structure behavioral answers cleanly: <em>Situation &rarr; Task &rarr; Action &rarr; Result</em>.</li>
              <li><strong>Environment Check:</strong> Test camera, microphone, and quiet background lighting 5 minutes prior to start.</li>
              <li><strong>Ask Smart Questions:</strong> Have 2-3 thoughtful questions prepared about team challenges and architecture roadmap.</li>
            </ul>
          </div>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b;">
          Best of luck,<br />
          <strong>${agencyName} Talent Advisory</strong>
        </p>
      </div>

    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Interview invite logged for: ${routing.recipient}`);
      console.log(`   Subject: ${routing.subject}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Talent Advisory" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: routing.recipient,
      subject: routing.subject,
      html: htmlContent,
    });

    console.log(`📧 Interview invite email dispatched: ${info.messageId} to ${routing.recipient}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch interview email via SMTP:", error.message);
    return { success: false, error: error.message };
  }
}

export interface PlacementInvoiceEmailProps {
  to: string;
  clientContactName: string;
  companyName: string;
  candidateName: string;
  jobTitle: string;
  agencyName: string;
  invoiceNumber: string;
  baseFeeAmount: number;
  taxAmount: number;
  totalInvoiceAmount: number;
  currency: string;
  dueDate: string;
  sandboxContext?: EmailSandboxContext;
}

/**
 * Dispatches commercial tax invoice for candidate placement (PL-02).
 */
export async function sendPlacementInvoiceEmail({
  to,
  clientContactName,
  companyName,
  candidateName,
  jobTitle,
  agencyName,
  invoiceNumber,
  baseFeeAmount,
  taxAmount,
  totalInvoiceAmount,
  currency,
  dueDate,
  sandboxContext,
}: PlacementInvoiceEmailProps) {
  const routing = resolveEmailRouting({
    to,
    subject: `Invoice ${invoiceNumber}: ${candidateName} (${jobTitle}) — ${agencyName}`,
    sandboxContext,
  });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      ${routing.bannerHtml}
      <div style="background-color: #d3dbed; padding: 24px; text-align: center; border-bottom: 1px solid #cbd5e1;">
        <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">${agencyName}</h1>
        <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Placement Commercial Tax Invoice</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
          Dear Accounts Team at <strong>${companyName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          Please find attached our placement commission invoice for the successful hiring of <strong>${candidateName}</strong> for the <strong>${jobTitle}</strong> position.
        </p>

        <!-- Invoice Breakdown Table -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Invoice Reference:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #0f172a;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Due Date:</td>
              <td style="padding: 6px 0; color: #d97706; font-weight: 700;">${dueDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Base Professional Fee:</td>
              <td style="padding: 6px 0; color: #0f172a;">${currency} ${baseFeeAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">GST / Applicable Tax:</td>
              <td style="padding: 6px 0; color: #0f172a;">${currency} ${taxAmount.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 10px 0 0 0; color: #0f172a; font-weight: 800; font-size: 14px;">Total Payable:</td>
              <td style="padding: 10px 0 0 0; color: #16a34a; font-weight: 800; font-size: 15px;">${currency} ${totalInvoiceAmount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          * Covered under our standard 90-day replacement guarantee policy.
        </p>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b;">
          Warm regards,<br />
          <strong>${agencyName} Finance & Client Accounts</strong>
        </p>
      </div>
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Invoice email logged for: ${routing.recipient}`);
      console.log(`   Subject: ${routing.subject}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Billing" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: routing.recipient,
      subject: routing.subject,
      html: htmlContent,
    });

    console.log(`📧 Placement invoice email dispatched: ${info.messageId} to ${routing.recipient}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch invoice email via SMTP:", error.message);
    return { success: false, error: error.message };
  }
}

export interface ClientShortlistPresentationEmailProps {
  to: string;
  cc?: string[];
  clientContactName: string;
  companyName: string;
  jobTitle: string;
  agencyName: string;
  shareableUrl: string;
  feedbackSlaHours: number;
  candidates: Array<{
    fullName: string;
    email: string;
    phone: string;
    currentCompany: string;
    designation: string;
    totalExpYears: number;
    relevantExpYears: number | null;
    qualification: string;
    currentSalary: string;
    expectedSalary: string;
    noticePeriod: string;
    readyToRelocate: string;
    location: string;
    reasonForLeaving: string;
    offerInHand: string;
    source: string;
    dateOfSourcing: string;
    resumeUrl?: string | null;
  }>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
  sandboxContext?: EmailSandboxContext;
}

/**
 * Sends candidate shortlist presentation email to Client Hiring Lead with 19-column horizontal table,
 * interactive 7-day feedback link, and attached resume PDF copies.
 */
export async function sendClientShortlistPresentationEmail({
  to,
  cc = [],
  clientContactName,
  companyName,
  jobTitle,
  agencyName,
  shareableUrl,
  feedbackSlaHours,
  candidates,
  attachments = [],
  sandboxContext,
}: ClientShortlistPresentationEmailProps) {
  const routing = resolveEmailRouting({
    to,
    cc,
    subject: `Candidate Shortlist: ${jobTitle} — ${companyName} (${candidates.length} Profiles)`,
    sandboxContext,
  });

  const tableRowsHtml = candidates.map((c, idx) => {
    const formattedDate = c.dateOfSourcing
      ? new Date(c.dateOfSourcing).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
      : "Recent";
    const expText = `${c.totalExpYears || 0}yr`;
    const relExpText = c.relevantExpYears !== null && c.relevantExpYears !== undefined ? `${c.relevantExpYears}yr` : "N/A";

    return `
      <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; white-space: nowrap; color: #0f172a;">${formattedDate}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a;">${c.source || "Direct"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a;">${companyName}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a; font-weight: 600;">${jobTitle}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap;">${c.fullName}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0284c7;"><a href="mailto:${c.email}" style="color: #0284c7; text-decoration: underline;">${c.email}</a></td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; white-space: nowrap; color: #0f172a; font-family: monospace;">${c.phone}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a;">${c.location || "Bengaluru"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; color: #0f172a;">${c.readyToRelocate || "Yes"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: 600; color: #0f172a;">${expText}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; color: #0f172a;">${relExpText}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a;">${c.designation || jobTitle}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a;">${c.qualification || "Graduate"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a;">${c.currentCompany || "Confidential"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a; white-space: nowrap;">${c.currentSalary || "Confidential"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a; white-space: nowrap;">${c.expectedSalary || "Negotiable"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a; white-space: nowrap;">${c.noticePeriod || "30 Days"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569; font-style: italic;">${c.reasonForLeaving || "Career growth"}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; color: #0f172a;">${c.offerInHand || "No"}</td>
      </tr>
    `;
  }).join("");

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 100%; margin: 0 auto; background-color: #ffffff; color: #0f172a; line-height: 1.5;">
      ${routing.bannerHtml}
      <p style="margin: 0 0 14px 0; font-size: 14px; color: #0f172a;">
        Hi <strong>${clientContactName || "Team"}</strong>,
      </p>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155;">
        Please have a look at the candidate tracker below and attached are the resumes for <strong>${jobTitle}</strong>.
      </p>

      <!-- 7-Day Interactive Action Portal CTA Box -->
      <div style="margin: 18px 0; padding: 14px 18px; background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>
              <strong style="color: #166534; font-size: 13px;">⚡ Interactive Shortlist Review Portal (Active for 7 Days)</strong>
              <p style="margin: 3px 0 0 0; color: #15803d; font-size: 11px;">
                Review full candidate summaries, evaluate CVs, and log 1-click decisions (Shortlist / Hold / Reject).
              </p>
            </td>
            <td style="text-align: right; vertical-align: middle; white-space: nowrap;">
              <a href="${shareableUrl}" style="background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 12px; padding: 8px 18px; border-radius: 6px; display: inline-block;">
                Open Review Portal &rarr;
              </a>
            </td>
          </tr>
        </table>
      </div>

      <!-- 19-Column Horizontal Tracker Table -->
      <div style="margin: 18px 0; overflow-x: auto; -webkit-overflow-scrolling: touch;">
        <table style="width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; border: 1px solid #002060;">
          <thead>
            <tr style="background-color: #002060; color: #ffffff;">
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Date</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Source</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Client Name</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Applied Position Name</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Candidate Name</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Email ID</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Number</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Location</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: center; font-weight: 700; white-space: nowrap;">Ready to Relocate</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: center; font-weight: 700; white-space: nowrap;">Experience</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: center; font-weight: 700; white-space: nowrap;">Relevant Exp</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Designation</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Qualification</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Current/ Last Company</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Current Salary</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Expectation</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Notice Period</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: left; font-weight: 700; white-space: nowrap;">Reason of Leaving</th>
              <th style="padding: 8px 10px; border: 1px solid #003399; text-align: center; font-weight: 700; white-space: nowrap;">Offer in Hand</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 13px; color: #475569;">
        Regards,<br />
        <strong style="color: #0f172a;">${agencyName}</strong><br />
        <span style="font-size: 11px; color: #94a3b8;">Talent Delivery & Executive Search Team</span>
      </p>
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Shortlist email logged for: ${routing.recipient}`);
      console.log(`   CC: ${routing.ccRecipients.join(", ") || "None"}`);
      console.log(`   Subject: ${routing.subject}`);
      console.log(`   Attached files: ${attachments.map((a) => a.filename).join(", ") || "None"}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Search Delivery" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: routing.recipient,
      cc: routing.ccRecipients.length > 0 ? routing.ccRecipients : undefined,
      subject: routing.subject,
      html: htmlContent,
      attachments: attachments.map((att) => {
        if (att.content) {
          return { filename: att.filename, content: att.content, contentType: att.contentType || "application/pdf" };
        }
        return { filename: att.filename, path: att.path, contentType: att.contentType || "application/pdf" };
      }),
    });

    console.log(`📧 Candidate shortlist email dispatched: ${info.messageId} to ${routing.recipient} with ${attachments.length} attachment(s).`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch candidate shortlist email:", error.message);
    return { success: false, error: error.message };
  }
}

export interface ClientShortlistReminderEmailProps {
  to: string;
  cc?: string[];
  clientContactName: string;
  companyName: string;
  jobTitle: string;
  agencyName: string;
  shareableUrl: string;
  candidatesCount: number;
  initialBatchCount?: number;
  lastEmailMessageId?: string | null;
  reminderLevel?: number; // 1 = 24h gentle, 2 = 48h SLA drop-off warning, 3 = manual/72h chase
  hoursElapsed?: number;
  sandboxContext?: EmailSandboxContext;
}

/**
 * Sends a threaded follow-up reminder to the client for unreviewed candidate shortlists.
 * Uses `inReplyTo` and `references` headers so the reminder threads directly into the original conversation.
 */
export async function sendClientShortlistReminderEmail({
  to,
  cc = [],
  clientContactName,
  companyName,
  jobTitle,
  agencyName,
  shareableUrl,
  candidatesCount,
  initialBatchCount,
  lastEmailMessageId,
  reminderLevel = 1,
  hoursElapsed,
  sandboxContext,
}: ClientShortlistReminderEmailProps) {
  const threadProfilesCount = initialBatchCount || candidatesCount;
  const rawSubject = `Re: Candidate Shortlist: ${jobTitle} — ${companyName} (${threadProfilesCount} Profiles)`;

  const routing = resolveEmailRouting({
    to,
    cc,
    subject: rawSubject,
    sandboxContext,
  });

  const isUrgent = reminderLevel >= 2;
  const badgeColor = isUrgent ? "#dc2626" : "#2563eb";
  const badgeText = isUrgent
    ? `⚡ SLA Follow-Up: 48h Window Elapsed (${hoursElapsed || 48}h)`
    : `Gentle Reminder: Candidates Awaiting Review`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #0f172a; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background-color: #ffffff;">
      ${routing.bannerHtml}
      <div style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
        <span style="display: inline-block; background-color: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${badgeText}
        </span>
        <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 10px 0 0 0;">
          Shortlist Review: ${jobTitle} — ${companyName}
        </h2>
      </div>

      <p style="margin: 0 0 14px 0; font-size: 13px; color: #334155;">
        Dear ${clientContactName || "Hiring Lead"},
      </p>

      ${
        isUrgent
          ? `<p style="margin: 0 0 14px 0; font-size: 13px; color: #334155;">
              This is a follow-up regarding the <strong>${candidatesCount} candidate profile(s)</strong> presented for your <strong>${jobTitle}</strong> position. Top candidates in this market receive competitive offers quickly, and we want to ensure your interview slots are locked in before profiles move off the market.
            </p>`
          : `<p style="margin: 0 0 14px 0; font-size: 13px; color: #334155;">
              Following up on the candidate shortlist presented below for your <strong>${jobTitle}</strong> opening. We have <strong>${candidatesCount} pre-screened candidate profile(s)</strong> awaiting your feedback on your temporary 7-day review portal.
            </p>`
      }

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #475569; font-weight: 600;">
          Review full screening telemetry, original resumes, and shortlist for interview in 1 click:
        </p>
        <a href="${shareableUrl}" style="display: inline-block; background-color: #002060; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,32,96,0.25);">
          👉 Open 7-Day Candidate Review Portal (${candidatesCount} Profiles)
        </a>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b;">
          Direct link: <a href="${shareableUrl}" style="color: #002060; text-decoration: underline;">${shareableUrl}</a>
        </p>
      </div>

      <p style="margin: 14px 0 0 0; font-size: 13px; color: #475569;">
        Please refer to the original email below in this thread for the full 19-column candidate tracker and attached resume files.
      </p>

      <p style="margin: 20px 0 0 0; font-size: 13px; color: #475569;">
        Warm regards,<br />
        <strong style="color: #0f172a;">${agencyName}</strong><br />
        <span style="font-size: 11px; color: #94a3b8;">Talent Delivery & Executive Search Team</span>
      </p>
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Reminder email logged for: ${routing.recipient}`);
      console.log(`   Thread in-reply-to: ${lastEmailMessageId || "None"}`);
      console.log(`   Subject: ${routing.subject}`);
      return { success: true, simulated: true };
    }

    const mailOptions: any = {
      from: `"${agencyName} Search Delivery" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: routing.recipient,
      cc: routing.ccRecipients.length > 0 ? routing.ccRecipients : undefined,
      subject: routing.subject,
      html: htmlContent,
    };

    if (lastEmailMessageId) {
      mailOptions.inReplyTo = lastEmailMessageId;
      mailOptions.references = [lastEmailMessageId];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Candidate shortlist reminder dispatched: ${info.messageId} (threaded to ${lastEmailMessageId || "root"}) to ${routing.recipient}.`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch candidate shortlist reminder email:", error.message);
    return { success: false, error: error.message };
  }
}

export interface ClientDecisionRecruiterEmailProps {
  to: string;
  recruiterName: string;
  candidateName: string;
  candidateId: string;
  jobTitle: string;
  companyName: string;
  agencyName: string;
  mandateId: string;
  decision: "SHORTLIST" | "REJECT" | "HOLD" | "QUESTION" | string;
  notes?: string | null;
  preferredInterviewTimes?: string | null;
  rejectionReason?: string | null;
}

/**
 * Sends an instant real-time notification email to the assigned recruiter and search lead
 * the moment a client takes an action (Shortlist, Reject, or Info Request) on the portal (CF-02).
 */
export async function sendClientDecisionRecruiterEmail({
  to,
  recruiterName,
  candidateName,
  candidateId,
  jobTitle,
  companyName,
  agencyName,
  mandateId,
  decision,
  notes,
  preferredInterviewTimes,
  rejectionReason,
}: ClientDecisionRecruiterEmailProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const recipient = isDev ? (process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in") : to;
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cockpitUrl = `${appUrl}/cockpit/mandates/${mandateId}`;

  const isShortlist = decision === "SHORTLIST";
  const isReject = decision === "REJECT";

  const badgeColor = isShortlist ? "#16a34a" : isReject ? "#dc2626" : "#d97706";
  const badgeBg = isShortlist ? "#f0fdf4" : isReject ? "#fef2f2" : "#fffbeb";
  const badgeBorder = isShortlist ? "#bbf7d0" : isReject ? "#fecaca" : "#fef3c7";
  const badgeText = isShortlist
    ? "SHORTLISTED FOR INTERVIEW"
    : isReject
    ? "REJECTED BY CLIENT"
    : "INQUIRY / ON HOLD";

  const subject = isShortlist
    ? `🎯 [Client Shortlist] ${companyName} shortlisted ${candidateName} for ${jobTitle}`
    : isReject
    ? `🛑 [Client Feedback] ${companyName} passed on ${candidateName} (${rejectionReason || "Feedback Provided"})`
    : `💬 [Client Inquiry] ${companyName} requested details for ${candidateName}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; padding: 24px; color: #1e293b;">
      
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Client Portal Telemetry</span>
          <h2 style="margin: 4px 0 0 0; font-size: 18px; color: #0f172a; font-weight: 800;">${companyName} — Decision Recorded</h2>
        </div>
        <div style="display: inline-block; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor}; font-weight: 800; font-size: 11px; padding: 6px 12px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${badgeText}
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 16px 0;">
        Hi <strong>${recruiterName || "Recruiter"}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #334155; margin: 0 0 20px 0;">
        <strong>${companyName}</strong> just reviewed candidate profile <strong>${candidateName}</strong> for the role of <strong>${jobTitle}</strong>.
      </p>

      <!-- Feedback Details Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">Candidate:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${candidateName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Role Mandate:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Decision:</td>
            <td style="padding: 6px 0;">
              <span style="display: inline-block; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor}; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 4px;">
                ${badgeText}
              </span>
            </td>
          </tr>

          ${
            isShortlist && preferredInterviewTimes
              ? `
              <tr>
                <td style="padding: 6px 0; color: #16a34a; font-weight: 700; vertical-align: top;">Interview Slots:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #15803d; background-color: #dcfce7; padding: 6px 10px; border-radius: 6px;">
                  🗓️ ${preferredInterviewTimes}
                </td>
              </tr>
              `
              : ""
          }

          ${
            isReject && rejectionReason
              ? `
              <tr>
                <td style="padding: 6px 0; color: #dc2626; font-weight: 700; vertical-align: top;">Rejection Reason:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #b91c1c;">
                  🛑 ${rejectionReason}
                </td>
              </tr>
              `
              : ""
          }

          ${
            notes
              ? `
              <tr>
                <td style="padding: 8px 0 6px 0; color: #64748b; font-weight: 600; vertical-align: top;">Client Notes:</td>
                <td style="padding: 8px 0 6px 0; color: #334155; font-style: italic;">
                  "${notes}"
                </td>
              </tr>
              `
              : ""
          }
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${cockpitUrl}" style="display: inline-block; background-color: #002060; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,32,96,0.25);">
          ${isShortlist ? "⚡ Open Mandate & Schedule Interview" : "🔍 Open Mandate Workspace"}
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
        RecruitOS Telemetry Engine &bull; Automated client activity tracking
      </p>

      ${
        isDev
          ? `<div style="margin-top: 20px; background-color: #fffbeb; padding: 8px 12px; border: 1px solid #fef3c7; border-radius: 6px; font-size: 11px; color: #92400e;">
              ⚙️ <strong>Dev Notice:</strong> Intended recruiter was <code>${to}</code>. Delivered to <code>${recipient}</code>.
            </div>`
          : ""
      }
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Client decision email logged for: ${recipient}`);
      console.log(`   Subject: ${subject}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Portal Telemetry" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      subject,
      html: htmlContent,
    });

    console.log(`📧 Client decision notification email dispatched: ${info.messageId} to ${recipient}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch client decision notification email:", error.message);
    return { success: false, error: error.message };
  }
}


