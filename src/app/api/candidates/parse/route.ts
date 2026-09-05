import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromResume } from "@/lib/resume-parser";
import { parseResumeWithGemini, normalizePhoneNumber } from "@/lib/gemini";
import { uploadResumeFile } from "@/lib/storage";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_BATCH_FILES = 5;

// POST /api/candidates/parse - Upload & Parse Resumes with Gemini AI (up to 5 files, 10MB limit, persistent storage)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const formData = await req.formData();
    let files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      const singleFile = formData.get("file") as File | null;
      if (singleFile) files = [singleFile];
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No resume file provided for parsing." }, { status: 400 });
    }

    if (files.length > MAX_BATCH_FILES) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_BATCH_FILES} resumes can be uploaded in one go.` },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const results = [];

    for (const file of files) {
      // 1. File size check
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File '${file.name}' exceeds the maximum allowed size of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Persist physical copy to Supabase Storage (or local fallback)
      const uploadResult = await uploadResumeFile(buffer, file.name, file.type);
      const resumeUrl = uploadResult.resumeUrl;

      // 3. Extract text from PDF / DOCX
      let rawText = "";
      try {
        rawText = await extractTextFromResume(buffer, file.name, file.type);
      } catch (e: any) {
        console.warn(`Text extraction failed for ${file.name}:`, e.message);
      }

      if (rawText) {
        rawText = rawText.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
      }

      // 4. Parse entities with Gemini AI (multimodal PDF vision + deterministic fallback)
      const parsed = await parseResumeWithGemini(rawText, file.name, buffer, file.type);

      if (!rawText && parsed.summary) {
        rawText = parsed.summary.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
      }

      // 5. Deduplication check against agency database
      let existingCandidate = null;
      if (parsed.email) {
        existingCandidate = await prisma.candidate.findFirst({
          where: {
            agencyId: session.user.agencyId,
            email: { equals: parsed.email.toLowerCase().trim(), mode: "insensitive" },
          },
        });
      }

      if (!existingCandidate && parsed.phoneNormalized) {
        existingCandidate = await prisma.candidate.findFirst({
          where: {
            agencyId: session.user.agencyId,
            phoneNormalized: parsed.phoneNormalized,
          },
        });
      }

      results.push({
        fileName: file.name,
        success: true,
        parsed,
        resumeUrl,
        rawResumeText: rawText,
        isDuplicate: !!existingCandidate,
        existingCandidateId: existingCandidate?.id || null,
        rawTextSummary: rawText.substring(0, 800),
      });
    }

    // Return batch results with backward compatibility fields for single upload
    const primary = results[0] || {};
    return NextResponse.json({
      success: results.some((r) => r.success),
      results,
      count: results.length,
      // Backward compatibility fields for single-file clients
      parsed: primary.parsed,
      resumeUrl: primary.resumeUrl,
      rawResumeText: primary.rawResumeText,
      isDuplicate: primary.isDuplicate,
      existingCandidateId: primary.existingCandidateId,
      rawTextSummary: primary.rawTextSummary,
    });
  } catch (error: any) {
    console.error("Resume parsing API error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse resume document" }, { status: 500 });
  }
}
