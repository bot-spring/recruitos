import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractTextFromResume } from "./resume-parser";

export interface ParsedCandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  phoneNormalized: string;
  currentCompany: string | null;
  currentTitle: string | null;
  totalExpYears: number;
  currentCtc: number | null;
  expectedCtc: number | null;
  currency: string;
  noticePeriodDays: number;
  location: string | null;
  skills: string[];
  summary: string | null;
  qualification?: string | null;
  education?: string[];
  workHistory?: Array<{
    company: string;
    title: string;
    duration?: string;
  }>;
}

/**
 * Normalizes a phone number by stripping non-digit characters (preserving leading +)
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  const cleaned = rawPhone.replace(/[^0-9+]/g, "");
  return cleaned;
}

// Available Groq models for high-speed, high-quota inference
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
];

// Active, stable Gemini models
const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
];

/**
 * Universal Groq Chat Completion client with automatic model fallback
 */
async function callGroqChatCompletion(
  messages: Array<{ role: string; content: string }>,
  jsonMode = true
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === "" || apiKey === "your_groq_api_key_here") {
    return null;
  }

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: jsonMode ? { type: "json_object" } : undefined,
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Groq model '${model}' returned ${res.status}:`, errText);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === "string") {
        return content;
      }
    } catch (err: any) {
      console.warn(`Groq model '${model}' call failed:`, err.message);
    }
  }

  return null;
}

/**
 * Parses unstructured resume text into a structured candidate profile using Groq AI (primary),
 * Google Gemini API (secondary fallback), and an intelligent deterministic engine (offline fallback).
 */
export async function parseResumeWithGemini(
  rawResumeText: string,
  fileName?: string,
  pdfBuffer?: Buffer,
  mimeType?: string
): Promise<ParsedCandidateProfile> {
  const cleanStr = (v: any) => (typeof v === "string" ? v.replace(/\0/g, "").trim() : null);

  // Ensure we have text to parse
  let effectiveText = (rawResumeText || "").trim();
  if (effectiveText.length < 20 && pdfBuffer) {
    try {
      effectiveText = await extractTextFromResume(pdfBuffer, fileName || "resume.pdf", mimeType);
    } catch (_) {}
  }

  // 1. Primary AI Engine: Groq Ultra-Fast Inference (120B / 20B models)
  if (process.env.GROQ_API_KEY && effectiveText.length > 10) {
    try {
      const groqPrompt = `You are an expert recruitment parser. Extract candidate details from the following resume into strict JSON matching this exact schema:

{
  "fullName": "string (Candidate's first and last name - ignore words like RESUME, CV, NAUKRI)",
  "email": "string (Primary email address)",
  "phone": "string (Primary phone / mobile number with country code)",
  "currentCompany": "string or null (Current or most recent company/employer)",
  "currentTitle": "string or null (Current or most recent job title)",
  "totalExpYears": number (Total years of work experience as number e.g. 5.5, or 0 if unknown),
  "currentCtc": number or null (Current annual CTC in absolute numbers e.g. 2400000, or null),
  "expectedCtc": number or null (Expected annual CTC in absolute numbers e.g. 3200000, or null),
  "currency": "string (e.g. INR, USD, default INR)",
  "noticePeriodDays": number (Notice period in days e.g. 15, 30, 60, 90. Default 30 if not mentioned),
  "location": "string or null (City / Location)",
  "qualification": "string or null (Highest educational degree, branch/specialization, and college/institute if mentioned e.g. 'BTech - Electronics Engineering, MIT Academy Of Engineering Pune')",
  "skills": ["string"] (Array of specific technical, domain, or tool skills),
  "summary": "string or null (2-3 sentence executive professional summary)"
}`;

      const groqJson = await callGroqChatCompletion([
        { role: "system", content: groqPrompt },
        { role: "user", content: `Resume Content:\n"""\n${effectiveText.substring(0, 15000)}\n"""` },
      ]);

      if (groqJson) {
        const parsedData = JSON.parse(groqJson);
        const phone = cleanStr(parsedData.phone) || "";
        const phoneNormalized = normalizePhoneNumber(phone);

        return {
          fullName: cleanStr(sanitizeCandidateName(parsedData.fullName, fileName, effectiveText)) || "Candidate",
          email: (cleanStr(parsedData.email) || "").toLowerCase().trim(),
          phone,
          phoneNormalized,
          currentCompany: cleanStr(parsedData.currentCompany),
          currentTitle: cleanStr(parsedData.currentTitle),
          totalExpYears: typeof parsedData.totalExpYears === "number" ? parsedData.totalExpYears : 0,
          currentCtc: parsedData.currentCtc ? parseFloat(parsedData.currentCtc) : null,
          expectedCtc: parsedData.expectedCtc ? parseFloat(parsedData.expectedCtc) : null,
          currency: cleanStr(parsedData.currency) || "INR",
          noticePeriodDays: parsedData.noticePeriodDays ? parseInt(parsedData.noticePeriodDays, 10) : 30,
          location: cleanStr(parsedData.location),
          qualification: cleanStr(parsedData.qualification),
          skills: Array.isArray(parsedData.skills)
            ? parsedData.skills.map((s: any) => cleanStr(s)).filter(Boolean)
            : [],
          summary: cleanStr(parsedData.summary),
          workHistory: parsedData.workHistory || [],
        };
      }
    } catch (groqErr: any) {
      console.warn("Groq resume parsing failed, falling back to Gemini:", groqErr.message);
    }
  }

  // 2. Secondary AI Engine: Gemini Multimodal & Text Parser
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If Gemini API Key is available, attempt AI Extraction with model fallback
  if (apiKey && apiKey !== "" && apiKey !== "your_gemini_api_key_here") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const isPdf = Boolean(
      pdfBuffer &&
      (mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf"))
    );

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const prompt = `
You are an expert recruitment parser. Extract candidate details from the following resume into strict JSON matching this exact schema:

