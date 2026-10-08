import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/gemini";
import { SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/candidates - Search and list agency candidates
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const silverOnly = searchParams.get("silver") === "true";
    const sortBy = searchParams.get("sort") || "createdAt_desc";

    const whereClause: any = {
      agencyId: session.user.agencyId,
    };

    if (silverOnly) {
      whereClause.isSilverMedalist = true;
    }

    if (query.trim()) {
      whereClause.OR = [
        { fullName: { contains: query.trim(), mode: "insensitive" } },
        { email: { contains: query.trim(), mode: "insensitive" } },
        { currentCompany: { contains: query.trim(), mode: "insensitive" } },
        { currentTitle: { contains: query.trim(), mode: "insensitive" } },
        { skills: { hasSome: [query.trim()] } },
      ];
    }

    let orderByClause: any = { createdAt: "desc" };
    if (sortBy === "updatedAt_desc") {
      orderByClause = { updatedAt: "desc" };
    } else if (sortBy === "createdAt_desc") {
      orderByClause = { createdAt: "desc" };
    } else if (sortBy === "exp_desc") {
      orderByClause = [{ totalExpYears: "desc" }, { createdAt: "desc" }];
    } else if (sortBy === "name_asc") {
      orderByClause = [{ fullName: "asc" }, { createdAt: "desc" }];
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        submissions: {
          include: {
            mandate: {
              select: {
                id: true,
                title: true,
                client: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        callLogs: {
          include: {
            recruiter: { select: { id: true, name: true, email: true } },
            mandate: { select: { id: true, title: true, client: { select: { name: true } } } },
          },
          orderBy: { calledAt: "desc" },
        },
      },
      orderBy: orderByClause,
    });

    return NextResponse.json({ candidates });
  } catch (error: any) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch candidates" }, { status: 500 });
  }
}

