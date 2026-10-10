import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";

export interface BatchPositionRow {
  id: string; // client temporary ID
  title: string;
  openings: number;
  minExp: number;
  maxExp: number;
  minCtc: number | null;
  maxCtc: number | null;
  ctcDisplay: string; // e.g. "20 - 30 LPA"
  location: string;
  workMode: "REMOTE" | "HYBRID" | "ONSITE";
  skills: string[];
  skillsRaw: string;
  description: string;
}

/**
 * Normalizes salary / CTC strings into minCtc, maxCtc numbers (in absolute INR) and a display string.
 * Examples:
 * "20-30" or "20-30 LPA" -> min: 2000000, max: 3000000
 * "25 LPA" or "25" -> min: 2000000, max: 2500000
 * "2500000" -> min: 2500000, max: 2500000
 */
export function parseCtcString(input: string | number | null | undefined): {
  minCtc: number | null;
  maxCtc: number | null;
  display: string;
} {
  if (input === null || input === undefined || input === "") {
    return { minCtc: null, maxCtc: null, display: "" };
  }

  const str = String(input).trim();
  // Check for range like "20 - 30" or "20 to 30 LPA"
  const rangeMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    let num1 = parseFloat(rangeMatch[1]);
    let num2 = parseFloat(rangeMatch[2]);
    // If numbers are < 100, they are in LPA (Lakhs Per Annum)
    if (num1 < 200) num1 = num1 * 100000;
    if (num2 < 200) num2 = num2 * 100000;
    const lpa1 = (num1 / 100000).toFixed(num1 % 100000 === 0 ? 0 : 1);
    const lpa2 = (num2 / 100000).toFixed(num2 % 100000 === 0 ? 0 : 1);
    return {
      minCtc: num1,
      maxCtc: num2,
      display: `₹${lpa1} - ₹${lpa2} LPA`,
    };
  }

  // Single number like "25 LPA" or "2500000"
  const singleMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    let num = parseFloat(singleMatch[1]);
    if (num < 200) num = num * 100000;
    const lpa = (num / 100000).toFixed(num % 100000 === 0 ? 0 : 1);
    return {
      minCtc: Math.max(0, num - 300000),
      maxCtc: num,
      display: `₹${lpa} LPA`,
    };
  }

  return { minCtc: null, maxCtc: null, display: str };
}

/**
 * Normalizes experience strings like "3-6 yrs", "5+", "4 to 7 years" into minExp and maxExp.
 */
export function parseExpString(input: string | number | null | undefined): {
  minExp: number;
  maxExp: number;
} {
  if (input === null || input === undefined || input === "") {
    return { minExp: 0, maxExp: 5 };
  }

  if (typeof input === "number") {
    return { minExp: Math.max(0, Math.floor(input)), maxExp: Math.max(0, Math.floor(input) + 3) };
  }

  const str = String(input).trim();
  const rangeMatch = str.match(/(\d+)\s*(?:-|to)\s*(\d+)/i);
  if (rangeMatch) {
    return {
      minExp: parseInt(rangeMatch[1], 10),
      maxExp: parseInt(rangeMatch[2], 10),
    };
  }

  const singleMatch = str.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return { minExp: val, maxExp: val + 3 };
  }

  return { minExp: 0, maxExp: 5 };
}

/**
 * Parses Work Mode from string.
 */
export function parseWorkMode(input: string | null | undefined): "REMOTE" | "HYBRID" | "ONSITE" {
  if (!input) return "HYBRID";
  const str = String(input).toUpperCase();
  if (str.includes("REMOTE") || str.includes("WFH")) return "REMOTE";
  if (str.includes("ONSITE") || str.includes("OFFICE")) return "ONSITE";
  return "HYBRID";
}

/**
 * Normalizes raw tabular 2D array of strings/numbers into structured BatchPositionRow records.
 */
