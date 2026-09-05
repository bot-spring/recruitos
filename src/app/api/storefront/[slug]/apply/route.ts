import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromResume } from "@/lib/resume-parser";
import { parseResumeWithGemini, normalizePhoneNumber } from "@/lib/gemini";
import { SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/storefront/[slug]/apply - Public candidate application & resume dropzone (AS-04)
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const agency = await prisma.agency.findUnique({
      where: { slug: params.slug.toLowerCase().trim() },
    });

    if (!agency || !agency.isActive) {
      return NextResponse.json({ error: "Agency not found or inactive." }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mandateId = formData.get("mandateId") as string | null;
    const userFullName = formData.get("fullName") as string | null;
    const userEmail = formData.get("email") as string | null;
    const userPhone = formData.get("phone") as string | null;

    let parsedData: any = {};
    let rawResumeText = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      rawResumeText = await extractTextFromResume(buffer, file.name, file.type);
      if (rawResumeText && rawResumeText.trim().length > 10) {
        parsedData = await parseResumeWithGemini(rawResumeText, file.name);
      }
    }

    const sanitizeString = (str?: any): string | null => {
      if (typeof str !== "string") return null;
      const cleaned = str.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
      return cleaned.length > 0 ? cleaned : null;
    };

    const fullName = sanitizeString(userFullName) || sanitizeString(parsedData.fullName) || "Candidate Application";
    const email = (sanitizeString(userEmail)?.toLowerCase() || sanitizeString(parsedData.email)?.toLowerCase() || "").trim();
    const phone = sanitizeString(userPhone) || sanitizeString(parsedData.phone) || "+91-9876543210";
    const phoneNormalized = sanitizeString(normalizePhoneNumber(phone)) || phone.replace(/[^0-9]/g, "");
    const cleanRawResumeText = sanitizeString(rawResumeText);

    if (!email) {
      return NextResponse.json(
        { error: "Could not extract a valid email from the uploaded resume. Please enter your email." },
        { status: 400 }
      );
    }

    const cleanSkills = Array.isArray(parsedData.skills)
      ? (parsedData.skills.map((s: any) => sanitizeString(s)).filter(Boolean) as string[])
      : [];

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create candidate
      let candidate = await tx.candidate.findFirst({
        where: {
          agencyId: agency.id,
          OR: [{ email }, { phoneNormalized }],
        },
      });

      if (candidate) {
        candidate = await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            fullName,
            rawResumeText: cleanRawResumeText || candidate.rawResumeText,
            skills: cleanSkills.length > 0 ? cleanSkills : candidate.skills,
            summary: sanitizeString(parsedData.summary) || candidate.summary,
            qualification: sanitizeString(parsedData.qualification) || candidate.qualification,
            currentCompany: sanitizeString(parsedData.currentCompany) || candidate.currentCompany,
            currentTitle: sanitizeString(parsedData.currentTitle) || candidate.currentTitle,
            totalExpYears: parsedData.totalExpYears || candidate.totalExpYears,
          },
        });
      } else {
        candidate = await tx.candidate.create({
          data: {
            agencyId: agency.id,
            fullName,
            email,
            phone,
            phoneNormalized,
            currentCompany: sanitizeString(parsedData.currentCompany),
            currentTitle: sanitizeString(parsedData.currentTitle),
            totalExpYears: parsedData.totalExpYears || 0,
            currentCtc: parsedData.currentCtc || null,
            expectedCtc: parsedData.expectedCtc || null,
            noticePeriodDays: parsedData.noticePeriodDays || 30,
            location: sanitizeString(parsedData.location),
            qualification: sanitizeString(parsedData.qualification),
            skills: cleanSkills,
            summary: sanitizeString(parsedData.summary),
            rawResumeText: cleanRawResumeText,
            source: "STOREFRONT_APPLY",
          },
        });
      }

      // 2. If applying for specific mandate, link submission
      let submission = null;
      if (mandateId) {
        submission = await tx.candidateSubmission.upsert({
          where: {
            candidateId_mandateId: {
              candidateId: candidate.id,
              mandateId,
            },
          },
          update: {},
          create: {
            agencyId: agency.id,
            candidateId: candidate.id,
            mandateId,
            stage: SubmissionStage.PARSED_RAW,
          },
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          agencyId: agency.id,
          action: "CANDIDATE_SELF_APPLIED",
          entity: "Candidate",
          entityId: candidate.id,
          metadata: {
            candidateName: candidate.fullName,
            email: candidate.email,
            mandateId: mandateId || null,
          },
        },
      });

      return { candidate, submission };
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully.",
        candidate: {
          id: result.candidate.id,
          fullName: result.candidate.fullName,
          email: result.candidate.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Public candidate application error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit application" }, { status: 500 });
  }
}
