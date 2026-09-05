import { NextResponse } from "next/server";
import { extractTextFromResume } from "@/lib/resume-parser";
import { parseJobDescriptionWithGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/mandates/parse-jd
 * Accepts multipart/form-data (file: PDF/DOCX/TXT) or application/json ({ text: string })
 * Extracts and parses Job Description into structured mandate fields using Gemini AI
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let rawText = "";
    let fileBuffer: Buffer | undefined;
    let mimeType: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No Job Description file provided." }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File '${file.name}' exceeds the 10MB limit.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type;

      try {
        rawText = await extractTextFromResume(fileBuffer, file.name, file.type);
      } catch (_) {}
    } else {
      const body = await req.json();
      rawText = (body.text || "").trim();
    }

    if (!rawText && !fileBuffer) {
      return NextResponse.json(
        { error: "Job description text or document is required." },
        { status: 400 }
      );
    }

    const parsed = await parseJobDescriptionWithGemini(rawText, fileBuffer, mimeType);

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error("Error parsing Job Description:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse Job Description." },
      { status: 500 }
    );
  }
}
