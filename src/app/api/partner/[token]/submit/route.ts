import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromResume } from "@/lib/resume-parser";
import { parseResumeWithGemini, normalizePhoneNumber } from "@/lib/gemini";
import { SubmissionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/partner/[token]/submit - Submit candidate from partner sourcer portal (PO-02)
export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token;

    // 1. Validate Partner Share Link
    const partnerShare = await prisma.partnerShare.findUnique({
      where: { shareToken: token },
      include: {
        agency: true,
        mandate: true,
      },
    });

    if (!partnerShare || !partnerShare.isActive || !partnerShare.agency.isActive) {
      return NextResponse.json(
        { error: "Partner mandate link is invalid, expired, or deactivated." },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const partnerName = formData.get("partnerName") as string | null;
    const partnerEmail = formData.get("partnerEmail") as string | null;
    const partnerPhone = formData.get("partnerPhone") as string | null;
    const partnerAgency = formData.get("partnerAgency") as string | null;

    if (!partnerName || !partnerEmail || !file) {
      return NextResponse.json(
        { error: "Partner Name, Partner Email, and Candidate Resume file are required." },
        { status: 400 }
      );
    }

    const cleanPartnerEmail = partnerEmail.toLowerCase().trim();

    // 2. Extract & Parse Resume
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawResumeText = await extractTextFromResume(buffer, file.name, file.type);
    if (!rawResumeText || rawResumeText.trim().length < 10) {
      return NextResponse.json(
        { error: "Uploaded resume appears unreadable or empty." },
        { status: 422 }
      );
    }

    const parsed = await parseResumeWithGemini(rawResumeText, file.name);

    if (!parsed.email && !parsed.phoneNormalized) {
      return NextResponse.json(
        { error: "Could not extract candidate contact info (email/phone) from resume." },
        { status: 400 }
      );
    }

    const sanitizeString = (str?: any): string | null => {
      if (typeof str !== "string") return null;
      const cleaned = str.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
      return cleaned.length > 0 ? cleaned : null;
    };

    const cleanFullName = sanitizeString(parsed.fullName) || "Candidate Submission";
    const cleanRawResumeText = sanitizeString(rawResumeText);
    const candidateEmail = (sanitizeString(parsed.email)?.toLowerCase() || `candidate_${Date.now()}@splitnetwork.com`).trim();
    const candidatePhone = sanitizeString(parsed.phone) || "+91-9876543210";
    const phoneNormalized = sanitizeString(parsed.phoneNormalized) || sanitizeString(normalizePhoneNumber(candidatePhone)) || candidatePhone.replace(/[^0-9]/g, "");

    const cleanSkills = Array.isArray(parsed.skills)
      ? (parsed.skills.map((s: any) => sanitizeString(s)).filter(Boolean) as string[])
      : [];

    // Calculate Estimated Split Payout for Partner (PO-01, PO-02)
    const agencyFeePct = partnerShare.mandate.feePercentage; // e.g. 8.33%
    const splitPct = partnerShare.splitFeePercentage;        // e.g. 50%
    const effectivePartnerPct = (agencyFeePct * splitPct) / 100;

    let splitPayoutEstimated = null;
    if (parsed.expectedCtc) {
      splitPayoutEstimated = Math.round(parsed.expectedCtc * (effectivePartnerPct / 100));
    } else if (partnerShare.mandate.maxCtc) {
      splitPayoutEstimated = Math.round(partnerShare.mandate.maxCtc * (effectivePartnerPct / 100));
    }

    const result = await prisma.$transaction(async (tx) => {
      // 3. Check for Duplicate Candidate in Agency
      let candidate = await tx.candidate.findFirst({
        where: {
          agencyId: partnerShare.agencyId,
          OR: [
            { email: candidateEmail },
            ...(phoneNormalized ? [{ phoneNormalized }] : []),
          ],
        },
      });

      if (candidate) {
        // Check if already submitted to this specific mandate
        const existingSubmission = await tx.candidateSubmission.findUnique({
          where: {
            candidateId_mandateId: {
              candidateId: candidate.id,
              mandateId: partnerShare.mandateId,
            },
          },
        });

        if (existingSubmission) {
          // If submitted by another partner or internal recruiter, protect existing attribution
          if (existingSubmission.partnerSourcerEmail !== cleanPartnerEmail) {
            throw new Error(
              `Duplicate Ownership Conflict: Candidate (${candidate.fullName}) is already actively registered in this search mandate under prior attribution.`
            );
          }
        }

        // Update candidate profile
        candidate = await tx.candidate.update({
          where: { id: candidate.id },
          data: {
            fullName: cleanFullName,
            rawResumeText: cleanRawResumeText || candidate.rawResumeText,
            skills: cleanSkills.length > 0 ? cleanSkills : candidate.skills,
            summary: sanitizeString(parsed.summary) || candidate.summary,
            currentCompany: sanitizeString(parsed.currentCompany) || candidate.currentCompany,
            currentTitle: sanitizeString(parsed.currentTitle) || candidate.currentTitle,
            totalExpYears: parsed.totalExpYears || candidate.totalExpYears,
            currentCtc: parsed.currentCtc || candidate.currentCtc,
            expectedCtc: parsed.expectedCtc || candidate.expectedCtc,
            noticePeriodDays: parsed.noticePeriodDays || candidate.noticePeriodDays,
          },
        });
      } else {
        candidate = await tx.candidate.create({
          data: {
            agencyId: partnerShare.agencyId,
            fullName: cleanFullName,
            email: candidateEmail,
            phone: candidatePhone,
            phoneNormalized: phoneNormalized || candidatePhone,
            currentCompany: sanitizeString(parsed.currentCompany),
            currentTitle: sanitizeString(parsed.currentTitle),
            totalExpYears: parsed.totalExpYears || 0,
            currentCtc: parsed.currentCtc || null,
            expectedCtc: parsed.expectedCtc || null,
            noticePeriodDays: parsed.noticePeriodDays || 30,
            location: sanitizeString(parsed.location),
            skills: cleanSkills,
            summary: sanitizeString(parsed.summary),
            rawResumeText: cleanRawResumeText,
            source: "PARTNER_SUBMISSION",
          },
        });
      }

      // 4. Create or Update Submission with Permanent Attribution Lock
      const submission = await tx.candidateSubmission.upsert({
        where: {
          candidateId_mandateId: {
            candidateId: candidate.id,
            mandateId: partnerShare.mandateId,
          },
        },
        update: {
          partnerSourcerName: partnerName.trim(),
          partnerSourcerEmail: cleanPartnerEmail,
          partnerSourcerPhone: partnerPhone?.trim() || null,
          partnerAgencyName: partnerAgency?.trim() || null,
          splitFeePercentage: partnerShare.splitFeePercentage,
          splitPayoutEstimated,
        },
        create: {
          agencyId: partnerShare.agencyId,
          candidateId: candidate.id,
          mandateId: partnerShare.mandateId,
          partnerSourcerName: partnerName.trim(),
          partnerSourcerEmail: cleanPartnerEmail,
          partnerSourcerPhone: partnerPhone?.trim() || null,
          partnerAgencyName: partnerAgency?.trim() || null,
          splitFeePercentage: partnerShare.splitFeePercentage,
          splitPayoutEstimated,
          stage: SubmissionStage.PARSED_RAW,
        },
      });

      // 5. Increment PartnerShare submissions count
      await tx.partnerShare.update({
        where: { id: partnerShare.id },
        data: { submissionsCount: { increment: 1 } },
      });

      // 6. Log Audit Event
      await tx.auditLog.create({
        data: {
          agencyId: partnerShare.agencyId,
          action: "PARTNER_CANDIDATE_SUBMITTED",
          entity: "CandidateSubmission",
          entityId: submission.id,
          metadata: {
            candidateName: candidate.fullName,
            candidateEmail: candidate.email,
            partnerSourcer: partnerName,
            partnerEmail: cleanPartnerEmail,
            mandateTitle: partnerShare.mandate.title,
            splitPercentage: partnerShare.splitFeePercentage,
          },
        },
      });

      return { candidate, submission };
    });

    return NextResponse.json(
      {
        message: "Candidate submitted successfully with attribution lock.",
        candidate: {
          id: result.candidate.id,
          fullName: result.candidate.fullName,
        },
        submission: {
          id: result.submission.id,
          stage: result.submission.stage,
          splitPayoutEstimated: result.submission.splitPayoutEstimated,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Partner candidate submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit candidate to partner network." },
      { status: error.message?.includes("Duplicate Ownership Conflict") ? 409 : 500 }
    );
  }
}

