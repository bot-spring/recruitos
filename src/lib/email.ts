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

export interface MandateIntakeEmailProps {
  to: string;
  clientContactName: string;
  companyName: string;
  jobTitle: string;
  agencyName: string;
  mandateId: string;
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
}: MandateIntakeEmailProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const recipient = isDev ? (process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in") : to;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
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

      ${
        isDev
          ? `<div style="background-color: #fffbeb; padding: 12px; border-top: 1px solid #fef3c7; font-size: 11px; color: #92400e; text-align: center;">
              ⚙️ <strong>Development Mode:</strong> Original intended recipient was <code>${to}</code> (Dispatched/logged to <code>${recipient}</code>).
            </div>`
          : ""
      }
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Email logged for: ${recipient}`);
      console.log(`   Subject: Mandate Received: ${jobTitle} at ${companyName}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} via RecruitOS" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      subject: `Mandate Received: ${jobTitle} — ${agencyName}`,
      html: htmlContent,
    });

    console.log(`📧 Intake confirmation email dispatched: ${info.messageId} to ${recipient}`);
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
}: ClientOnboardingEmailProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const recipient = isDev ? (process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in") : to;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #d3dbed; padding: 24px; text-align: center; border-bottom: 1px solid #cbd5e1;">
        <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${agencyName}</h1>
        <p style="margin: 4px 0 0 0; color: #166534; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">✓ Search Mandate Activated & Onboarded</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
          Dear <strong>${clientContactName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          We are pleased to inform you that your hiring mandate for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been officially approved and activated in our dedicated delivery pipeline.
        </p>

        <!-- Terms & SLAs Grid -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Commercial Terms:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${feePercentage}% of Annual CTC</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Replacement Guarantee:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${guaranteeDays} Calendar Days ($0 Replacement)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Sourcing SLA Clock:</td>
              <td style="padding: 6px 0; color: #166534; font-weight: 700;">${slaHours} Hours Initial Shortlist Target</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Dedicated Desk Lead:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${recruiterName} (${recruiterEmail})</td>
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

      ${
        isDev
          ? `<div style="background-color: #fffbeb; padding: 12px; border-top: 1px solid #fef3c7; font-size: 11px; color: #92400e; text-align: center;">
              ⚙️ <strong>Development Mode:</strong> Original intended recipient was <code>${to}</code> (Dispatched/logged to <code>${recipient}</code>).
            </div>`
          : ""
      }
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Onboarding kickoff email logged for: ${recipient}`);
      console.log(`   Subject: Search Mandate Activated: ${jobTitle} — ${agencyName}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Executive Search" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      subject: `Search Mandate Activated: ${jobTitle} — ${agencyName}`,
      html: htmlContent,
    });

    console.log(`📧 Onboarding email dispatched: ${info.messageId} to ${recipient}`);
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
}: InterviewInviteEmailProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const recipient = isDev ? (process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in") : to;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
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

        <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.6;">
          Please join 5 minutes prior to the scheduled start time with a stable internet connection and webcam enabled.
        </p>

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b;">
          Best of luck,<br />
          <strong>${agencyName} Talent Advisory</strong>
        </p>
      </div>

      ${
        isDev
          ? `<div style="background-color: #fffbeb; padding: 12px; border-top: 1px solid #fef3c7; font-size: 11px; color: #92400e; text-align: center;">
              ⚙️ <strong>Development Mode:</strong> Original intended recipient was <code>${to}</code> (Dispatched/logged to <code>${recipient}</code>).
            </div>`
          : ""
      }
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Interview invite logged for: ${recipient}`);
      console.log(`   Subject: Interview Invitation: ${jobTitle} with ${companyName}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Talent Advisory" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      subject: `Interview Invitation: ${jobTitle} with ${companyName}`,
      html: htmlContent,
    });

    console.log(`📧 Interview invite email dispatched: ${info.messageId} to ${recipient}`);
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
}: PlacementInvoiceEmailProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const recipient = isDev ? (process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in") : to;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #d3dbed; padding: 24px; text-align: center; border-bottom: 1px solid #cbd5e1;">
        <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">${agencyName}</h1>
        <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Placement Commercial Tax Invoice</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
          Dear Accounts Team at <strong>${companyName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          Please find attached the placement commercial tax invoice for <strong>${candidateName}</strong> who successfully joined as <strong>${jobTitle}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Invoice Reference:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Base Professional Fee:</td>
              <td style="padding: 6px 0; color: #0f172a;">${currency} ${baseFeeAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">GST / Tax (18%):</td>
              <td style="padding: 6px 0; color: #0f172a;">${currency} ${taxAmount.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 8px 0; color: #0f172a; font-weight: 800;">Total Payable:</td>
              <td style="padding: 8px 0; color: #166534; font-weight: 900; font-size: 15px;">${currency} ${totalInvoiceAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Due Date:</td>
              <td style="padding: 6px 0; color: #b45309; font-weight: 700;">${dueDate}</td>
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

      ${
        isDev
          ? `<div style="background-color: #fffbeb; padding: 12px; border-top: 1px solid #fef3c7; font-size: 11px; color: #92400e; text-align: center;">
              ⚙️ <strong>Development Mode:</strong> Original intended recipient was <code>${to}</code> (Dispatched/logged to <code>${recipient}</code>).
            </div>`
          : ""
      }
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Invoice email logged for: ${recipient}`);
      console.log(`   Subject: Invoice ${invoiceNumber}: ${jobTitle} Placement — ${agencyName}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Billing" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      subject: `Invoice ${invoiceNumber}: ${candidateName} (${jobTitle}) — ${agencyName}`,
      html: htmlContent,
    });

    console.log(`📧 Placement invoice email dispatched: ${info.messageId} to ${recipient}`);
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
}: ClientShortlistPresentationEmailProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const recipient = isDev ? (process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in") : to;
  const ccRecipients = isDev ? [] : cc;

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

      ${
        isDev
          ? `<div style="margin-top: 24px; background-color: #fffbeb; padding: 10px 14px; border: 1px solid #fef3c7; border-radius: 6px; font-size: 11px; color: #92400e;">
              ⚙️ <strong>Development Mode Notice:</strong> Intended recipient was <code>${to}</code> (CC: <code>${cc.join(", ") || "None"}</code>). Delivered to <code>${recipient}</code> for review.
            </div>`
          : ""
      }
    </div>
  `;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Shortlist email logged for: ${recipient}`);
      console.log(`   CC: ${ccRecipients.join(", ") || "None"}`);
      console.log(`   Subject: Candidate Shortlist: ${jobTitle} — ${companyName} (${candidates.length} profiles)`);
      console.log(`   Attached files: ${attachments.map((a) => a.filename).join(", ") || "None"}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Search Delivery" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      cc: ccRecipients.length > 0 ? ccRecipients : undefined,
      subject: `Candidate Shortlist: ${jobTitle} — ${companyName} (${candidates.length} Profiles)`,
      html: htmlContent,
      attachments: attachments.map((att) => {
        if (att.content) {
          return { filename: att.filename, content: att.content, contentType: att.contentType || "application/pdf" };
        }
        return { filename: att.filename, path: att.path, contentType: att.contentType || "application/pdf" };
      }),
    });

    console.log(`📧 Candidate shortlist email dispatched: ${info.messageId} to ${recipient} with ${attachments.length} attachment(s).`);
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
}: ClientShortlistReminderEmailProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const recipient = isDev ? (process.env.DEV_OVERRIDE_EMAIL || "ankur@botspring.in") : to;
  // In dev mode, deliver to recipient once (avoid sending duplicate to CC)
  // In prod mode, ensure recipient is excluded from CC to avoid duplicate delivery
  const ccRecipients = isDev
    ? []
    : cc.filter((c) => c && c.toLowerCase() !== recipient.toLowerCase());

  const isUrgent = reminderLevel >= 2;
  const badgeColor = isUrgent ? "#dc2626" : "#2563eb";
  const badgeText = isUrgent
    ? `⚡ SLA Follow-Up: 48h Window Elapsed (${hoursElapsed || 48}h)`
    : `Gentle Reminder: Candidates Awaiting Review`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #0f172a; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background-color: #ffffff;">
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

      ${
        isDev
          ? `<div style="margin-top: 24px; background-color: #fffbeb; padding: 10px 14px; border: 1px solid #fef3c7; border-radius: 6px; font-size: 11px; color: #92400e;">
              ⚙️ <strong>Development Mode Notice:</strong> Intended recipient was <code>${to}</code> (CC: <code>${cc.join(", ") || "None"}</code>). Delivered to <code>${recipient}</code> for review.
            </div>`
          : ""
      }
    </div>
  `;

  const threadProfilesCount = initialBatchCount || candidatesCount;

  try {
    if (!process.env.GMAIL_SMTP_PASS) {
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Reminder email logged for: ${recipient}`);
      console.log(`   Thread in-reply-to: ${lastEmailMessageId || "None"}`);
      console.log(`   Subject: Re: Candidate Shortlist: ${jobTitle} — ${companyName} (${threadProfilesCount} Profiles)`);
      return { success: true, simulated: true };
    }

    const mailOptions: any = {
      from: `"${agencyName} Search Delivery" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      cc: ccRecipients.length > 0 ? ccRecipients : undefined,
      subject: `Re: Candidate Shortlist: ${jobTitle} — ${companyName} (${threadProfilesCount} Profiles)`,
      html: htmlContent,
    };

    if (lastEmailMessageId) {
      mailOptions.inReplyTo = lastEmailMessageId;
      mailOptions.references = [lastEmailMessageId];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Candidate shortlist reminder dispatched: ${info.messageId} (threaded to ${lastEmailMessageId || "root"}) to ${recipient}.`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch candidate shortlist reminder email:", error.message);
    return { success: false, error: error.message };
  }
}

