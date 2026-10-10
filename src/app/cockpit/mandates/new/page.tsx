"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Briefcase,
  Users,
  DollarSign,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronDown,
  X,
  ClipboardPaste,
  Info,
  BookOpen,
  Edit3,
  RotateCcw,
} from "lucide-react";
import {
  parseSpreadsheetFile,
  parsePastedSpreadsheetText,
  BatchPositionRow,
  parseCtcString,
  parseExpString,
} from "@/lib/excel-parser";

interface ClientSuggestion {
  id: string;
  name: string;
  industry: string;
  location: string;
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
  } | null;
}

// Standard Agency Archetypes (Zoho-inspired quick templates)
interface RoleTemplate {
  name: string;
  title: string;
  openings: number;
  minExp: number;
  maxExp: number;
  minCtc: string;
  maxCtc: string;
  workMode: "REMOTE" | "HYBRID" | "ONSITE";
  location: string;
  skills: string[];
  description: string;
}

const AGENCY_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: "Senior Backend Engineer (Node.js/Go)",
    title: "Senior Backend Engineer",
    openings: 1,
    minExp: 4,
    maxExp: 8,
    minCtc: "25",
    maxCtc: "38",
    workMode: "HYBRID",
    location: "Bengaluru",
    skills: ["Node.js", "Go", "PostgreSQL", "Redis", "Distributed Systems", "AWS", "Docker"],
    description: "Looking for an experienced Backend Engineer to scale core high-throughput microservices. Experience with distributed architectures and database optimization required.",
  },
  {
    name: "Senior Frontend Engineer (React/Next.js)",
    title: "Senior Frontend Engineer",
    openings: 1,
    minExp: 4,
    maxExp: 7,
    minCtc: "22",
    maxCtc: "34",
    workMode: "HYBRID",
    location: "Bengaluru",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux / Zustand", "REST APIs", "Git"],
    description: "Seeking a passionate Frontend Specialist to craft responsive, ultra-fast web user experiences with modern React and TypeScript.",
  },
  {
    name: "Full Stack Developer (React & Node)",
    title: "Full Stack Developer",
    openings: 2,
    minExp: 3,
    maxExp: 6,
    minCtc: "18",
    maxCtc: "28",
    workMode: "HYBRID",
    location: "Gurgaon",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Docker", "Git"],
    description: "Full stack developer responsible for end-to-end feature delivery across web frontends, backend APIs, and database schemas.",
  },
  {
    name: "DevOps & Cloud Platform Engineer",
    title: "Lead DevOps / Platform Engineer",
    openings: 1,
    minExp: 5,
    maxExp: 9,
    minCtc: "28",
    maxCtc: "42",
    workMode: "REMOTE",
    location: "Remote - India",
    skills: ["AWS", "Kubernetes", "Terraform", "CI/CD", "Docker", "Prometheus", "Linux", "Git"],
    description: "Drive cloud infrastructure reliability, automated Kubernetes deployments, CI/CD pipelines, and observability at scale.",
  },
  {
    name: "Senior Product Manager (B2B SaaS)",
    title: "Senior Product Manager",
    openings: 1,
    minExp: 5,
    maxExp: 8,
    minCtc: "30",
    maxCtc: "45",
    workMode: "HYBRID",
    location: "Bengaluru / Mumbai",
    skills: ["Product Strategy", "User Research", "Agile Roadmap", "Data Analytics", "B2B SaaS", "GTM"],
    description: "Lead roadmap discovery, customer interviews, and feature prioritization from concept to release.",
  },
  {
    name: "B2B Enterprise Account Executive / SDR",
    title: "Enterprise Sales Lead",
    openings: 2,
    minExp: 3,
    maxExp: 6,
    minCtc: "15",
    maxCtc: "25",
    workMode: "ONSITE",
    location: "Mumbai",
    skills: ["Enterprise B2B Sales", "Lead Generation", "Pipeline Management", "Contract Negotiation", "CRM"],
    description: "Spearhead corporate client outreach, outbound prospecting, and deal closing across enterprise accounts.",
  },
];

