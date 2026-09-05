import mammoth from "mammoth";
import path from "path";

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
      // Primary Strategy: direct pdfjs-dist legacy build without worker dependency in Node.js
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(fileBuffer),
          useSystemFonts: true,
          disableFontFace: true,
        });
        const doc = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const textContent = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pageText = textContent.items
            .map((item: any) => item.str || "")
            .join(" ");
          fullText += pageText + "\n";
        }
        if (fullText && fullText.trim().length > 0) {
          return fullText;
        }
      } catch (pdfjsErr: any) {
        console.warn(`Direct pdfjs-dist extraction failed for ${fileName}, falling back to pdf-parse:`, pdfjsErr.message);
      }

      // Secondary Strategy: pdf-parse with explicit worker path configuration
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfModule = require("pdf-parse");
        if (pdfModule.PDFParse) {
          try {
            const workerPath = path.resolve(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs");
            if (typeof pdfModule.PDFParse.setWorker === "function") {
              pdfModule.PDFParse.setWorker(workerPath);
            }
          } catch (_) {}

          const parser = new pdfModule.PDFParse({ data: fileBuffer });
          const result = await parser.getText();
          if (parser.destroy) {
            try { await parser.destroy(); } catch (_) {}
          }
          if (result && result.text && result.text.trim().length > 0) {
            return result.text;
          }
        } else if (typeof pdfModule === "function") {
          const data = await pdfModule(fileBuffer);
          if (data && data.text && data.text.trim().length > 0) return data.text;
        }
      } catch (pdfParseErr: any) {
        console.warn(`pdf-parse failed for ${fileName}:`, pdfParseErr.message);
      }

      // Fallback Strategy: regex pattern extraction for text streams from binary buffer
      const rawString = fileBuffer.toString("binary");
      const textMatches = rawString.match(/\(([^()]{2,})\)T[jJ]/g);
      if (textMatches && textMatches.length > 0) {
        const extracted = textMatches
          .map((m) => m.replace(/[\(\)Tj]/g, "").trim())
          .filter((s) => s.length > 1)
          .join(" ");
        if (extracted.length > 20) {
          return extracted;
        }
      }

      return fileBuffer.toString("utf-8");
    }

    if (
      lowerName.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value || "";
    }

    if (lowerName.endsWith(".txt") || mimeType === "text/plain") {
      return fileBuffer.toString("utf-8");
    }

    // Default attempt as text
    return fileBuffer.toString("utf-8");
  } catch (error: any) {
    console.error(`Error extracting text from ${fileName}:`, error);
    throw new Error(`Failed to extract text from document (${fileName}): ${error.message}`);
  }
}
