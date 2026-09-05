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

// Pre-load WorkerMessageHandler into globalThis.pdfjsWorker to prevent pdf-parse
// from attempting to dynamically load './pdf.worker.mjs' from the filesystem in serverless environments.
try {
  const dynamicRequire = eval("require");
  const fs = dynamicRequire("fs");
  const pathMod = dynamicRequire("path");
  const workerPath = pathMod.join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs");
  if (fs.existsSync(workerPath)) {
    const workerModule = dynamicRequire(workerPath);
    if (workerModule && workerModule.WorkerMessageHandler) {
      (globalThis as any).pdfjsWorker = { WorkerMessageHandler: workerModule.WorkerMessageHandler };
      (global as any).pdfjsWorker = { WorkerMessageHandler: workerModule.WorkerMessageHandler };
    }
  }
} catch (_) {}

import mammoth from "mammoth";
import path from "path";
import zlib from "zlib";

/**
 * Standalone pure Node.js PDF stream decompressor and text extractor.
 * Handles both compressed (/FlateDecode) and uncompressed text streams without any native dependencies.
 */
function extractPdfStreamsPureNode(buffer: Buffer): string {
  try {
    const str = buffer.toString("latin1");
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;
    let fullText = "";

    while ((match = streamRegex.exec(str)) !== null) {
      const rawStream = Buffer.from(match[1], "latin1");
      let decompressed: Buffer;
      try {
        decompressed = zlib.inflateSync(rawStream);
      } catch (_) {
        try {
          decompressed = zlib.inflateRawSync(rawStream);
        } catch (_) {
          decompressed = rawStream;
        }
      }

      const decStr = decompressed.toString("latin1");
      const tjMatches = decStr.match(/\(([^()]{1,})\)\s*T[jJ]|\[([^\[\]]*)\]\s*TJ/g);
      if (tjMatches) {
        for (const m of tjMatches) {
          if (m.endsWith("Tj") || m.endsWith("tj")) {
            const inner = m.slice(1, m.lastIndexOf(")"));
            fullText += inner + " ";
          } else if (m.endsWith("TJ") || m.endsWith("tj")) {
            const parts = m.match(/\(([^()]*)\)/g);
            if (parts) {
              fullText += parts.map((p) => p.slice(1, -1)).join("") + " ";
            }
          }
        }
        fullText += "\n";
      }
    }
    return fullText.trim();
  } catch {
    return "";
  }
}

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
      // Primary Strategy: pure Node.js FlateDecode stream decompressor & text extractor (bulletproof & instant in any serverless runtime)
      try {
        const pureNodeText = extractPdfStreamsPureNode(fileBuffer);
        if (pureNodeText && pureNodeText.length > 50) {
          console.log(`[Resume-Parser] Successfully extracted ${pureNodeText.length} characters via built-in PDF stream engine for ${fileName}`);
          return sanitizeUtf8(pureNodeText);
        }
      } catch (streamErr: any) {
        console.warn(`Pure Node stream extraction failed for ${fileName}:`, streamErr.message);
      }

      // Secondary Strategy: pdf-parse (v2 and v1 compatible)
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

      // Tertiary Strategy: regex text stream extraction from raw binary stream
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
