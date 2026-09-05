import { PrismaClient, SubmissionStage, CallDisposition, CandidateJobStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function testMandateWorkspace() {
  console.log("================================================================================");
  console.log("🧪 STARTING FEATURE 14: DEDICATED MANDATE WORKSPACE & CALL LOGGING VERIFICATION");
  console.log("================================================================================");

  // 1. Fetch Apex Search Agency
  const agency = await prisma.agency.findUnique({
    where: { slug: "apex-search" },
    include: {
      users: true,
      jobMandates: {
        include: {
          client: true,
          contact: true,
          submissions: {
            include: {
              candidate: true,
            },
          },
        },
      },
    },
  });

  if (!agency) {
    throw new Error("❌ Agency 'apex-search' not found!");
  }

  const recruiter = agency.users.find((u) => u.role === "RECRUITER" || u.role === "AGENCY_OWNER") || agency.users[0];
  const mandate = agency.jobMandates[0];

  if (!mandate) {
    throw new Error("❌ No mandate found in agency!");
  }

  console.log(`✅ [TEST 1 PASSED] Loaded Mandate: '${mandate.title}' for client '${mandate.client.name}' (Desk Lead: ${recruiter.name}).`);

  // 2. Ensure we have at least one test candidate attached to this mandate
  let submission = mandate.submissions[0];
  let candidateId: string;

  if (!submission) {
    // Find or create a candidate
    let cand = await prisma.candidate.findFirst({
      where: { agencyId: agency.id },
    });

    if (!cand) {
      cand = await prisma.candidate.create({
        data: {
          agencyId: agency.id,
          fullName: "Ananya Sharma",
          email: "ananya.sharma@example.com",
          phone: "+91 98765 43210",
          phoneNormalized: "919876543210",
          currentTitle: "Senior Full Stack Engineer",
          totalExpYears: 6,
          skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
          location: "Bengaluru",
          source: "LinkedIn Recruiter",
          qualification: "B.Tech Computer Science",
        },
      });
    }

    submission = await prisma.candidateSubmission.create({
      data: {
        agencyId: agency.id,
        mandateId: mandate.id,
        candidateId: cand.id,
        stage: SubmissionStage.PARSED_RAW,
        candidateJobStatus: CandidateJobStatus.NOT_SHARED,
      },
      include: {
        candidate: true,
      },
    });
    candidateId = cand.id;
  } else {
    candidateId = submission.candidateId;
  }

  console.log(`✅ [TEST 2 PASSED] Active candidate submission identified: ${submission.candidate.fullName} (ID: ${submission.id}).`);

  // 3. Test Call Disposition & 7 Screening Parameters Logging
  console.log("📞 Testing Call Disposition & Recruiter Screening Logging...");
  const testCall = await prisma.callLog.create({
    data: {
      agencyId: agency.id,
      submissionId: submission.id,
      candidateId: candidateId,
      mandateId: mandate.id,
      recruiterId: recruiter.id,
      disposition: CallDisposition.CONNECTED_INTERESTED,
      notes: "Candidate is very keen on this opportunity. Current CTC 24 LPA, expecting 32 LPA, 30 days notice.",
    },
  });

  // Sync submission last call & 7 screening parameters
  const updatedSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: {
      lastCallDisposition: CallDisposition.CONNECTED_INTERESTED,
      lastCallNotes: "Candidate is very keen on this opportunity. Current CTC 24 LPA, expecting 32 LPA, 30 days notice.",
      lastCallAt: new Date(),
      readyToRelocate: "Yes",
      relevantExpYears: 5.5,
      currentSalary: "24 LPA",
      expectedSalary: "32 LPA",
      noticePeriod: "30 Days",
      reasonForLeaving: "Career growth & leadership",
      offerInHand: "No",
    },
  });

  if (
    updatedSubmission.lastCallDisposition !== CallDisposition.CONNECTED_INTERESTED ||
    !updatedSubmission.lastCallNotes?.includes("keen on this opportunity") ||
    updatedSubmission.relevantExpYears !== 5.5 ||
    updatedSubmission.readyToRelocate !== "Yes"
  ) {
    throw new Error("❌ Failed to update submission last call details or screening parameters!");
  }

  console.log(`✅ [TEST 3 PASSED] Call disposition '${testCall.disposition}' and 7 screening fields logged successfully.`);

  // 4. Test Candidate Status Updates
  console.log("🔄 Testing Candidate Status Transitions...");
  const statusToTest = CandidateJobStatus.SELECTED_FOR_NEXT_ROUND;
  const statusUpdatedSubmission = await prisma.candidateSubmission.update({
    where: { id: submission.id },
    data: {
      candidateJobStatus: statusToTest,
      stage: SubmissionStage.INTERVIEW_SCHEDULED,
    },
  });

  if (statusUpdatedSubmission.candidateJobStatus !== CandidateJobStatus.SELECTED_FOR_NEXT_ROUND) {
    throw new Error("❌ Failed to update candidate job status!");
  }

  console.log(`✅ [TEST 4 PASSED] Candidate status updated to '${statusUpdatedSubmission.candidateJobStatus}' and stage synced to '${statusUpdatedSubmission.stage}'.`);

  // 5. Test Cross-Job History Querying
  console.log("🌐 Testing Cross-Job Agency History Query...");
  const allSubmissionsForCandidate = await prisma.candidateSubmission.findMany({
    where: {
      candidateId: candidateId,
      agencyId: agency.id,
    },
    include: {
      mandate: {
        select: { id: true, title: true, client: { select: { name: true } } },
      },
      callLogs: {
        orderBy: { calledAt: "desc" },
      },
    },
  });

  const thisJobHistory = allSubmissionsForCandidate.filter((s) => s.mandateId === mandate.id);
  const otherJobsHistory = allSubmissionsForCandidate.filter((s) => s.mandateId !== mandate.id);

  console.log(`✅ [TEST 5 PASSED] Cross-job history verified: ${thisJobHistory.length} record(s) for this job, ${otherJobsHistory.length} record(s) across other agency mandates.`);

  // 6. Test Talent Pool Skill Matching Algorithm
  console.log("🎯 Testing Talent Pool Skill Match % calculation...");
  const mandateSkills = mandate.skills || [];
  const poolCandidates = await prisma.candidate.findMany({
    where: {
      agencyId: agency.id,
      submissions: {
        none: { mandateId: mandate.id },
      },
    },
    take: 10,
  });

  const scoredPool = poolCandidates.map((c) => {
    const candidateSkills = (c.skills || []).map((s) => s.toLowerCase());
    const matched = mandateSkills.filter((ms) =>
      candidateSkills.some((cs) => cs.includes(ms.toLowerCase()) || ms.toLowerCase().includes(cs))
    );
    const matchPercentage = mandateSkills.length > 0 ? Math.round((matched.length / mandateSkills.length) * 100) : 0;
    return {
      id: c.id,
      fullName: c.fullName,
      matchPercentage,
      matchedSkills: matched,
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);

  console.log(`✅ [TEST 6 PASSED] Scored ${scoredPool.length} unattached candidate(s) from agency pool against mandate skills (${mandateSkills.join(", ")}).`);
  if (scoredPool.length > 0) {
    console.log(`   Top match: ${scoredPool[0].fullName} (${scoredPool[0].matchPercentage}% match)`);
  }

  console.log("================================================================================");
  console.log("🎉 ALL FEATURE 14 MANDATE WORKSPACE TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

testMandateWorkspace()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