export function normalizeTableRows(rows: (string | number | null | undefined)[][]): BatchPositionRow[] {
  if (!rows || rows.length < 2) return [];

  // 1. Identify header index
  let headerRowIndex = 0;
  // Look for row containing "role", "title", "position", or "designation"
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map((c) => String(c || "").toLowerCase()).join(" ");
    if (
      rowStr.includes("role") ||
      rowStr.includes("title") ||
      rowStr.includes("position") ||
      rowStr.includes("designation") ||
      rowStr.includes("job")
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = rows[headerRowIndex].map((h) => String(h || "").trim().toLowerCase());

  // 2. Map column indices
  let colTitle = -1;
  let colOpenings = -1;
  let colExp = -1;
  let colMinExp = -1;
  let colMaxExp = -1;
  let colCtc = -1;
  let colLocation = -1;
  let colWorkMode = -1;
  let colSkills = -1;
  let colDesc = -1;

  headerRow.forEach((h, idx) => {
    if (colTitle === -1 && (h.includes("title") || h.includes("role") || h.includes("position") || h.includes("designation") || h === "job")) {
      colTitle = idx;
    } else if (colOpenings === -1 && (h.includes("opening") || h.includes("position") || h.includes("count") || h.includes("vacancy") || h.includes("headcount") || h.includes("no of") || h.includes("qty"))) {
      colOpenings = idx;
    } else if (h.includes("min exp") || h === "min_exp") {
      colMinExp = idx;
    } else if (h.includes("max exp") || h === "max_exp") {
      colMaxExp = idx;
    } else if (colExp === -1 && (h.includes("exp") || h.includes("year"))) {
      colExp = idx;
    } else if (colCtc === -1 && (h.includes("ctc") || h.includes("budget") || h.includes("package") || h.includes("salary") || h.includes("lpa"))) {
      colCtc = idx;
    } else if (colLocation === -1 && (h.includes("location") || h.includes("city") || h.includes("place") || h.includes("base"))) {
      colLocation = idx;
    } else if (colWorkMode === -1 && (h.includes("mode") || h.includes("type") || h.includes("remote") || h.includes("hybrid"))) {
      colWorkMode = idx;
    } else if (colSkills === -1 && (h.includes("skill") || h.includes("stack") || h.includes("technol"))) {
      colSkills = idx;
    } else if (colDesc === -1 && (h.includes("desc") || h.includes("note") || h.includes("requirement") || h.includes("summary"))) {
      colDesc = idx;
    }
  });

  // Fallback: if no title column matched, assume first non-empty column is title
  if (colTitle === -1) {
    colTitle = 0;
  }

  const results: BatchPositionRow[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawTitle = String(row[colTitle] || "").trim();
    if (!rawTitle) continue; // Skip blank rows

    // Openings
    let openings = 1;
    if (colOpenings !== -1 && row[colOpenings]) {
      const parsedO = parseInt(String(row[colOpenings]), 10);
      if (!isNaN(parsedO) && parsedO > 0) openings = parsedO;
    }

    // Exp
    let minExp = 0;
    let maxExp = 5;
    if (colMinExp !== -1 && row[colMinExp] !== undefined) {
      minExp = parseInt(String(row[colMinExp]), 10) || 0;
      maxExp = colMaxExp !== -1 && row[colMaxExp] !== undefined ? parseInt(String(row[colMaxExp]), 10) || minExp + 3 : minExp + 3;
    } else if (colExp !== -1 && row[colExp] !== undefined) {
      const parsedExp = parseExpString(row[colExp]);
      minExp = parsedExp.minExp;
      maxExp = parsedExp.maxExp;
    }

    // CTC
    let ctcInfo = { minCtc: null as number | null, maxCtc: null as number | null, display: "" };
    if (colCtc !== -1 && row[colCtc] !== undefined) {
      ctcInfo = parseCtcString(row[colCtc]);
    }

    // Location
    const location = colLocation !== -1 ? String(row[colLocation] || "").trim() : "";

    // Work Mode
    const workMode = colWorkMode !== -1 ? parseWorkMode(String(row[colWorkMode] || "")) : "HYBRID";

    // Skills
    const skillsRaw = colSkills !== -1 ? String(row[colSkills] || "").trim() : "";
    const skills = skillsRaw
      ? skillsRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      : [];

    // Description
    const description = colDesc !== -1 ? String(row[colDesc] || "").trim() : "";

    results.push({
      id: `row-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 6)}`,
      title: rawTitle,
      openings,
      minExp,
      maxExp,
      minCtc: ctcInfo.minCtc,
      maxCtc: ctcInfo.maxCtc,
      ctcDisplay: ctcInfo.display,
      location,
      workMode,
      skills,
      skillsRaw,
      description,
    });
  }

  return results;
}

/**
 * Parses a native File object (.xlsx, .xls, .csv).
 */
export async function parseSpreadsheetFile(file: File): Promise<BatchPositionRow[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          try {
            const data = results.data as (string | number)[][];
            const normalized = normalizeTableRows(data);
            resolve(normalized);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err),
      });
    });
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const rawRows = await readXlsxFile(file);
    return normalizeTableRows(rawRows as unknown as (string | number)[][]);
  }

  throw new Error("Unsupported file format. Please upload an .xlsx or .csv spreadsheet.");
}

/**
 * Parses raw text copied and pasted from Excel or Google Sheets (tab-delimited or comma-delimited).
 */
export function parsePastedSpreadsheetText(text: string): BatchPositionRow[] {
  if (!text || !text.trim()) return [];

  // Parse using PapaParse with automatic delimiter detection (tabs, commas, etc.)
  const parsed = Papa.parse(text.trim(), {
    delimiter: text.includes("\t") ? "\t" : undefined,
    skipEmptyLines: true,
  });

  return normalizeTableRows(parsed.data as (string | number)[][]);
}
