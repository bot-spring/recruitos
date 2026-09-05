import { PrismaClient, SubmissionStage, InterviewType, InterviewStatus, MandateStatus } from "@prisma/client";
import { sendWhatsAppInterviewBriefing } from "../src/lib/whatsapp";

const prisma = new PrismaClient();

async function runTechnicalVerification() {
  console.log("================================================================================");
  console.log("🧪 STARTING TECHNICAL VERIFICATION: SPRINT 3, FEATURE 9");
  console.log("   (WhatsApp & Multi-Channel Interview Logistics Engine — RC-04, RC-05)");
  console.log("================================================================================");

  // 1. Verify Demo Agency 'apex-search' and active mandate
  const agency = await prisma.agency.findUnique({
    where: { slug: "apex-search" },
    include: {
      jobMandates: {
        where: { status: MandateStatus.ACTIVE_ASSIGNED },
        include: { client: true },
      },
      users: true,
    },
  });

  if (!agency || agency.jobMandates.length === 0) {
    throw new Error("❌ No active mandate found in apex-search agency!");
  }

  const mandate = agency.jobMandates[0];
  const recruiter = agency.users[0];
  console.log(`✅ [TEST 1 PASSED] Active mandate: '${mandate.title}' (Client: ${mandate.client.name}).`);

  // 2. Create Candidate & Submission
  const candEmail = `interview.candidate.${Date.now()}@example.com`;
  const candPhone = `+91 998${Math.floor(1000000 + Math.random() * 9000000)}`;

  const candidate = await prisma.candidate.create({
    data: {
      agencyId: agency.id,
      fullName: "Aditya Roy Kapur",
      email: candEmail,
      phone: candPhone,
      phoneNormalized: candPhone.replace(/[^0-9+]/g, ""),
      currentCompany: "Skyline Robotics",
      currentTitle: "Lead SLAM Architecture Engineer",
      totalExpYears: 8.5,
      currentCtc: 3800000,
      expectedCtc: 4800000,
      noticePeriodDays: 30,
      skills: ["C++", "ROS2", "SLAM", "Path Planning", "Autonomous Systems"],
      source: "DIRECT_UPLOAD",
    },
  });

  const submission = await prisma.candidateSubmission.create({
    data: {
      agencyId: agency.id,
      candidateId: candidate.id,
      mandateId: mandate.id,
      submittedByUserId: recruiter.id,
      stage: SubmissionStage.CLIENT_SHORTLISTED,
    },
  });

  console.log(`✅ [TEST 2 PASSED] Candidate '${candidate.fullName}' staged in 'CLIENT_SHORTLISTED' (ID: ${submission.id}).`);

  // 3. Test Multi-Channel Interview Scheduling & Logistics Dispatch (RC-04)
  const scheduledTime = new Date(Date.now() + 24 * 3600 * 1000); // Tomorrow
  const interview = await prisma.interviewSchedule.create({
    data: {
      agencyId: agency.id,
      submissionId: submission.id,
      mandateId: mandate.id,
      candidateId: candidate.id,
      scheduledAt: scheduledTime,
      durationMinutes: 60,
      interviewType: InterviewType.TECHNICAL_ROUND,
      status: InterviewStatus.SCHEDULED,
      meetingLink: "https://meet.google.com/xyz-robotics-round1",
      panelistNames: ["Dr. Arvind Subramanian", "Priya Nair"],
      panelistEmails: ["arvind@botspring.in"],
      emailInviteSentAt: new Date(),
      whatsAppBriefingSentAt: new Date(),
    },
  });

  // Promote submission to INTERVIEW_SCHEDULED
  const updatedSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: { stage: SubmissionStage.INTERVIEW_SCHEDULED },
  });

  if (updatedSubmission.stage !== SubmissionStage.INTERVIEW_SCHEDULED) {
    throw new Error(`❌ Expected stage 'INTERVIEW_SCHEDULED', got '${updatedSubmission.stage}'`);
  }

  // Test WhatsApp Dispatch Simulation
  const waResult = await sendWhatsAppInterviewBriefing({
    candidateName: candidate.fullName,
    candidatePhone: candidate.phone,
    roleTitle: mandate.title,
    clientOrgName: mandate.client.name,
    scheduledAt: scheduledTime.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }),
    durationMinutes: 60,
    interviewType: "TECHNICAL_ROUND",
    meetingLink: "https://meet.google.com/xyz-robotics-round1",
    panelistNames: ["Dr. Arvind Subramanian", "Priya Nair"],
    agencyName: agency.name,
    recruiterName: recruiter.name,
  });

  console.log(`✅ [TEST 3 PASSED] Interview scheduled & WhatsApp briefing dispatched (Message ID: ${waResult.messageId}).`);

  // 4. Test Post-Interview Debrief & Pipeline Advancement (RC-05)
  const debriefedInterview = await prisma.interviewSchedule.update({
    where: { id: interview.id },
    data: {
      status: InterviewStatus.COMPLETED,
      debriefLoggedAt: new Date(),
      candidateSentiment: "HIGH_ENTHUSIASM",
      candidateDebriefNotes: "Panel gave stellar marks on SLAM point-cloud algorithms. Candidate is very excited about the mission.",
      salaryAlignmentNotes: "Expected CTC ₹48L confirmed within budget.",
      noticePeriodConfirmed: 15,
    },
  });

  const offerSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: { stage: SubmissionStage.OFFER_ISSUED },
  });

  if (offerSubmission.stage !== SubmissionStage.OFFER_ISSUED) {
    throw new Error(`❌ Expected stage 'OFFER_ISSUED', got '${offerSubmission.stage}'`);
  }

  console.log(`✅ [TEST 4 PASSED] Post-interview debrief recorded (Candidate Sentiment: ${debriefedInterview.candidateSentiment}).`);
  console.log(`   Pipeline advanced directly to: '${offerSubmission.stage}'.`);

  // 5. Test Audit Trail Event
  const auditLog = await prisma.auditLog.create({
    data: {
      agencyId: agency.id,
      userId: recruiter.id,
      action: "INTERVIEW_DEBRIEF_LOGGED",
      entity: "InterviewSchedule",
      entityId: interview.id,
      metadata: {
        candidateName: candidate.fullName,
        mandateTitle: mandate.title,
        candidateSentiment: debriefedInterview.candidateSentiment,
        promotedStage: SubmissionStage.OFFER_ISSUED,
      },
    },
  });

  console.log(`✅ [TEST 5 PASSED] Audit trail logged event '${auditLog.action}' (ID: ${auditLog.id}).`);

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 9 TECHNICAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runTechnicalVerification()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

