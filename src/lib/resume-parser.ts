// Polyfill web canvas/DOM objects required by pdf.js / pdf-parse in Node.js serverless runtimes (e.g. Vercel)
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(init?: any) {
      if (Array.isArray(init) && init.length >= 6) {
        this.a = init[0] ?? 1; this.b = init[1] ?? 0;
        this.c = init[2] ?? 0; this.d = init[3] ?? 1;
        this.e = init[4] ?? 0; this.f = init[5] ?? 0;
      }
    }
    multiply(m: any) { return this; }
    multiplySelf(m: any) { return this; }
    preMultiplySelf(m: any) { return this; }
    invertSelf() { return this; }
    translate(x = 0, y = 0) { this.e += x; this.f += y; return this; }
    scale(x = 1, y = 1) { this.a *= x; this.d *= y; return this; }
    transformPoint(p: any) { return p; }
  }
  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
  (global as any).DOMMatrix = DOMMatrixPolyfill;
}

if (typeof (globalThis as any).Path2D === "undefined") {
  class Path2DPolyfill {
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  }
  (globalThis as any).Path2D = Path2DPolyfill;
  (global as any).Path2D = Path2DPolyfill;
}

if (typeof (globalThis as any).ImageData === "undefined") {
  class ImageDataPolyfill {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width || 0;
      this.height = height || 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    }
  }
  (globalThis as any).ImageData = ImageDataPolyfill;
  (global as any).ImageData = ImageDataPolyfill;
}

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
            console.log(`[Resume-Parser] Successfully extracted ${result.text.length} characters from ${fileName}`);
            return sanitizeUtf8(result.text);
          }
        } else if (typeof pdfModule === "function") {
          const data = await pdfModule(fileBuffer);
          if (data && data.text && data.text.trim().length > 0) {
            console.log(`[Resume-Parser] Successfully extracted ${data.text.length} characters from ${fileName}`);
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