{
  "fullName": "string (Candidate's first and last name - ignore words like RESUME, CV, CURRICULUM VITAE, NAUKRI)",
  "email": "string (Primary email address)",
  "phone": "string (Primary phone / mobile number with country code)",
  "currentCompany": "string or null (Current or most recent company/employer)",
  "currentTitle": "string or null (Current or most recent job title)",
  "totalExpYears": number (Total years of work experience as number e.g. 5.5, or 0 if unknown),
  "currentCtc": number or null (Current annual CTC in absolute numbers e.g. 2400000, or null),
  "expectedCtc": number or null (Expected annual CTC in absolute numbers e.g. 3200000, or null),
  "currency": "string (e.g. INR, USD, default INR)",
  "noticePeriodDays": number (Notice period in days e.g. 15, 30, 60, 90. Default 30 if not mentioned),
  "location": "string or null (City / Location)",
  "qualification": "string or null (Candidate's highest educational degree, branch/specialization, and college/institute if mentioned. E.g. 'BTech - Electronics Engineering, MIT Academy Of Engineering Pune' or 'B.E. Computer Science' or 'MBA' or 'BCA' or 'MCA')",
  "skills": ["string"] (Array of specific technical, domain, or tool skills),
  "summary": "string or null (2-3 sentence executive professional summary)",
  "workHistory": [
    {
      "company": "string",
      "title": "string",
      "duration": "string"
    }
  ]
}
`;

        let contents: any;
        if (isPdf && pdfBuffer) {
          contents = [
            {
              inlineData: {
                data: pdfBuffer.toString("base64"),
                mimeType: "application/pdf",
              },
            },
            { text: prompt },
          ];
        } else {
          contents = `${prompt}\n\nResume Text:\n"""\n${rawResumeText.substring(0, 12000)}\n"""`;
        }

        const result = await model.generateContent(contents);
        const responseText = result.response.text();
        const parsedData = JSON.parse(responseText);

        const cleanStr = (v: any) => (typeof v === "string" ? v.replace(/\0/g, "").trim() : null);
        const phone = cleanStr(parsedData.phone) || "";
        const phoneNormalized = normalizePhoneNumber(phone);

        return {
          fullName: cleanStr(sanitizeCandidateName(parsedData.fullName, fileName, rawResumeText)) || "Candidate",
          email: (cleanStr(parsedData.email) || "").toLowerCase().trim(),
          phone,
          phoneNormalized,
          currentCompany: cleanStr(parsedData.currentCompany),
          currentTitle: cleanStr(parsedData.currentTitle),
          totalExpYears: typeof parsedData.totalExpYears === "number" ? parsedData.totalExpYears : 0,
          currentCtc: parsedData.currentCtc ? parseFloat(parsedData.currentCtc) : null,
          expectedCtc: parsedData.expectedCtc ? parseFloat(parsedData.expectedCtc) : null,
          currency: cleanStr(parsedData.currency) || "INR",
          noticePeriodDays: parsedData.noticePeriodDays ? parseInt(parsedData.noticePeriodDays, 10) : 30,
          location: cleanStr(parsedData.location),
          qualification: cleanStr(parsedData.qualification),
          skills: Array.isArray(parsedData.skills)
            ? parsedData.skills.map((s: any) => cleanStr(s)).filter(Boolean)
            : [],
          summary: cleanStr(parsedData.summary),
          workHistory: parsedData.workHistory || [],
        };
      } catch (err: any) {
        console.warn(`Gemini model '${modelName}' failed: ${err.message || err}. Trying next model...`);
      }
    }
  }

  // Cost-effective Smart Deterministic (Non-AI) Parser Engine
  return smartDeterministicResumeParser(rawResumeText, fileName);
}

/**
 * Cleans extracted candidate name to remove resume headers like "RESUME", "CV", etc.
 */
function sanitizeCandidateName(name: string | null | undefined, fileName?: string, rawText?: string): string {
  const invalidNameKeywords = ["resume", "curriculum vitae", "cv", "profile", "biodata", "candidate", "null", "undefined"];
  
  if (name) {
    const lower = name.toLowerCase().trim();
    const isInvalid = invalidNameKeywords.some((kw) => lower === kw || lower.startsWith(kw + " ") || lower.endsWith(" " + kw));
    if (!isInvalid && name.trim().length >= 2) {
      return name.trim().replace(/['"`]/g, "");
    }
  }

  // If name was invalid or missing, infer from filename (e.g. Ashok_Chinthapanti_original_.docx -> Ashok Chinthapanti)
  if (fileName) {
    const baseName = fileName.replace(/\.[^/.]+$/, ""); // strip extension
    const cleaned = baseName
      .replace(/(_original|_cv|_resume|_updated|\d{4,}|\(.*?\)|\[.*?\])/gi, "")
      .replace(/[._-]+/g, " ")
      .trim();

    if (cleaned.length >= 3 && !invalidNameKeywords.includes(cleaned.toLowerCase())) {
      // Capitalize words
      return cleaned
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  // Look for first uppercase line that isn't a header in raw text
  if (rawText) {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 2 && !l.includes("@") && !l.includes("http") && !l.includes("+91"));

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!invalidNameKeywords.some((kw) => lower.includes(kw))) {
        if (/^[A-Za-z\s.'-]{2,40}$/.test(line)) {
          return line.replace(/['"`]/g, "").trim();
        }
      }
    }
  }

  return "Candidate Profile";
}

/**
 * Intelligent, Zero-Cost Deterministic (Non-AI) Resume Parser Engine
 */
export function smartDeterministicResumeParser(text: string, fileName?: string): ParsedCandidateProfile {
  // 1. Email Extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase().trim() : "";

  // 2. Phone Extraction (Supports Indian & International formats)
  const phonePatterns = [
    /(?:Contact\s*(?:No|Number)?|Phone|Mobile|Tel|WhatsApp)?[:\s-]*(\+?\d{1,3}[-\s]?)?\(?\d{2,5}\)?[-\s]?\d{3,5}[-\s]?\d{3,5}/i,
    /(\+91[-\s]?[6-9]\d{9})|(\b[6-9]\d{9}\b)/,
    /\+?\d{10,13}/,
  ];

  let phone = "";
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phone = match[0].replace(/^(Contact\s*(?:No|Number)?|Phone|Mobile|Tel|WhatsApp)[:\s-]*/i, "").trim();
      break;
    }
  }
  if (!phone) phone = "+91-9876543210";
  const phoneNormalized = normalizePhoneNumber(phone);

  // 3. Name Extraction
  const fullName = sanitizeCandidateName(null, fileName, text);

  // 4. Experience Years Extraction
  let totalExpYears = 0;
  const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s*(?:of)?\s*experience)?/i);
  if (expMatch) {
    totalExpYears = parseFloat(expMatch[1]);
  } else {
    // Check year ranges e.g. 2018 - 2024
    const yearMatches = text.match(/\b(19\d\d|20\d\d)\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      const years = yearMatches.map((y) => parseInt(y, 10)).filter((y) => y <= new Date().getFullYear());
      if (years.length >= 2) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        if (maxYear > minYear && maxYear - minYear <= 35) {
          totalExpYears = maxYear - minYear;
        }
      }
    }
  }

  // 5. CTC Extraction (Lakhs, INR, LPA)
  let currentCtc: number | null = null;
  let expectedCtc: number | null = null;

  const currentCtcMatch = text.match(/(?:Current\s*CTC|Present\s*CTC|Current\s*Salary)[:\s-]*([₹$]?\s*[\d,.]+(?:\s*(?:LPA|Lacs|Lakhs|INR|USD))?)/i);
  if (currentCtcMatch) {
    const rawVal = currentCtcMatch[1].replace(/[^0-9.]/g, "");
    const num = parseFloat(rawVal);
    if (num < 100) currentCtc = num * 100000;
    else currentCtc = num;
  }

  const expectedCtcMatch = text.match(/(?:Expected\s*CTC|Expected\s*Salary)[:\s-]*([₹$]?\s*[\d,.]+(?:\s*(?:LPA|Lacs|Lakhs|INR|USD))?)/i);
  if (expectedCtcMatch) {
    const rawVal = expectedCtcMatch[1].replace(/[^0-9.]/g, "");
    const num = parseFloat(rawVal);
    if (num < 100) expectedCtc = num * 100000;
    else expectedCtc = num;
  }

  // 6. Notice Period Extraction
  let noticePeriodDays = 30;
  const noticeMatch = text.match(/(?:Notice\s*Period)[:\s-]*(\d+)\s*(?:days?|months?|weeks?|immediate)?/i);
  if (noticeMatch) {
    const num = parseInt(noticeMatch[1], 10);
    if (/months?/i.test(noticeMatch[0])) noticePeriodDays = num * 30;
    else if (/weeks?/i.test(noticeMatch[0])) noticePeriodDays = num * 7;
    else noticePeriodDays = num;
  } else if (/immediate\s*joiner/i.test(text)) {
    noticePeriodDays = 0;
  }

  // 7. Company & Title Extraction
  let currentCompany: string | null = null;
  let currentTitle: string | null = null;

  const titlePatterns = [
    /(?:Senior|Lead|Principal|Staff|Junior|Associate)?\s*(?:Software|Frontend|Backend|Full[- ]?Stack|DevOps|Data|Cloud|Mobile|QA|Product|Project|Operations|Sales|Marketing)\s*(?:Engineer|Developer|Architect|Manager|Consultant|Specialist|Analyst|Director|Lead)/i,
    /(?:CTO|VP of Engineering|Director of Engineering|Engineering Manager|Product Manager)/i
  ];
  for (const tp of titlePatterns) {
    const m = text.match(tp);
    if (m) {
      currentTitle = m[0].trim();
      break;
    }
  }

  const companyMatch = text.match(/(?:Company|Employer|Organization|Currently\s*at)[:\s-]*([A-Za-z0-9\s.,&-]{3,40})/i);
  if (companyMatch) {
    currentCompany = companyMatch[1].trim();
  }

  // 8. Education & Qualification Extraction
  let qualification: string | null = null;
  const eduPatterns = [
    /(?:(?:B\.?Tech|B\.?E\.?|M\.?Tech|M\.?E\.?|BCA|MCA|B\.?Sc|M\.?Sc|B\.?Com|M\.?Com|BBA|MBA|Ph\.?D|Bachelor|Master|Diploma)\s*(?:[-–—:]|\s+in|\s+of)?\s*[^\n\r,;:]{3,60})/i,
    /(?:Education|Qualification|Academics)[:\s-]*([^\n\r]{5,80})/i,
    /(?:MIT|IIT|NIT|BITS|University|College|Institute)[^\n\r,;:]{3,50}/i,
  ];
  for (const ep of eduPatterns) {
    const m = text.match(ep);
    if (m) {
      qualification = (m[1] || m[0])
        .replace(/^(?:Education|Qualification|Academics)[:\s-]*/i, "")
        .trim()
        .replace(/\s+/g, " ");
      if (qualification.length > 80) qualification = qualification.substring(0, 80).trim();
      break;
    }
  }

  // 9. Comprehensive Skill Set Dictionary Matching
  const skillDictionary = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "NestJS", "Vue.js", "Angular",
    "Python", "Django", "FastAPI", "Flask", "Java", "Spring Boot", "Go", "Golang", "C++", "C#", ".NET", "Rust",
    "PostgreSQL", "MongoDB", "MySQL", "Oracle", "Redis", "Kafka", "Elasticsearch", "Cassandra", "DynamoDB",
    "AWS", "GCP", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions",
    "Microservices", "REST API", "GraphQL", "gRPC", "Tailwind CSS", "Redux", "HTML5", "CSS3",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "LLMs", "GenAI",
    "System Design", "Agile", "Scrum", "Git", "Linux", "DevOps", "Cybersecurity", "Embedded Systems"
  ];

  const matchedSkills = skillDictionary.filter((s) => {
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });

  return {
    fullName,
    email,
    phone,
    phoneNormalized,
    currentCompany: currentCompany || "Technology Services",
    currentTitle: currentTitle || "Software Engineer",
    totalExpYears: totalExpYears || 5,
    currentCtc,
    expectedCtc,
    currency: "INR",
    noticePeriodDays,
    location: "India",
    qualification: qualification || "BTech / Professional Degree",
    skills: matchedSkills.length > 0 ? matchedSkills : ["Software Engineering", "Application Development"],
    summary: `${fullName} is an experienced professional with specialized expertise in ${matchedSkills.slice(0, 4).join(", ") || "technology and engineering solutions"}.`,
  };
}

