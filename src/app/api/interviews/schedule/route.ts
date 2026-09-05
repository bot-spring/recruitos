import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppInterviewBriefing } from "@/lib/whatsapp";
import { sendInterviewInvitationEmail } from "@/lib/email";
import { SubmissionStage, InterviewType, InterviewStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/interviews/schedule - Schedule interview & dispatch WhatsApp briefing + email (RC-04)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const body = await req.json();
    const {
      submissionId,
      scheduledAt,
      durationMinutes = 60,
      interviewType = "TECHNICAL_ROUND",
      meetingLink,
      location,
      panelistNames = [],
      panelistEmails = [],
      instructions,
      sendWhatsApp = true,
      sendEmail = true,
    } = body;

    if (!submissionId || !scheduledAt || !meetingLink) {
      return NextResponse.json(
        { error: "Submission ID, Scheduled Date/Time, and Meeting Link are required." },
        { status: 400 }
      );
    }

    // 1. Fetch submission with candidate and mandate details
    const submission = await prisma.candidateSubmission.findFirst({
      where: {
        id: submissionId,
        agencyId: session.user.agencyId,
      },
      include: {
        candidate: true,
        mandate: {
          include: {
            client: true,
            assignedRecruiter: true,
            agency: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Candidate submission not found in your agency." }, { status: 404 });
    }

    const scheduledDate = new Date(scheduledAt);
    const formattedDateString = scheduledDate.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    // 2. Create InterviewSchedule in Transaction
    const result = await prisma.$transaction(async (tx) => {
      const interview = await tx.interviewSchedule.create({
        data: {
          agencyId: submission.agencyId,
          submissionId: submission.id,
          mandateId: submission.mandateId,
          candidateId: submission.candidateId,
          scheduledAt: scheduledDate,
          durationMinutes: parseInt(String(durationMinutes), 10) || 60,
          interviewType: interviewType as InterviewType,
          status: InterviewStatus.SCHEDULED,
          meetingLink: meetingLink.trim(),
          location: location?.trim() || null,
          panelistNames: Array.isArray(panelistNames) ? panelistNames : [panelistNames].filter(Boolean),
          panelistEmails: Array.isArray(panelistEmails) ? panelistEmails : [panelistEmails].filter(Boolean),
          instructions: instructions?.trim() || null,
          emailInviteSentAt: sendEmail ? new Date() : null,
          whatsAppBriefingSentAt: sendWhatsApp ? new Date() : null,
        },
      });

      // Update submission stage to INTERVIEW_SCHEDULED
      await tx.candidateSubmission.update({
        where: { id: submission.id },
        data: {
          stage: SubmissionStage.INTERVIEW_SCHEDULED,
          updatedAt: new Date(),
        },
      });

      // Log Audit Event
      await tx.auditLog.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          action: "INTERVIEW_SCHEDULED",
          entity: "InterviewSchedule",
          entityId: interview.id,
          metadata: {
            candidateName: submission.candidate.fullName,
            candidatePhone: submission.candidate.phone,
            mandateTitle: submission.mandate.title,
            clientOrg: submission.mandate.client.name,
            scheduledAt: formattedDateString,
            meetingLink,
            interviewType,
          },
        },
      });

      return interview;
    });

    // 3. Dispatch Automated WhatsApp Briefing (RC-04)
    let whatsAppResult = null;
    if (sendWhatsApp && submission.candidate.phone) {
      try {
        whatsAppResult = await sendWhatsAppInterviewBriefing({
          candidateName: submission.candidate.fullName,
          candidatePhone: submission.candidate.phone,
          roleTitle: submission.mandate.title,
          clientOrgName: submission.mandate.client.name,
          scheduledAt: formattedDateString,
          durationMinutes: parseInt(String(durationMinutes), 10) || 60,
          interviewType,
          meetingLink: meetingLink.trim(),
          panelistNames: Array.isArray(panelistNames) ? panelistNames : [],
          agencyName: submission.mandate.agency.name,
          recruiterName: session.user.name || "Search Lead",
        });

        if (whatsAppResult?.messageId) {
          await prisma.interviewSchedule.update({
            where: { id: result.id },
            data: { whatsAppMessageId: whatsAppResult.messageId },
          });
        }
      } catch (waErr) {
        console.warn("WhatsApp dispatch error:", waErr);
      }
    }

    // 4. Dispatch Email Calendar Notification (Nodemailer diverted to ankur@botspring.in)
    if (sendEmail) {
      try {
        await sendInterviewInvitationEmail({
          to: submission.candidate.email,
          candidateName: submission.candidate.fullName,
          jobTitle: submission.mandate.title,
          companyName: submission.mandate.client.name,
          agencyName: submission.mandate.agency.name,
          scheduledAt: formattedDateString,
          durationMinutes: parseInt(String(durationMinutes), 10) || 60,
          interviewType,
          meetingLink: meetingLink.trim(),
          panelistNames: Array.isArray(panelistNames) ? panelistNames : [],
        });
      } catch (mailErr) {
        console.warn("Email dispatch error:", mailErr);
      }
    }

    return NextResponse.json(
      {
        message: `Interview scheduled for '${submission.candidate.fullName}' on ${formattedDateString}.`,
        interview: result,
        whatsApp: whatsAppResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error scheduling interview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule interview." },
      { status: 500 }
    );
  }
}
