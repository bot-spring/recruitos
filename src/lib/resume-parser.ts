import mammoth from "mammoth";
import path from "path";

/**
 * Clean text from null bytes (\u0000) and problematic control characters that cause
 * PostgreSQL "22021: invalid byte sequence for encoding UTF8: 0x00" errors.
 */
export function sanitizeUtf8(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

/**
 * Extracts raw textual content from PDF, DOCX, or plain text resume buffers.
 */
export async function extractTextFromResume(
  fileBuffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const lowerName = fileName.toLowerCase();

  try {
    if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
      // Primary Strategy: pdf-parse (v2 and v1 compatible)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfModule = require("pdf-parse");
        if (pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: fileBuffer });
          const result = await parser.getText();
          if (parser.destroy) {
            try { await parser.destroy(); } catch (_) {}
          }
          if (result && result.text && result.text.trim().length > 0) {
            return sanitizeUtf8(result.text);
          }
        } else if (typeof pdfModule === "function") {
          const data = await pdfModule(fileBuffer);
          if (data && data.text && data.text.trim().length > 0) {
            return sanitizeUtf8(data.text);
          }
        }
      } catch (pdfParseErr: any) {
        console.warn(`pdf-parse failed for ${fileName}:`, pdfParseErr.message);
      }

      // Secondary Strategy: regex text stream extraction from PDF binary stream
      try {
        const rawString = fileBuffer.toString("binary");
        const textMatches = rawString.match(/\(([^()]{2,})\)T[jJ]/g);
        if (textMatches && textMatches.length > 0) {
          const extracted = textMatches
            .map((m) => m.replace(/[\(\)Tj]/g, "").trim())
            .filter((s) => s.length > 1)
            .join(" ");
          if (extracted.length > 20) {
            return sanitizeUtf8(extracted);
          }
        }
      } catch (_) {}

      // Never return raw binary PDF buffer as a UTF-8 string to prevent 0x00 bytes
      return "";
    }

    if (
      lowerName.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return sanitizeUtf8(result.value || "");
    }

    if (lowerName.endsWith(".txt") || mimeType === "text/plain") {
      return sanitizeUtf8(fileBuffer.toString("utf-8"));
    }

    // Default attempt as text
    return sanitizeUtf8(fileBuffer.toString("utf-8"));
  } catch (error: any) {
    console.error(`Error extracting text from ${fileName}:`, error);
    throw new Error(`Failed to extract text from document (${fileName}): ${error.message}`);
  }
}