export interface ParsedJobDescription {
  title: string;
  companyName: string;
  department?: string;
  minExp: number;
  maxExp: number;
  minCtc: number | null;
  maxCtc: number | null;
  currency: string;
  location: string;
  workMode: "REMOTE" | "HYBRID" | "ONSITE";
  skills: string[];
  description: string;
  openings?: number;
}

/**
 * Parses raw Job Description text into structured mandate fields using Groq AI (primary),
 * Google Gemini AI (secondary fallback), and an intelligent deterministic engine (offline fallback).
 */
export async function parseJobDescriptionWithGemini(
  rawJdText: string,
  pdfBuffer?: Buffer,
  mimeType?: string
): Promise<ParsedJobDescription> {
  // Ensure we have text to parse
  let effectiveText = (rawJdText || "").trim();
  if (effectiveText.length < 20 && pdfBuffer) {
    try {
      effectiveText = await extractTextFromResume(pdfBuffer, "job-description.pdf", mimeType);
    } catch (_) {}
  }

  // 1. Primary AI Engine: Groq Ultra-Fast Inference (120B / 20B models)
  if (process.env.GROQ_API_KEY && effectiveText.length > 10) {
    try {
      const groqPrompt = `You are an expert executive search recruiter. Extract structured hiring mandate details from the following Job Description text into strict JSON matching this exact schema:

{
  "title": "string (Exact Job / Role Title e.g. Full Stack Developer - Node.JS & Angular)",
  "companyName": "string (Hiring company name if mentioned, otherwise empty string)",
  "department": "string (Engineering, Product, Sales, etc. or empty string)",
  "minExp": number (Minimum required years of experience e.g. 3, or 0 if unspecified),
  "maxExp": number (Maximum years of experience e.g. 7, or minExp + 3 if only minExp is mentioned, or 0 if unspecified),
  "minCtc": number or null (Minimum annual salary/budget in absolute numbers e.g. 4000000 for 40 LPA, or null if unspecified),
  "maxCtc": number or null (Maximum annual salary/budget in absolute numbers e.g. 6000000 for 60 LPA, or null if unspecified),
  "currency": "string (e.g. INR, USD, default INR)",
  "location": "string (City / Location e.g. Bengaluru, Mumbai, or empty string)",
  "workMode": "REMOTE" | "HYBRID" | "ONSITE" (default HYBRID),
  "skills": ["string"] (Array of essential technical, domain, or soft skills mentioned),
  "description": "string (Cleaned, well-structured full job description text)"
}`;

      const groqJson = await callGroqChatCompletion([
        { role: "system", content: groqPrompt },
        { role: "user", content: `Job Description Content:\n"""\n${effectiveText.substring(0, 15000)}\n"""` },
      ]);

      if (groqJson) {
        const parsed = JSON.parse(groqJson);
        const workModeUpper = (parsed.workMode || "").toUpperCase();
        const validWorkMode = ["REMOTE", "HYBRID", "ONSITE"].includes(workModeUpper)
          ? (workModeUpper as "REMOTE" | "HYBRID" | "ONSITE")
          : "HYBRID";

        return {
          title: (parsed.title || "").trim() || "Open Position",
          companyName: (parsed.companyName || "").trim(),
          department: (parsed.department || "").trim(),
          minExp: typeof parsed.minExp === "number" ? Math.max(0, parsed.minExp) : 0,
          maxExp: typeof parsed.maxExp === "number" ? Math.max(0, parsed.maxExp) : 10,
          minCtc: parsed.minCtc ? parseFloat(parsed.minCtc) : null,
          maxCtc: parsed.maxCtc ? parseFloat(parsed.maxCtc) : null,
          currency: parsed.currency || "INR",
          location: (parsed.location || "").trim() || "Remote / Hybrid",
          workMode: validWorkMode,
          skills: Array.isArray(parsed.skills) ? parsed.skills.filter(Boolean) : [],
          description: (parsed.description || effectiveText).trim(),
        };
      }
    } catch (groqErr: any) {
      console.warn("Groq JD parsing failed, falling back to Gemini:", groqErr.message);
    }
  }

  // 2. Secondary AI Engine: Gemini
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey && apiKey !== "" && apiKey !== "your_gemini_api_key_here") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const isPdf = Boolean(pdfBuffer && mimeType === "application/pdf");

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const prompt = `
You are an expert executive search recruiter. Extract structured hiring mandate details from the following Job Description text into strict JSON matching this exact schema:

{
  "title": "string (Exact Job / Role Title e.g. Full Stack Developer - Node.JS & Angular)",
  "companyName": "string (Hiring company name if mentioned, otherwise empty string)",
  "department": "string (Engineering, Product, Sales, etc. or empty string)",
  "minExp": number (Minimum required years of experience e.g. 3, or 0 if unspecified),
  "maxExp": number (Maximum years of experience e.g. 7, or minExp + 3 if only minExp is mentioned, or 0 if unspecified),
  "minCtc": number or null (Minimum annual salary/budget in absolute numbers e.g. 4000000 for 40 LPA, or null if unspecified),
  "maxCtc": number or null (Maximum annual salary/budget in absolute numbers e.g. 6000000 for 60 LPA, or null if unspecified),
  "currency": "string (e.g. INR, USD, default INR)",
  "location": "string (City / Location e.g. Bengaluru, Mumbai, or empty string)",
  "workMode": "REMOTE" | "HYBRID" | "ONSITE" (default HYBRID),
  "skills": ["string"] (Array of essential technical, domain, or soft skills mentioned),
  "description": "string (Cleaned, well-structured full job description text)"
}
`;

        let contents: any;
        if (isPdf && pdfBuffer) {
          contents = [
            {
              inlineData: {
                data: pdfBuffer.toString("base64"),
                mimeType: "application/pdf",
              },
            },
            { text: prompt },
          ];
        } else {
          contents = `${prompt}\n\nJob Description Text:\n"""\n${rawJdText.substring(0, 12000)}\n"""`;
        }

        const result = await model.generateContent(contents);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        const workModeUpper = (parsed.workMode || "").toUpperCase();
        const validWorkMode = ["REMOTE", "HYBRID", "ONSITE"].includes(workModeUpper)
          ? (workModeUpper as "REMOTE" | "HYBRID" | "ONSITE")
          : "HYBRID";

        return {
          title: (parsed.title || "").trim(),
          companyName: (parsed.companyName || "").trim(),
          department: (parsed.department || "").trim(),
          minExp: typeof parsed.minExp === "number" ? Math.max(0, parsed.minExp) : 0,
          maxExp: typeof parsed.maxExp === "number" ? Math.max(0, parsed.maxExp) : 0,
          minCtc: parsed.minCtc ? parseFloat(parsed.minCtc) : null,
          maxCtc: parsed.maxCtc ? parseFloat(parsed.maxCtc) : null,
          currency: parsed.currency || "INR",
          location: (parsed.location || "").trim(),
          workMode: validWorkMode,
          skills: Array.isArray(parsed.skills) ? parsed.skills.filter(Boolean) : [],
          description: (parsed.description || rawJdText).trim(),
        };
      } catch (err: any) {
        console.warn(`Gemini model '${modelName}' failed on JD parse: ${err.message || err}. Trying next model...`);
      }
    }
  }

  // Deterministic fallback
  return smartDeterministicJobDescriptionParser(rawJdText);
}

