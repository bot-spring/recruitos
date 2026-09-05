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
    path: string;
    contentType?: string;
  }>;
}

/**
 * Sends candidate shortlist presentation email to Client Hiring Lead with 19 candidate fields,
 * interactive 48h SLA feedback link, and attached resume copies.
 */
export async function sendClientShortlistPresentationEmail({
  to,
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

  const candidateCardsHtml = candidates.map((c, idx) => `
    <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 800;">#${idx + 1}. ${c.fullName}</h3>
        <span style="font-size: 11px; background-color: #dbeafe; color: #1e40af; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${c.designation || jobTitle}</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #334155; line-height: 1.6;">
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600; width: 30%;">Applied Position:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #0f172a;">${jobTitle}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Client Organization:</td>
          <td style="padding: 4px 0;">${companyName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Contact Email & Phone:</td>
          <td style="padding: 4px 0;">${c.email} • ${c.phone}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Target Location:</td>
          <td style="padding: 4px 0;">${c.location} (Relocate: <strong>${c.readyToRelocate || "Yes"}</strong>)</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Total & Relevant Exp:</td>
          <td style="padding: 4px 0;">Total: <strong>${c.totalExpYears}y</strong> | Relevant: <strong>${c.relevantExpYears !== null ? c.relevantExpYears + 'y' : 'N/A'}</strong></td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Highest Qualification:</td>
          <td style="padding: 4px 0;">${c.qualification || "Graduate / Professional Degree"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Current / Last Company:</td>
          <td style="padding: 4px 0; font-weight: 600;">${c.currentCompany || "Confidential"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Compensation:</td>
          <td style="padding: 4px 0;">Current: <strong>${c.currentSalary || "Confidential"}</strong> | Expectation: <strong>${c.expectedSalary || "Negotiable"}</strong></td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Notice Period:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #0f172a;">${c.noticePeriod || "30 Days"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Offer in Hand:</td>
          <td style="padding: 4px 0;">${c.offerInHand || "No"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Reason for Leaving:</td>
          <td style="padding: 4px 0; font-style: italic;">${c.reasonForLeaving || "Exploring progressive career opportunities"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0; color: #64748b; font-weight: 600;">Sourcing Details:</td>
          <td style="padding: 4px 0; font-size: 11px; color: #64748b;">Source: ${c.source} • Ingested: ${new Date(c.dateOfSourcing).toLocaleDateString()}</td>
        </tr>
      </table>
    </div>
  `).join("");

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${agencyName}</h1>
        <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
          Verified Candidate Shortlist Presentation
        </p>
      </div>

      <div style="padding: 28px 24px;">
        <p style="margin: 0 0 14px 0; font-size: 15px; color: #0f172a;">
          Dear <strong>${clientContactName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
          We are pleased to present our pre-screened candidate shortlist for the <strong>${jobTitle}</strong> search mandate at <strong>${companyName}</strong>.
          Attached are the full original resumes and comprehensive recruiter screening telemetry.
        </p>

        <!-- 48h Action CTA Banner -->
        <div style="background-color: #e0e7ff; border: 2px solid #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800; color: #312e81;">
            ⚡ ${feedbackSlaHours}-Hour Fast-Track Review Portal Active
          </h2>
          <p style="margin: 0 0 16px 0; font-size: 12px; color: #4338ca;">
            Review profiles, listen to screening summaries, and schedule interviews with 1-click zero-login access.
          </p>
          <a href="${shareableUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79,70,229,0.3);">
            Open Interactive Review Portal &rarr;
          </a>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #6366f1;">
            Link: <a href="${shareableUrl}" style="color: #4f46e5;">${shareableUrl}</a>
          </p>
        </div>

        <!-- Candidate Dossiers List -->
        <h2 style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          Candidate Screening Dossiers (${candidates.length})
        </h2>
        ${candidateCardsHtml}

        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.6;">
          Warm regards,<br />
          <strong>Executive Search Advisory at ${agencyName}</strong><br />
          <span style="font-size: 11px; color: #94a3b8;">Powered by RecruitOS Digital Operating System</span>
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
      console.log(`ℹ️ [Email Simulation] GMAIL_SMTP_PASS not set. Shortlist email logged for: ${recipient}`);
      console.log(`   Subject: Candidate Shortlist: ${jobTitle} — ${companyName} (${candidates.length} profiles)`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"${agencyName} Search Delivery" <${process.env.GMAIL_SMTP_USER || "ankur@botspring.in"}>`,
      to: recipient,
      subject: `Candidate Shortlist: ${jobTitle} — ${companyName} (${candidates.length} Verified Profiles)`,
      html: htmlContent,
      attachments: attachments.filter((att) => (att.path && att.path.startsWith("http")) || fs.existsSync(att.path)),
    });

    console.log(`📧 Candidate shortlist email dispatched: ${info.messageId} to ${recipient} with ${attachments.length} attachment(s).`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("⚠️ Failed to dispatch candidate shortlist email:", error.message);
    return { success: false, error: error.message };
  }
}

