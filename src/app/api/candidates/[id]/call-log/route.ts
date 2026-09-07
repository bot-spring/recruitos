import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CallDisposition } from "@prisma/client";

export const dynamic = "force-dynamic";

// Helper to extract numbers from salary strings like "15 LPA", "1500000", "15.5L"
function parseSalaryNumber(val?: string | number | null): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return val;
  const clean = val.replace(/,/g, "").trim().toLowerCase();
  const match = clean.match(/([\d.]+)/);
  if (!match) return undefined;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return undefined;
  if (clean.includes("lpa") || clean.includes("lakh") || clean.includes("lac") || clean.endsWith("l") || num < 150) {
    return Math.round(num * 100000);
  }
  return Math.round(num);
}

// Helper to extract days from notice period strings like "30 Days", "60", "Serving Notice - 15 days"
function parseNoticeDays(val?: string | number | null): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return Math.round(val);
  const match = val.match(/\d+/);
  if (match) {
    const days = parseInt(match[0], 10);
    if (!isNaN(days)) return days;
  }
  return undefined;
}

// GET /api/candidates/[id]/call-log - Fetch candidate call history across all mandates and general pool
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const candidateId = params.id;

    const callLogs = await prisma.callLog.findMany({
      where: { candidateId, agencyId },
      include: {
        recruiter: { select: { id: true, name: true, email: true } },
        mandate: { select: { id: true, title: true, client: { select: { name: true } } } },
      },
      orderBy: { calledAt: "desc" },
    });

    return NextResponse.json({ callLogs });
  } catch (error: any) {
    console.error("Error fetching candidate call logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch candidate call logs" },
      { status: 500 }
    );
  }
}

// POST /api/candidates/[id]/call-log - Log Structured Recruiter Call Disposition & Screening from Candidate Bank
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const agencyId = session.user.agencyId;
    const candidateId = params.id;
    const body = await req.json();

    const {
      disposition,
      notes,
      callbackAt,
      mandateId,
      submissionId,
      readyToRelocate,
      relevantExpYears,
      currentSalary,
      expectedSalary,
      noticePeriod,
      reasonForLeaving,
      offerInHand,
    } = body;

    if (!disposition || typeof disposition !== "string" || disposition.trim() === "") {
      return NextResponse.json(
        { error: "Please select a valid call outcome disposition before saving." },
        { status: 400 }
      );
    }

    // Verify candidate exists in this agency
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, agencyId },
      include: {
        submissions: {
          include: {
            mandate: { select: { id: true, title: true, client: { select: { name: true } } } },
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate record not found." }, { status: 404 });
    }

    const callbackDate = callbackAt ? new Date(callbackAt) : null;
    const parsedRelExp = relevantExpYears !== undefined && relevantExpYears !== null && relevantExpYears !== ""
      ? parseFloat(String(relevantExpYears))
      : undefined;
    const parsedCurrentCtc = parseSalaryNumber(currentSalary);
    const parsedExpectedCtc = parseSalaryNumber(expectedSalary);
    const parsedNoticeDays = parseNoticeDays(noticePeriod);

    // Target submission if matching mandateId or explicitly provided
    let targetSubmissionId = submissionId || null;
    if (!targetSubmissionId && mandateId) {
      const match = candidate.submissions.find((s) => s.mandateId === mandateId);
      if (match) targetSubmissionId = match.id;
    } else if (!targetSubmissionId && candidate.submissions.length > 0) {
      targetSubmissionId = candidate.submissions[0].id;
    }

    // Execute in transaction: Create CallLog, Update Candidate, and optionally sync Submission
    const result = await prisma.$transaction(async (tx) => {
      const callLog = await tx.callLog.create({
        data: {
          agencyId,
          candidateId: candidate.id,
          mandateId: mandateId || (targetSubmissionId ? candidate.submissions.find(s => s.id === targetSubmissionId)?.mandateId : null),
          submissionId: targetSubmissionId || null,
          recruiterId: session.user.id,
          disposition: disposition as CallDisposition,
          notes: notes?.trim() || null,
          callbackAt: callbackDate,
          calledAt: new Date(),
        },
        include: {
          recruiter: { select: { id: true, name: true, email: true } },
          mandate: { select: { id: true, title: true, client: { select: { name: true } } } },
        },
      });

      // Update Candidate Profile with latest call outcomes and screening parameters
      const updatedCandidate = await tx.candidate.update({
        where: { id: candidate.id },
        data: {
          lastCallDisposition: disposition as CallDisposition,
          lastCallNotes: notes?.trim() || null,
          lastCallAt: new Date(),
          nextCallbackAt: disposition === "CONNECTED_CALLBACK" ? callbackDate : null,
          readyToRelocate: readyToRelocate !== undefined ? readyToRelocate : candidate.readyToRelocate,
          relevantExpYears: parsedRelExp !== undefined ? parsedRelExp : candidate.relevantExpYears,
          currentCtc: parsedCurrentCtc !== undefined ? parsedCurrentCtc : candidate.currentCtc,
          expectedCtc: parsedExpectedCtc !== undefined ? parsedExpectedCtc : candidate.expectedCtc,
          noticePeriodDays: parsedNoticeDays !== undefined ? parsedNoticeDays : candidate.noticePeriodDays,
          reasonForLeaving: reasonForLeaving !== undefined ? reasonForLeaving : candidate.reasonForLeaving,
          offerInHand: offerInHand !== undefined ? offerInHand : candidate.offerInHand,
          updatedAt: new Date(),
        },
      });

      // If there is an active submission, synchronize screening parameters there as well
      if (targetSubmissionId) {
        await tx.candidateSubmission.update({
          where: { id: targetSubmissionId },
          data: {
            lastCallDisposition: disposition as CallDisposition,
            lastCallNotes: notes?.trim() || null,
            lastCallAt: new Date(),
            nextCallbackAt: disposition === "CONNECTED_CALLBACK" ? callbackDate : null,
            readyToRelocate: readyToRelocate !== undefined ? readyToRelocate : undefined,
            relevantExpYears: parsedRelExp !== undefined ? parsedRelExp : undefined,
            currentSalary: currentSalary !== undefined ? String(currentSalary) : undefined,
            expectedSalary: expectedSalary !== undefined ? String(expectedSalary) : undefined,
            noticePeriod: noticePeriod !== undefined ? String(noticePeriod) : undefined,
            reasonForLeaving: reasonForLeaving !== undefined ? reasonForLeaving : undefined,
            offerInHand: offerInHand !== undefined ? offerInHand : undefined,
            updatedAt: new Date(),
          },
        });
      }

      // Log Audit Trail
      await tx.auditLog.create({
        data: {
          agencyId,
          userId: session.user.id,
          action: "RECRUITER_CALL_LOGGED",
          entity: "Candidate",
          entityId: candidate.id,
          metadata: {
            candidateName: candidate.fullName,
            disposition,
            mandateId: mandateId || null,
            notes: notes?.trim() || "",
            callbackAt: callbackDate ? callbackDate.toISOString() : null,
          },
        },
      });

      return { callLog, candidate: updatedCandidate };
    });

    return NextResponse.json({
      message: `Call outcome logged: '${disposition.replace(/_/g, " ")}' for ${candidate.fullName}.`,
      callLog: result.callLog,
      candidate: result.candidate,
    });
  } catch (error: any) {
    console.error("Error logging candidate call outcome:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log candidate call outcome" },
      { status: 500 }
    );
  }
}