// POST /api/candidates - Create or Update candidate & optionally link to mandate
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      currentCompany,
      currentTitle,
      totalExpYears = 0,
      currentCtc,
      expectedCtc,
      currency = "INR",
      noticePeriodDays = 30,
      location,
      skills = [],
      summary,
      rawResumeText,
      resumeUrl,
      qualification,
      source = "DIRECT_UPLOAD",
      mandateId,
    } = body;

    // Helper to strip null bytes (\0 / \u0000) and control characters that crash PostgreSQL with 22021 error
    const sanitizeString = (str?: any): string | null => {
      if (typeof str !== "string") return null;
      const cleaned = str.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
      return cleaned.length > 0 ? cleaned : null;
    };

    const effectiveFullName = sanitizeString(fullName) || "Candidate";
    const rawEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const isFakeEmail = !rawEmail || rawEmail === "n/a" || !rawEmail.includes("@");
    const cleanEmail = isFakeEmail
      ? `cand_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@talent.recruitos.ai`
      : sanitizeString(rawEmail)!;

    const rawPhone = typeof phone === "string" ? phone : "";
    const digitsOnly = rawPhone.replace(/[^0-9]/g, "");
    const isFakePhone = !rawPhone || rawPhone === "N/A" || digitsOnly.length < 5;
    const cleanPhone = isFakePhone
      ? `+91-${Date.now().toString().slice(-10)}`
      : sanitizeString(rawPhone) || `+91-${Date.now().toString().slice(-10)}`;

    const phoneNormalized = isFakePhone
      ? `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      : sanitizeString(normalizePhoneNumber(cleanPhone)) || cleanPhone.replace(/[^0-9]/g, "");

    let skillsArray: string[] = [];
    if (Array.isArray(skills)) {
      skillsArray = skills
        .map((s) => (typeof s === "string" ? sanitizeString(s) : null))
        .filter((s): s is string => Boolean(s));
    } else if (typeof skills === "string") {
      skillsArray = skills
        .split(",")
        .map((s) => sanitizeString(s))
        .filter((s): s is string => Boolean(s));
    }

    const cleanCompany = sanitizeString(currentCompany);
    const cleanTitle = sanitizeString(currentTitle);
    const cleanLocation = sanitizeString(location);
    const cleanQualification = sanitizeString(qualification);
    const cleanSummary = sanitizeString(summary);
    const cleanRawResumeText = sanitizeString(rawResumeText);
    const cleanResumeUrl = sanitizeString(resumeUrl);
    const cleanCurrency = sanitizeString(currency)?.toUpperCase() || "INR";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if candidate already exists (skip deduplication check if generated fake email/phone)
      let candidate = null;
      if (!isFakeEmail || !isFakePhone) {
        candidate = await tx.candidate.findFirst({
          where: {
            agencyId: session.user.agencyId!,
            OR: [
              ...(!isFakeEmail ? [{ email: cleanEmail }] : []),
              ...(!isFakePhone ? [{ phoneNormalized }] : []),
            ],
          },
        });
      }

      let isNewCandidate = false;
      if (candidate) {
        isNewCandidate = false;
        candidate = await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            fullName: effectiveFullName,
            email: isFakeEmail ? candidate.email : cleanEmail,
            phone: isFakePhone ? candidate.phone : cleanPhone,
            phoneNormalized: isFakePhone ? candidate.phoneNormalized : phoneNormalized,
            currentCompany: cleanCompany || candidate.currentCompany,
            currentTitle: cleanTitle || candidate.currentTitle,
            totalExpYears: parseFloat(totalExpYears) || candidate.totalExpYears,
            currentCtc: currentCtc ? parseFloat(currentCtc) : candidate.currentCtc,
            expectedCtc: expectedCtc ? parseFloat(expectedCtc) : candidate.expectedCtc,
            currency: cleanCurrency,
            noticePeriodDays: parseInt(noticePeriodDays, 10) || candidate.noticePeriodDays,
            location: cleanLocation || candidate.location,
            qualification: cleanQualification || candidate.qualification,
            skills: skillsArray.length > 0 ? skillsArray : candidate.skills,
            summary: cleanSummary || candidate.summary,
            rawResumeText: cleanRawResumeText || candidate.rawResumeText,
            resumeUrl: cleanResumeUrl || candidate.resumeUrl,
          },
        });
      } else {
        isNewCandidate = true;
        candidate = await tx.candidate.create({
          data: {
            agencyId: session.user.agencyId!,
            fullName: effectiveFullName,
            email: cleanEmail,
            phone: cleanPhone,
            phoneNormalized: phoneNormalized || cleanPhone,
            currentCompany: cleanCompany,
            currentTitle: cleanTitle,
            totalExpYears: parseFloat(totalExpYears) || 0,
            currentCtc: currentCtc ? parseFloat(currentCtc) : null,
            expectedCtc: expectedCtc ? parseFloat(expectedCtc) : null,
            currency: cleanCurrency,
            noticePeriodDays: parseInt(noticePeriodDays, 10) || 30,
            location: cleanLocation,
            qualification: cleanQualification,
            skills: skillsArray,
            summary: cleanSummary,
            rawResumeText: cleanRawResumeText,
            resumeUrl: cleanResumeUrl,
            source,
          },
        });
      }

      // 2. If mandateId provided, link candidate to mandate
      let submission = null;
      let isNewSubmission = false;
      if (mandateId && mandateId.trim() !== "") {
        const existingSub = await tx.candidateSubmission.findUnique({
          where: {
            candidateId_mandateId: {
              candidateId: candidate.id,
              mandateId,
            },
          },
        });

        if (existingSub) {
          submission = existingSub;
          isNewSubmission = false;
        } else {
          submission = await tx.candidateSubmission.create({
            data: {
              agencyId: session.user.agencyId!,
              candidateId: candidate.id,
              mandateId,
              submittedByUserId: session.user.id,
              stage: SubmissionStage.PARSED_RAW,
            },
          });
          isNewSubmission = true;
        }
      }

      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          agencyId: session.user.agencyId!,
          userId: session.user.id,
          action: "CANDIDATE_INGESTED",
          entity: "Candidate",
          entityId: candidate.id,
          metadata: {
            candidateName: candidate.fullName,
            email: candidate.email,
            mandateId: mandateId || null,
            isNewSubmission,
          },
        },
      });

      return { candidate, submission, isNewCandidate, isNewSubmission };
    });

    return NextResponse.json(
      {
        message: "Candidate saved successfully.",
        candidate: result.candidate,
        submission: result.submission,
        isNewCandidate: result.isNewCandidate,
        isNewSubmission: result.isNewSubmission,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error saving candidate:", error);
    return NextResponse.json({ error: error.message || "Failed to save candidate" }, { status: 500 });
  }
}

