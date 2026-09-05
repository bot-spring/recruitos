import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface UploadResumeResult {
  resumeUrl: string;
  storageType: "supabase" | "local";
}

/**
 * Uploads a resume buffer to permanent cloud storage (Supabase Storage) if configured,
 * or gracefully falls back to local disk storage (public/uploads/resumes/) in development.
 */
export async function uploadResumeFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = "application/pdf"
): Promise<UploadResumeResult> {
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;

  // 1. Try Supabase Storage (Production Mode)
  if (supabase) {
    try {
      const bucketName = "resumes";

      // Attempt upload to Supabase bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimeType || "application/octet-stream",
          upsert: true,
        });

      if (!error && data) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uniqueFileName);

        if (urlData && urlData.publicUrl) {
          console.log(`☁️ [Supabase Storage] Resume stored successfully: ${urlData.publicUrl}`);
          return {
            resumeUrl: urlData.publicUrl,
            storageType: "supabase",
          };
        }
      } else if (error) {
        console.warn("⚠️ Supabase storage upload returned error, falling back to local:", error.message);
      }
    } catch (err: any) {
      console.warn("⚠️ Exception during Supabase storage upload, falling back to local:", err.message);
    }
  }

  // 2. Fallback to Local Disk Storage (Local Dev Mode)
  const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const targetFilePath = path.join(uploadDir, uniqueFileName);
  await fs.promises.writeFile(targetFilePath, fileBuffer);
  const localUrl = `/uploads/resumes/${uniqueFileName}`;

  console.log(`💾 [Local Storage] Resume stored to disk: ${localUrl}`);
  return {
    resumeUrl: localUrl,
    storageType: "local",
  };
}