export default function NewMandatePage() {
  const router = useRouter();

  // Intake Track: 'single' (Smart JD Drop) or 'batch' (Spreadsheet Grid)
  const [activeTrack, setActiveTrack] = useState<"single" | "batch">("single");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "batch") {
        setActiveTrack("batch");
      }
    }
  }, []);

  // Template Dropdown State
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Progressive Disclosure: Is the review card visible?
  // When false, only the Smart Dropzone is shown at the top.
  const [isSingleDetailsRevealed, setIsSingleDetailsRevealed] = useState(false);

  // Track 1: Single Role State
  const [jdRawInput, setJdRawInput] = useState("");
  const [isParsingJd, setIsParsingJd] = useState(false);
  const [singleTitle, setSingleTitle] = useState("");
  const [singleOpenings, setSingleOpenings] = useState(1);
  const [singleMinExp, setSingleMinExp] = useState(2);
  const [singleMaxExp, setSingleMaxExp] = useState(5);
  const [singleMinCtc, setSingleMinCtc] = useState<string>("");
  const [singleMaxCtc, setSingleMaxCtc] = useState<string>("");
  const [singleLocation, setSingleLocation] = useState("");
  const [singleWorkMode, setSingleWorkMode] = useState<"REMOTE" | "HYBRID" | "ONSITE">("HYBRID");
  const [singleSkills, setSingleSkills] = useState<string[]>([]);
  const [singleSkillInput, setSingleSkillInput] = useState("");
  const [singleDescription, setSingleDescription] = useState("");
  const [isParsedSingle, setIsParsedSingle] = useState(false);

  // Track 2: Batch Grid State
  const [batchRows, setBatchRows] = useState<BatchPositionRow[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [inlinePasteText, setInlinePasteText] = useState("");
  const [isParsingInlinePaste, setIsParsingInlinePaste] = useState(false);

  // Bottom Section: Client & Commercial Terms
  const [companyName, setCompanyName] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<ClientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [selectedExistingClient, setSelectedExistingClient] = useState<ClientSuggestion | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [feePercentage, setFeePercentage] = useState(8.33);
  const [guaranteeDays, setGuaranteeDays] = useState(90);
  const [slaTargetHours, setSlaTargetHours] = useState(72);

  // Feedback & Validation states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [companyInputError, setCompanyInputError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DOM Refs for smooth auto-scroll on reveal and error focus
  const reviewCardRef = useRef<HTMLDivElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  // Close template dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setTemplateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Client autocomplete search
  useEffect(() => {
    if (!companyName.trim() || companyName.trim().length < 2) {
      setClientSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingClient(true);
        const res = await fetch(`/api/clients/autocomplete?q=${encodeURIComponent(companyName.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.clients)) {
          setClientSuggestions(data.clients);
        }
      } catch (_) {
      } finally {
        setIsSearchingClient(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [companyName]);

  const handleSelectClient = (client: ClientSuggestion) => {
    setCompanyName(client.name);
    setSelectedExistingClient(client);
    setCompanyInputError(false);
    if (client.primaryContact) {
      setContactName(client.primaryContact.name || "");
      setContactEmail(client.primaryContact.email || "");
      setContactPhone(client.primaryContact.phone || "");
    }
    setShowSuggestions(false);
  };

  // Apply Role Template (Pic 3 & 4 inspiration)
  const handleApplyTemplate = (tmpl: RoleTemplate) => {
    setSingleTitle(tmpl.title);
    setSingleOpenings(tmpl.openings);
    setSingleMinExp(tmpl.minExp);
    setSingleMaxExp(tmpl.maxExp);
    setSingleMinCtc(tmpl.minCtc);
    setSingleMaxCtc(tmpl.maxCtc);
    setSingleWorkMode(tmpl.workMode);
    setSingleLocation(tmpl.location);
    setSingleSkills(tmpl.skills);
    setSingleDescription(tmpl.description);
    setIsParsedSingle(true);
    setIsSingleDetailsRevealed(true);
    setTemplateDropdownOpen(false);

    // Scroll smoothly to review card
    setTimeout(() => {
      reviewCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Track 1: Parse JD with Botspring AI
  const handleParseSingleJd = async (textToParse?: string, file?: File) => {
    const text = textToParse || jdRawInput;
    if (!text.trim() && !file) return;

    setIsParsingJd(true);
    setErrorMsg(null);

    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/mandates/parse-jd", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/mandates/parse-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse job description.");

      const p = data.data;
      if (p.title) setSingleTitle(p.title);
      // Auto-detect company name if not yet entered!
      if (p.companyName && !companyName) {
        setCompanyName(p.companyName);
        setCompanyInputError(false);
      }
      if (p.openings) setSingleOpenings(p.openings);
      if (p.minExp !== undefined) setSingleMinExp(p.minExp);
      if (p.maxExp !== undefined) setSingleMaxExp(p.maxExp);
      if (p.minCtc) setSingleMinCtc(String(p.minCtc / 100000));
      if (p.maxCtc) setSingleMaxCtc(String(p.maxCtc / 100000));
      if (p.location) setSingleLocation(p.location);
      if (p.workMode) setSingleWorkMode(p.workMode);
      if (Array.isArray(p.skills) && p.skills.length > 0) setSingleSkills(p.skills);
      if (p.description) setSingleDescription(p.description);

      setIsParsedSingle(true);
      setIsSingleDetailsRevealed(true);

      // Scroll smoothly to review card
      setTimeout(() => {
        reviewCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse JD.");
    } finally {
      setIsParsingJd(false);
    }
  };

  // Track 2: Handle File Drop / Upload
  const handleSpreadsheetUpload = async (file: File) => {
    setIsParsingFile(true);
    setErrorMsg(null);
    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length === 0) {
        throw new Error("No valid position rows could be identified in the uploaded spreadsheet.");
      }
      setBatchRows((prev) => [...prev, ...rows]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process spreadsheet.");
    } finally {
      setIsParsingFile(false);
    }
  };

  // Track 2: Handle Inline Pasted Text
  const handleInlinePasteSubmit = () => {
    if (!inlinePasteText.trim()) return;
    setIsParsingInlinePaste(true);
    setErrorMsg(null);
    try {
      const rows = parsePastedSpreadsheetText(inlinePasteText);
      if (rows.length === 0) {
        throw new Error("Could not detect tabular rows. Please copy rows from Excel including column headers.");
      }
      setBatchRows((prev) => [...prev, ...rows]);
      setInlinePasteText("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse pasted data.");
    } finally {
      setIsParsingInlinePaste(false);
    }
  };

  // Global clipboard listener for Track 2: paste anywhere on page to ingest
  useEffect(() => {
    if (activeTrack !== "batch") return;

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const clipboardData = e.clipboardData?.getData("text");
      if (clipboardData && clipboardData.includes("\t")) {
        e.preventDefault();
        const rows = parsePastedSpreadsheetText(clipboardData);
        if (rows.length > 0) {
          setBatchRows((prev) => [...prev, ...rows]);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTrack]);

  // Track 2: Add / Update / Delete rows
  const handleAddBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: "",
        openings: 1,
        minExp: 2,
        maxExp: 5,
        minCtc: null,
        maxCtc: null,
        ctcDisplay: "",
        location: "",
        workMode: "HYBRID",
        skills: [],
        skillsRaw: "",
        description: "",
      },
    ]);
  };

  const handleUpdateBatchRow = (id: string, updates: Partial<BatchPositionRow>) => {
    setBatchRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        if (updates.ctcDisplay !== undefined) {
          const parsedCtc = parseCtcString(updates.ctcDisplay);
          updated.minCtc = parsedCtc.minCtc;
          updated.maxCtc = parsedCtc.maxCtc;
        }
        if (updates.skillsRaw !== undefined) {
          updated.skills = updates.skillsRaw
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return updated;
      })
    );
  };

  const handleDeleteBatchRow = (id: string) => {
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Launch Single Mandate (with error auto-scroll)
  const handleLaunchSingle = async () => {
    if (!singleTitle.trim()) {
      setErrorMsg("Please enter the Target Role Title.");
      reviewCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!companyName.trim()) {
      setErrorMsg("Please enter or select the Client Company Name below.");
      setCompanyInputError(true);
      companyInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      companyInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const minCtcNum = singleMinCtc ? parseFloat(singleMinCtc) * 100000 : null;
      const maxCtcNum = singleMaxCtc ? parseFloat(singleMaxCtc) * 100000 : null;

      const payload = {
        companyName: companyName.trim(),
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        title: singleTitle.trim(),
        openings: singleOpenings || 1,
        minExp: singleMinExp,
        maxExp: singleMaxExp,
        minCtc: minCtcNum,
        maxCtc: maxCtcNum,
        currency: "INR",
        location: singleLocation.trim() || undefined,
        workMode: singleWorkMode,
        skills: singleSkills,
        description: singleDescription.trim() || undefined,
        feePercentage,
        guaranteeDays,
        slaTargetHours,
      };

      const res = await fetch("/api/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to launch mandate.");

      // Redirect directly to the newly launched mandate workspace!
      router.push(`/cockpit/mandates/${data.mandate.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to launch mandate.");
      setIsSubmitting(false);
    }
  };

  // Launch Batch Mandates (with error auto-scroll)
  const handleLaunchBatch = async () => {
    const validPositions = batchRows.filter((r) => r.title.trim().length > 0);
    if (validPositions.length === 0) {
      setErrorMsg("Please add at least one role with a title in the spreadsheet grid.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMsg("Please enter or select the Client Company Name below.");
      setCompanyInputError(true);
      companyInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      companyInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        companyName: companyName.trim(),
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        feePercentage,
        guaranteeDays,
        slaTargetHours,
        positions: validPositions.map((p) => ({
          title: p.title.trim(),
          openings: p.openings || 1,
          minExp: p.minExp,
          maxExp: p.maxExp,
          minCtc: p.minCtc,
          maxCtc: p.maxCtc,
          location: p.location.trim() || undefined,
          workMode: p.workMode,
          skills: p.skills,
          description: p.description.trim() || undefined,
        })),
      };

      const res = await fetch("/api/mandates/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to launch batch mandates.");

      router.push(`/cockpit?batchSuccess=${encodeURIComponent(data.count)}&client=${encodeURIComponent(companyName)}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to launch batch mandates.");
      setIsSubmitting(false);
    }
  };

  const totalBatchHeadcount = batchRows.reduce((acc, r) => acc + (r.openings || 1), 0);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-28">
      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#d3dbed] px-6 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/cockpit"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cockpit</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h1 className="text-sm font-bold text-slate-900">New Search Mandate</h1>
            </div>

            {/* Template Selector (Inspired by Zoho Pic 3 & 4) */}
            {activeTrack === "single" && (
              <div ref={templateMenuRef} className="relative ml-2">
                <button
                  type="button"
                  onClick={() => setTemplateDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Choose Role Template</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {templateDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-72 bg-white border border-[#d3dbed] rounded-xl shadow-lg z-30 p-1 text-xs max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                      Standard Agency Archetypes
                    </div>
                    {AGENCY_ROLE_TEMPLATES.map((tmpl, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="font-bold text-slate-900">{tmpl.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {tmpl.minExp}-{tmpl.maxExp}y exp • ₹{tmpl.minCtc}-{tmpl.maxCtc} LPA • {tmpl.workMode}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Segmented Track Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTrack("single")}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTrack === "single"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Single Role (Smart JD Drop)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTrack("batch")}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTrack === "batch"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-Position (Spreadsheet Grid)</span>
              {batchRows.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full font-bold">
                  {batchRows.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-800 text-sm font-bold ml-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CONTENT HERO (TOP)                                                */}
        {/* ========================================================================= */}

        {/* TRACK 1: SMART JD & WHATSAPP DROP */}
        {activeTrack === "single" && (
          <div className="space-y-6">
            {/* The Smart Dropzone & Brief Box */}
            <section className="bg-white rounded-2xl border border-[#d3dbed] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Smart JD & Verbal Brief Drop
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  Botspring AI Synthesizer
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Paste the client’s WhatsApp brief, forward an email snippet, or drop their PDF/Word document.
                Botspring AI auto-fills role title, headcount, CTC brackets, and companion tech stack instantly.
              </p>

              <div className="relative">
                <textarea
                  rows={4}
                  value={jdRawInput}
                  onChange={(e) => setJdRawInput(e.target.value)}
                  placeholder="Paste WhatsApp message or JD here... (e.g. 'Looking for 2 Senior React devs for Swiggy, 4-6 yrs exp, 25-30 LPA, Gurgaon hybrid, immediate joiners')"
                  className="w-full p-3.5 text-xs bg-slate-50/40 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                <div className="flex items-center space-x-3">
                  {/* File Upload Button */}
                  <label className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                    <UploadCloud className="w-4 h-4 text-slate-500" />
                    <span>Upload JD Document (.pdf / .docx)</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleParseSingleJd(undefined, f);
                      }}
                    />
                  </label>

                  {/* Escape Hatch: Manual Entry */}
                  {!isSingleDetailsRevealed && (
                    <button
                      type="button"
                      onClick={() => setIsSingleDetailsRevealed(true)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline transition-colors cursor-pointer"
                    >
                      Don&apos;t have a JD document? Type details manually →
                    </button>
                  )}
                </div>

                {/* Parse Button */}
                <button
                  type="button"
                  disabled={isParsingJd || !jdRawInput.trim()}
                  onClick={() => handleParseSingleJd()}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {isParsingJd ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Extract & Populate Card</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* PROGRESSIVE DISCLOSURE: Pre-filled Review Card & Client Terms */}
            {isSingleDetailsRevealed && (
              <div ref={reviewCardRef} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <section className="bg-white rounded-2xl border border-[#d3dbed] p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Role Parameters & Review Card
                      </h3>
                    </div>
                    {isParsedSingle && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI Synthesized</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Role Title */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Role Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={singleTitle}
                        onChange={(e) => setSingleTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer"
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>

                    {/* Openings Count */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Number of Openings (Headcount)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={singleOpenings}
                          onChange={(e) => setSingleOpenings(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-24 px-3 py-2 text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white"
                        />
                        <span className="text-xs text-slate-500">
                          {singleOpenings === 1 ? "hire needed" : "hires needed"}
                        </span>
                      </div>
                    </div>

                    {/* Experience Band */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Experience Band (Years)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={singleMinExp}
                          onChange={(e) => setSingleMinExp(parseInt(e.target.value, 10) || 0)}
                          className="w-16 px-2 py-1.5 text-xs text-center font-bold bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={singleMaxExp}
                          onChange={(e) => setSingleMaxExp(parseInt(e.target.value, 10) || 0)}
                          className="w-16 px-2 py-1.5 text-xs text-center font-bold bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                        <span className="text-xs text-slate-500">years</span>
                      </div>
                    </div>

                    {/* CTC Bracket */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Annual CTC Bracket (LPA)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.5"
                          value={singleMinCtc}
                          onChange={(e) => setSingleMinCtc(e.target.value)}
                          placeholder="Min (e.g. 20)"
                          className="w-24 px-2 py-1.5 text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="number"
                          step="0.5"
                          value={singleMaxCtc}
                          onChange={(e) => setSingleMaxCtc(e.target.value)}
                          placeholder="Max (e.g. 30)"
                          className="w-24 px-2 py-1.5 text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                        <span className="text-xs text-slate-500">LPA</span>
                      </div>
                    </div>

                    {/* Work Mode & Location */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Location & Work Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={singleWorkMode}
                          onChange={(e) => setSingleWorkMode(e.target.value as any)}
                          className="px-2 py-1.5 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="HYBRID">Hybrid</option>
                          <option value="REMOTE">Remote</option>
                          <option value="ONSITE">Onsite</option>
                        </select>
                        <input
                          type="text"
                          value={singleLocation}
                          onChange={(e) => setSingleLocation(e.target.value)}
                          placeholder="e.g. Bengaluru"
                          className="px-2 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    {/* Key Skills */}
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Essential Skills & Companion Tech Stack (Used for Matching %)
                        </label>
                        <span className="text-[10px] text-slate-400">Press Enter or Comma to add tag</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50/40 border border-slate-200 rounded-xl min-h-[42px]">
                        {singleSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                          >
                            <span>{s}</span>
                            <button
                              type="button"
                              onClick={() => setSingleSkills(singleSkills.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={singleSkillInput}
                          onChange={(e) => setSingleSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const val = singleSkillInput.trim();
                              if (val && !singleSkills.includes(val)) {
                                setSingleSkills([...singleSkills, val]);
                                setSingleSkillInput("");
                              }
                            }
                          }}
                          placeholder="Type skill & press Enter..."
                          className="text-xs bg-transparent border-none focus:outline-hidden text-slate-900 placeholder:text-slate-400 px-1 py-0.5 grow min-w-[140px]"
                        />
                      </div>
                    </div>

                    {/* Full JD / Notes */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full JD Text / Additional Sourcing Notes
                      </label>
                      <textarea
                        rows={3}
                        value={singleDescription}
                        onChange={(e) => setSingleDescription(e.target.value)}
                        placeholder="Clean description text or client notes..."
                        className="w-full p-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* TRACK 2: MULTI-POSITION SPREADSHEET GRID */}
        {activeTrack === "batch" && (
          <div className="space-y-6">
            {/* INITIAL STATE (0 roles): 33 - 33 - 33 Intake Strip */}
            {batchRows.length === 0 ? (
              <section className="bg-white rounded-2xl border border-[#d3dbed] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Batch Position Intake
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Choose how you want to add batch roles
                  </span>
                </div>

                {/* 33 - 33 - 33 Balanced Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1 (33%): Upload Spreadsheet */}
                  <div className="border border-slate-200 hover:border-slate-400 bg-slate-50/50 rounded-2xl p-5 flex flex-col justify-between transition-colors">
                    <div>
                      <div className="flex items-center space-x-2 mb-2 text-slate-900 font-bold text-xs">
                        <UploadCloud className="w-4 h-4 text-blue-600" />
                        <span>Upload Spreadsheet</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                        Drop an <strong>.xlsx</strong> or <strong>.csv</strong> file. Role titles, openings, CTC, and location are auto-detected.
                      </p>
                    </div>

                    <label className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold text-center cursor-pointer transition-colors block shadow-2xs">
                      <span>Choose .xlsx / .csv File</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSpreadsheetUpload(f);
                        }}
                      />
                    </label>
                  </div>

                  {/* Option 2 (33%): Paste Copied Rows */}
                  <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2 text-slate-900 font-bold text-xs">
                        <ClipboardPaste className="w-4 h-4 text-emerald-600" />
                        <span>Paste Copied Rows</span>
                      </div>
                      <textarea
                        rows={3}
                        value={inlinePasteText}
                        onChange={(e) => setInlinePasteText(e.target.value)}
                        placeholder="Copy rows from Excel with headers & paste here..."
                        className="w-full p-2 text-[11px] font-mono bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 mb-2"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isParsingInlinePaste || !inlinePasteText.trim()}
                      onClick={handleInlinePasteSubmit}
                      className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-bold text-center cursor-pointer transition-colors shadow-2xs"
                    >
                      {isParsingInlinePaste ? "Parsing..." : "Parse & Add to Grid"}
                    </button>
                  </div>

                  {/* Option 3 (33%): Manual Table Entry */}
                  <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2 text-slate-900 font-bold text-xs">
                        <Edit3 className="w-4 h-4 text-purple-600" />
                        <span>Manual Table Entry</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                        Start directly with an empty, keyboard-friendly spreadsheet table to type roles and openings manually.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBatchRow}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center cursor-pointer transition-colors shadow-xs"
                    >
                      + Start Blank Grid
                    </button>
                  </div>
                </div>

                {isParsingFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Processing spreadsheet file...</span>
                  </div>
                )}
              </section>
            ) : (
              /* COLLAPSED STATE (Roles Loaded): Slim Top Action Toolbar */
              <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#d3dbed] shadow-xs flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{batchRows.length} Roles Loaded</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    Total Headcount: <strong>{totalBatchHeadcount} Vacancies</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddBatchRow}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position Row</span>
                  </button>
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import More</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSpreadsheetUpload(f);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setBatchRows([])}
                    className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* High-Density Spreadsheet Grid Table (Only visible when rows exist) */}
            {batchRows.length > 0 && (
              <section className="bg-white rounded-2xl border border-[#d3dbed] p-5 shadow-xs space-y-4 animate-in fade-in">
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Role Title *</th>
                        <th className="py-2.5 px-3 w-20 text-center">Openings</th>
                        <th className="py-2.5 px-3 w-32">Exp (Min-Max)</th>
                        <th className="py-2.5 px-3 w-32">Budget / CTC</th>
                        <th className="py-2.5 px-3 w-32">Location</th>
                        <th className="py-2.5 px-3 w-28">Mode</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Skills</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchRows.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={r.title}
                              onChange={(e) => handleUpdateBatchRow(r.id, { title: e.target.value })}
                              placeholder="e.g. Senior Frontend Dev"
                              className="w-full px-2 py-1 font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md text-xs focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={r.openings}
                              onChange={(e) =>
                                handleUpdateBatchRow(r.id, {
                                  openings: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="w-14 px-1 py-1 text-center font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md text-xs focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                value={r.minExp}
                                onChange={(e) =>
                                  handleUpdateBatchRow(r.id, { minExp: parseInt(e.target.value, 10) || 0 })
                                }
                                className="w-10 px-1 py-1 text-center font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md text-xs focus:outline-hidden"
                              />
                              <span className="text-slate-400">-</span>
                              <input
                                type="number"
                                min="0"
                                value={r.maxExp}
                                onChange={(e) =>
                                  handleUpdateBatchRow(r.id, { maxExp: parseInt(e.target.value, 10) || 0 })
                                }
                                className="w-10 px-1 py-1 text-center font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md text-xs focus:outline-hidden"
                              />
                              <span className="text-[10px] text-slate-400">y</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={r.ctcDisplay}
                              onChange={(e) => handleUpdateBatchRow(r.id, { ctcDisplay: e.target.value })}
                              placeholder="e.g. 20-30 LPA"
                              className="w-full px-2 py-1 font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md text-xs focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={r.location}
                              onChange={(e) => handleUpdateBatchRow(r.id, { location: e.target.value })}
                              placeholder="City / Region"
                              className="w-full px-2 py-1 text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md text-xs focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={r.workMode}
                              onChange={(e) => handleUpdateBatchRow(r.id, { workMode: e.target.value as any })}
                              className="w-full px-1.5 py-1 text-xs font-semibold bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md focus:outline-hidden"
                            >
                              <option value="HYBRID">Hybrid</option>
                              <option value="REMOTE">Remote</option>
                              <option value="ONSITE">Onsite</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={r.skillsRaw || r.skills.join(", ")}
                              onChange={(e) => handleUpdateBatchRow(r.id, { skillsRaw: e.target.value })}
                              placeholder="Comma-separated"
                              className="w-full px-2 py-1 text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-md text-xs focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteBatchRow(r.id)}
                              className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CLIENT & COMMERCIAL TERMS (AT THE BOTTOM, BEFORE POSTING)        */}
        {/* ========================================================================= */}
        {/* Only rendered when details are revealed (Single) or rows exist (Batch) */}
        {((activeTrack === "single" && isSingleDetailsRevealed) ||
          (activeTrack === "batch" && batchRows.length > 0)) && (
          <section className="bg-white rounded-2xl border border-[#d3dbed] p-6 shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Client & Commercial Terms
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <span>Select an existing agency client or enter a new company name below</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Client Company Name with Autocomplete */}
              <div className="relative md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Client Company Name <span className="text-rose-500">*</span>
                  </label>
                  {selectedExistingClient ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                      Existing Client Account
                    </span>
                  ) : companyName.trim() ? (
                    <span className="text-[10px] text-slate-500 font-semibold">
                      New client will be created
                    </span>
                  ) : null}
                </div>

                <div className="relative">
                  <input
                    ref={companyInputRef}
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setSelectedExistingClient(null);
                      setCompanyInputError(false);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="e.g. Razorpay, Zepto, Swiggy"
                    className={`w-full px-3 py-2 text-xs bg-slate-50/50 border rounded-lg text-slate-900 font-bold placeholder:text-slate-400 focus:outline-hidden transition-all ${
                      companyInputError
                        ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                        : "border-slate-200 focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    }`}
                  />
                  {isSearchingClient && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-3 top-2.5" />
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showSuggestions && clientSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#d3dbed] rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {clientSuggestions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectClient(c)}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {c.industry || "General"} {c.location ? `• ${c.location}` : ""}
                          </div>
                        </div>
                        {c.primaryContact && (
                          <div className="text-right text-[10px] text-slate-500">
                            SPOC: {c.primaryContact.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hiring Lead / SPOC Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person (Hiring Lead)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Email <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="hiring@company.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Commercial Terms Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Agency Placement Fee
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="50"
                    value={feePercentage}
                    onChange={(e) => setFeePercentage(parseFloat(e.target.value) || 8.33)}
                    className="w-20 px-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                  <span className="text-slate-600 font-medium">% of CTC (8.33% = 1 Month Gross)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Free Replacement Guarantee
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={guaranteeDays}
                    onChange={(e) => setGuaranteeDays(parseInt(e.target.value, 10) || 90)}
                    className="w-20 px-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                  <span className="text-slate-600 font-medium">Days (Standard: 90 Days)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  First Shortlist SLA Target
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="12"
                    max="336"
                    value={slaTargetHours}
                    onChange={(e) => setSlaTargetHours(parseInt(e.target.value, 10) || 72)}
                    className="w-20 px-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                  <span className="text-slate-600 font-medium">Hours (Standard: 72 Hours)</span>
                </div>
              </div>
            </div>

            {/* Bottom Launch Action Bar */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-100 flex-wrap gap-4">
              <div className="text-xs text-slate-500 max-w-lg">
                {activeTrack === "single" ? (
                  <span>
                    Launching activates search mode for &quot;<strong>{singleTitle || "Role"}</strong>&quot; under &quot;<strong>{companyName || "Client"}</strong>&quot;, unlocking instant candidate sourcing and Silver Medalist matching.
                  </span>
                ) : (
                  <span>
                    Ready to launch <strong>{batchRows.length} search mandates</strong> ({totalBatchHeadcount} total vacancies) under &quot;<strong>{companyName || "Client"}</strong>&quot;.
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={isSubmitting || (activeTrack === "batch" && batchRows.length === 0)}
                onClick={activeTrack === "single" ? handleLaunchSingle : handleLaunchBatch}
                className="inline-flex items-center space-x-2 px-7 py-3 bg-[#FFD400] hover:bg-[#ebc400] text-slate-900 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Launching Search Mandate...</span>
                  </>
                ) : activeTrack === "single" ? (
                  <>
                    <span>Launch Search Mandate</span>
                    <Sparkles className="w-4 h-4 text-slate-900" />
                  </>
                ) : (
                  <>
                    <span>Launch {batchRows.length} Search Mandates</span>
                    <Sparkles className="w-4 h-4 text-slate-900" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