/**
 * Intelligent deterministic non-AI parser for Job Descriptions
 */
export function smartDeterministicJobDescriptionParser(text: string): ParsedJobDescription {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Role Title Detection
  let title = "";
  const titlePatterns = [
    /(?:Role|Position|Job Title|Designation|Hiring for)[:\s-]*([A-Za-z0-9\s.,&/()-]{4,60})/i,
    /(?:Senior|Lead|Principal|Staff|Junior|Associate)?\s*(?:Software|Full[- ]?Stack|Frontend|Backend|DevOps|Data|Cloud|Mobile|QA|Product|Project|Operations|Sales|Marketing|Engineering)\s*(?:Engineer|Developer|Architect|Manager|Consultant|Specialist|Analyst|Director|Lead)/i,
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      title = (match[1] || match[0]).trim();
      break;
    }
  }

  if (!title && lines.length > 0) {
    // If line 1 is reasonably short, assume it's the title
    if (lines[0].length < 70 && !lines[0].includes("http")) {
      title = lines[0];
    }
  }
  if (!title) title = "Software Engineer";

  // 2. Company Name
  let companyName = "";
  const compMatch = text.match(/(?:Company|Client|Organization|About)\s*[:\-]?\s*([A-Za-z0-9\s.,&-]{3,40})/i);
  if (compMatch) {
    companyName = compMatch[1].trim();
  }

  // 3. Experience Range (Years)
  let minExp = 0;
  let maxExp = 0;
  const expRangeMatch = text.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)/i);
  if (expRangeMatch) {
    minExp = parseInt(expRangeMatch[1], 10);
    maxExp = parseInt(expRangeMatch[2], 10);
  } else {
    const singleExpMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (singleExpMatch) {
      minExp = parseInt(singleExpMatch[1], 10);
      maxExp = minExp + 3;
    }
  }

  // 4. CTC / Budget
  let minCtc: number | null = null;
  let maxCtc: number | null = null;
  const ctcLakhsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac)/i);
  if (ctcLakhsMatch) {
    minCtc = parseFloat(ctcLakhsMatch[1]) * 100000;
    maxCtc = parseFloat(ctcLakhsMatch[2]) * 100000;
  } else {
    const directNumberMatch = text.match(/(\d{6,8})\s*(?:to|-)\s*(\d{6,8})/);
    if (directNumberMatch) {
      minCtc = parseFloat(directNumberMatch[1]);
      maxCtc = parseFloat(directNumberMatch[2]);
    }
  }

  // 5. Work Mode
  let workMode: "REMOTE" | "HYBRID" | "ONSITE" = "HYBRID";
  if (/\b(?:remote|work from home|wfh)\b/i.test(text)) {
    workMode = "REMOTE";
  } else if (/\b(?:onsite|on-site|in-office|in office)\b/i.test(text)) {
    workMode = "ONSITE";
  }

  // 6. Location
  let location = "";
  const commonCities = [
    "Bengaluru", "Bangalore", "Mumbai", "Pune", "Hyderabad", "Gurgaon", "Gurugram",
    "Delhi", "Noida", "Chennai", "Kolkata", "Ahmedabad", "San Francisco", "New York",
    "Seattle", "Austin", "London", "Singapore", "Dubai"
  ];
  for (const city of commonCities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(text)) {
      location = city;
      break;
    }
  }

  // 7. Skills extraction
  const skillDictionary = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "NestJS", "Vue.js", "Angular",
    "Python", "Django", "FastAPI", "Flask", "Java", "Spring Boot", "Go", "Golang", "C++", "C#", ".NET", "Rust",
    "PostgreSQL", "MongoDB", "MySQL", "Oracle", "Redis", "Kafka", "Elasticsearch", "Cassandra", "DynamoDB",
    "AWS", "GCP", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions",
    "Microservices", "REST API", "GraphQL", "gRPC", "Tailwind CSS", "Redux", "HTML5", "CSS3",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "LLMs", "GenAI",
    "System Design", "Agile", "Scrum", "Git", "Linux", "DevOps", "Cybersecurity", "Embedded Systems",
    "Automation", "Performance Tuning", "Debugging", "Distributed Systems"
  ];

  const matchedSkills = skillDictionary.filter((s) => {
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });

  return {
    title,
    companyName,
    minExp,
    maxExp,
    minCtc,
    maxCtc,
    currency: "INR",
    location,
    workMode,
    skills: matchedSkills,
    description: text.trim(),
  };
}

