"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  User,
  Users,
  Search,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Briefcase,
  MapPin,
  Eye,
  ShieldCheck,
  Building2,
  Check,
  LogOut,
  ChevronRight,
  Filter,
  Lock,
  Award,
  Zap,
  RotateCcw,
  MessageSquare,
  Calendar,
  PhoneCall,
  Video,
  Send,
  ShieldAlert,
  FileCheck,
  Copy,
  AlertTriangle,
  Receipt,
  DollarSign,
  Shield,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { UserSandboxToggle, UserSandboxBanner } from "@/components/UserSandboxToggle";

interface CandidateRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
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
  source: string;
  resumeUrl?: string | null;
  qualification?: string | null;
  isSilverMedalist: boolean;
  silverMedalistReason: string | null;
  lastCallDisposition?: string | null;
  lastCallNotes?: string | null;
  lastCallAt?: string | null;
  nextCallbackAt?: string | null;
  readyToRelocate?: string | null;
  relevantExpYears?: number | null;
  reasonForLeaving?: string | null;
  offerInHand?: string | null;
  createdAt: string;
  callLogs?: Array<{
    id: string;
    disposition: string;
    notes?: string | null;
    callbackAt?: string | null;
    calledAt: string;
    recruiter?: { id: string; name: string; email: string } | null;
    mandate?: { id: string; title: string; client: { name: string } } | null;
  }>;
  submissions: Array<{
    id: string;
    stage: string;
    clientDecision?: string | null;
    clientQuestionText?: string | null;
    clientFeedbackNotes?: string | null;
    preferredInterviewTimes?: string | null;
    rejectionReason?: string | null;
    partnerSourcerName?: string | null;
    partnerSourcerEmail?: string | null;
    splitFeePercentage?: number | null;
    splitPayoutEstimated?: number | null;
    offeredCtc?: number | null;
    offeredJoiningDate?: string | null;
    resignationDate?: string | null;
    resignationConfirmed?: boolean;
    resignationLetterDraft?: string | null;
    counterOfferRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    counterOfferRiskReason?: string | null;
    lastRetentionPulseAt?: string | null;
    actualJoiningDate?: string | null;
    probationDays?: number;
    probationEndDate?: string | null;
    probationStatus?: "ACTIVE_TRACKING" | "CLEARED_SUCCESSFUL" | "EARLY_EXIT_REPLACEMENT";
    mandate: {
      id: string;
      title: string;
      feePercentage: number;
      guaranteeDays: number;
      client: { name: string };
    };
  }>;
}

const CALL_DISPOSITIONS = [
  { value: "CONNECTED_INTERESTED", label: "🟢 Connected — Interested & Profile Matched", badge: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { value: "CONNECTED_CALLBACK", label: "🟡 Connected — Call Back Requested", badge: "bg-amber-100 text-amber-900 border-amber-300" },
  { value: "CONNECTED_CTC_MISMATCH", label: "🟠 Connected — CTC / Budget Mismatch", badge: "bg-orange-100 text-orange-900 border-orange-300" },
  { value: "CONNECTED_NOTICE_MISMATCH", label: "🟠 Connected — Notice Period Too Long", badge: "bg-orange-100 text-orange-900 border-orange-300" },
  { value: "CONNECTED_NOT_INTERESTED", label: "🔴 Connected — Not Interested / Declined", badge: "bg-rose-100 text-rose-900 border-rose-300" },
  { value: "RINGING_NO_ANSWER", label: "⚪ Ringing / No Answer", badge: "bg-slate-100 text-slate-800 border-slate-300" },
  { value: "UNREACHABLE_BUSY", label: "⚪ Switched Off / Busy / Out of Coverage", badge: "bg-slate-100 text-slate-800 border-slate-300" },
];

const getCallbackBadge = (callbackAtStr?: string | null) => {
  if (!callbackAtStr) return null;
  try {
    const cbDate = new Date(callbackAtStr);
    const now = new Date();
    const isOverdue = cbDate.getTime() < now.getTime();
    const isToday = cbDate.toDateString() === now.toDateString();
    const timeStr = cbDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    if (isOverdue) {
      return {
        text: `⚠️ Overdue (${isToday ? timeStr : `${cbDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`})`,
        className: "bg-rose-100 text-rose-800 border-rose-300 font-extrabold",
      };
    }
    if (isToday) {
      return {
        text: `⏰ Call Today @ ${timeStr}`,
        className: "bg-amber-100 text-amber-900 border-amber-400 font-extrabold",
      };
    }
    return {
      text: `📅 ${cbDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} @ ${timeStr}`,
      className: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
    };
  } catch (_) {
    return null;
  }
};

interface ActiveMandateOption {
  id: string;
  title: string;
  client: { name: string };
}

export default function CandidateBankPage() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [mandates, setMandates] = useState<ActiveMandateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [silverFilter, setSilverFilter] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState(false);
  const [probationFilter, setProbationFilter] = useState(false);

  // Unified Batch Ingestion Modal State (RC-02)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [selectedMandateId, setSelectedMandateId] = useState<string>("");
  const [savingBatch, setSavingBatch] = useState(false);
  const [parseProgress, setParseProgress] = useState({
    current: 0,
    total: 0,
    currentFileName: "",
    percent: 0,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Silver Medalist Tagging Modal State (RC-07)
  const [silverModalCandidate, setSilverModalCandidate] = useState<CandidateRecord | null>(null);
  const [silverReason, setSilverReason] = useState("");
  const [updatingSilver, setUpdatingSilver] = useState(false);

  // 1-Click Redeployment Modal State (RC-07)
  const [redeployCandidate, setRedeployCandidate] = useState<CandidateRecord | null>(null);
  const [redeployMandateId, setRedeployMandateId] = useState("");
  const [redeployNotes, setRedeployNotes] = useState("");
  const [redeploying, setRedeploying] = useState(false);

  // Multi-Channel Interview Scheduling Modal State (RC-04)
  const [scheduleModalCandidate, setScheduleModalCandidate] = useState<CandidateRecord | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: "",
    durationMinutes: 60,
    interviewType: "TECHNICAL_ROUND",
    meetingLink: "https://meet.google.com/xyz-rec-live",
    panelistNames: "Tech Lead, Engineering Manager",
    sendWhatsApp: true,
    sendEmail: true,
    instructions: "Please join with webcam enabled in a quiet room.",
  });
  const [scheduling, setScheduling] = useState(false);

  // Post-Interview Debrief Modal State (RC-05)
  const [debriefCandidate, setDebriefCandidate] = useState<CandidateRecord | null>(null);
  const [debriefForm, setDebriefForm] = useState({
    debriefNotes: "",
    candidateSentiment: "HIGH_ENTHUSIASM",
    salaryAlignmentNotes: "Expected compensation is firmly within agreed band.",
    noticePeriodConfirmed: 30,
    nextAction: "MOVE_TO_OFFER",
  });
  const [savingDebrief, setSavingDebrief] = useState(false);

  // Offer Lockdown & Resignation Playbook Modal State (RC-06)
  const [offerModalCandidate, setOfferModalCandidate] = useState<CandidateRecord | null>(null);
  const [offerForm, setOfferForm] = useState({
    offeredCtc: "",
    offeredJoiningDate: "",
    resignationDate: "",
    currentManagerName: "Reporting Manager",
    noticePeriodDays: 30,
    customResignationNotes: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [lockingOffer, setLockingOffer] = useState(false);

  // Retention Pulse Check Modal State (RC-06)
  const [pulseModalCandidate, setPulseModalCandidate] = useState<CandidateRecord | null>(null);
  const [pulseForm, setPulseForm] = useState({
    resignationConfirmed: true,
    counterOfferReceived: false,
    counterOfferAmount: "",
    counterOfferRiskLevel: "LOW" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    counterOfferRiskReason: "Candidate completed project handover docs and confirmed Day 1 joining.",
    candidateSentimentScore: 5,
    recruiterNotes: "Candidate in high spirits, no retention attempts made by manager.",
  });
  const [savingPulse, setSavingPulse] = useState(false);

  // Day-1 Physical Joining & Invoicing Modal State (PL-01, PL-02, RC-07)
  const [joiningCandidate, setJoiningCandidate] = useState<CandidateRecord | null>(null);
  const [joiningForm, setJoiningForm] = useState({
    actualJoiningDate: new Date().toISOString().slice(0, 10),
    agreedCtc: "",
    clientBillingName: "",
    clientBillingEmail: "billing@client.com",
    clientGstin: "27AABCU9603R1ZM",
    paymentTermsDays: 30,
  });
  const [confirmingPlacement, setConfirmingPlacement] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any | null>(null);

  // Early Exit $0 Replacement Modal State (RC-07)
  const [exitCandidate, setExitCandidate] = useState<CandidateRecord | null>(null);
  const [exitReason, setExitReason] = useState("Candidate resigned during probation to pursue alternative opportunity.");
  const [triggeringReplacement, setTriggeringReplacement] = useState(false);

  // Candidate Detail & Call Screening Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [callDisposition, setCallDisposition] = useState<string>("");
  const [callbackDate, setCallbackDate] = useState<string>("");
  const [callbackTime, setCallbackTime] = useState<string>("12:00");
  const [callMandateId, setCallMandateId] = useState<string>("");
  const [callNotes, setCallNotes] = useState<string>("");
  const [readyToRelocate, setReadyToRelocate] = useState<string>("Yes");
  const [relevantExpYears, setRelevantExpYears] = useState<string>("");
  const [currentSalary, setCurrentSalary] = useState<string>("");
  const [expectedSalary, setExpectedSalary] = useState<string>("");
  const [noticePeriod, setNoticePeriod] = useState<string>("");
  const [reasonForLeaving, setReasonForLeaving] = useState<string>("");
  const [offerInHand, setOfferInHand] = useState<string>("No");
  const [callValidationError, setCallValidationError] = useState<string | null>(null);
  const [loggingCall, setLoggingCall] = useState(false);

  // Backward compatibility previewCandidate state
  const [previewCandidate, setPreviewCandidate] = useState<CandidateRecord | null>(null);

  const handleOpenCandidateModal = (cand: CandidateRecord) => {
    setSelectedCandidate(cand);
    setCallDisposition(cand.lastCallDisposition || "");
    setCallNotes("");
    setCallValidationError(null);
    setReadyToRelocate(cand.readyToRelocate || "Yes");
    setRelevantExpYears(
      cand.relevantExpYears !== undefined && cand.relevantExpYears !== null
        ? String(cand.relevantExpYears)
        : cand.totalExpYears
        ? String(cand.totalExpYears)
        : ""
    );
    setCurrentSalary(cand.currentCtc ? `${(cand.currentCtc / 100000).toFixed(1)} LPA` : "");
    setExpectedSalary(cand.expectedCtc ? `${(cand.expectedCtc / 100000).toFixed(1)} LPA` : "");
    setNoticePeriod(cand.noticePeriodDays ? `${cand.noticePeriodDays} Days` : "30 Days");
    setReasonForLeaving(cand.reasonForLeaving || "");
    setOfferInHand(cand.offerInHand || "No");
    setCallMandateId(cand.submissions.length > 0 ? cand.submissions[0].mandate.id : "");

    if (cand.nextCallbackAt) {
      try {
        const d = new Date(cand.nextCallbackAt);
        setCallbackDate(d.toISOString().split("T")[0]);
        setCallbackTime(d.toTimeString().slice(0, 5));
      } catch (_) {
        setCallbackDate(new Date().toISOString().split("T")[0]);
        setCallbackTime("12:00");
      }
    } else {
      setCallbackDate(new Date().toISOString().split("T")[0]);
      setCallbackTime("12:00");
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    if (!callDisposition || callDisposition.trim() === "") {
      setCallValidationError("Please select a Call Outcome Disposition before saving.");
      return;
    }

    let callbackAtPayload: string | null = null;
    if (callDisposition === "CONNECTED_CALLBACK") {
      if (!callbackDate || !callbackTime) {
        setCallValidationError("Please specify both a Date and Time for the scheduled call back.");
        return;
      }
      callbackAtPayload = new Date(`${callbackDate}T${callbackTime}:00`).toISOString();
    }

    setLoggingCall(true);
    setCallValidationError(null);

    try {
      const res = await fetch(`/api/candidates/${selectedCandidate.id}/call-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposition: callDisposition,
          notes: callNotes,
          callbackAt: callbackAtPayload,
          mandateId: callMandateId || undefined,
          readyToRelocate,
          relevantExpYears,
          currentSalary,
          expectedSalary,
          noticePeriod,
          reasonForLeaving,
          offerInHand,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log call outcome");
      }

      setSuccessMessage(`Call outcome logged: ${callDisposition.replace(/_/g, " ")}`);
      setCallNotes("");
      setCallDisposition(callDisposition);

      const newLog = {
        id: data.callLog.id,
        disposition: callDisposition,
        notes: callNotes,
        callbackAt: callbackAtPayload,
        calledAt: new Date().toISOString(),
        recruiter: {
          id: session?.user?.id || "",
          name: session?.user?.name || "You",
          email: session?.user?.email || "",
        },
        mandate: callMandateId ? mandates.find((m) => m.id === callMandateId) || null : null,
      };

      const updatedCandidateObj: CandidateRecord = {
        ...selectedCandidate,
        lastCallDisposition: callDisposition,
        lastCallNotes: callNotes,
        lastCallAt: new Date().toISOString(),
        nextCallbackAt: callbackAtPayload,
        readyToRelocate,
        relevantExpYears: relevantExpYears ? parseFloat(relevantExpYears) : null,
        reasonForLeaving,
        offerInHand,
        callLogs: [newLog, ...(selectedCandidate.callLogs || [])],
      };

      setSelectedCandidate(updatedCandidateObj);

      // Update candidate in local state list
      setCandidates((prev) =>
        prev.map((c) => (c.id === selectedCandidate.id ? updatedCandidateObj : c))
      );
    } catch (err: any) {
      console.error("Error logging call:", err);
      setCallValidationError(err.message || "Failed to save call outcome");
    } finally {
      setLoggingCall(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/candidates?query=${encodeURIComponent(searchQuery)}&silver=${silverFilter}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          try {
            const data = JSON.parse(text);
            setCandidates(data.candidates || []);
          } catch (e) {
            console.error("Candidates JSON parse error:", e);
          }
        }
      }

      // Fetch active mandates for submission dropdown
      const mRes = await fetch("/api/mandates?scope=all");
      if (mRes.ok) {
        const mText = await mRes.text();
        if (mText && mText.trim()) {
          try {
            const mData = JSON.parse(mText);
            setMandates(mData.mandates || []);
            if (mData.mandates?.length > 0 && !redeployMandateId) {
              setRedeployMandateId(mData.mandates[0].id);
            }
          } catch (e) {
            console.error("Mandates JSON parse error:", e);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load candidates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [searchQuery, silverFilter]);

  // Filter candidates based on active view tab
  const displayedCandidates = candidates.filter((c) => {
    const stage = c.submissions[0]?.stage;
    if (noticeFilter) {
      return stage === "OFFER_ISSUED" || stage === "OFFER_ACCEPTED" || stage === "NOTICE_PERIOD_ACTIVE";
    }
    if (probationFilter) {
      return stage === "JOINED_DAY_1_ACTIVE";
    }
    return true;
  });

  // Handle Resume File Selection & Multi-Resume AI Parsing (Batch up to 5 files, 10MB limit)
  const handleMultiFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);

    if (fileList.length > 5) {
      setParseError("Maximum 5 resumes can be uploaded in one go. Please select up to 5 files.");
      return;
    }

    const oversized = fileList.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setParseError(`File '${oversized.name}' exceeds the 10MB size limit (${(oversized.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setUploadFiles(fileList);
    setParsing(true);
    setParseError(null);
    setBatchResults([]);
    setParseProgress({
      current: 1,
      total: fileList.length,
      currentFileName: fileList[0].name,
      percent: 5,
    });

    const accumulatedResults: any[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setParseProgress({
          current: i + 1,
          total: fileList.length,
          currentFileName: file.name,
          percent: Math.max(5, Math.round((i / fileList.length) * 100)),
        });

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/candidates/parse", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.results && data.results[0]) {
            accumulatedResults.push(data.results[0]);
          } else if (res.ok && data.parsed) {
            accumulatedResults.push({
              fileName: file.name,
              success: true,
              parsed: data.parsed,
              resumeUrl: data.resumeUrl,
              rawResumeText: data.rawResumeText,
            });
          } else {
            accumulatedResults.push({
              fileName: file.name,
              success: false,
              error: data.error || "Failed to extract entities",
            });
          }
        } catch (itemErr: any) {
          accumulatedResults.push({
            fileName: file.name,
            success: false,
            error: itemErr.message || "Network error while parsing",
          });
        }

        setBatchResults([...accumulatedResults]);
        setParseProgress({
          current: i + 1,
          total: fileList.length,
          currentFileName: file.name,
          percent: Math.round(((i + 1) / fileList.length) * 100),
        });
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to parse resumes.");
    } finally {
      setParsing(false);
    }
  };

  // Save Batch Ingested Candidates and Optionally Attach to Selected Mandate
  const handleSaveBatchCandidates = async () => {
    if (batchResults.length === 0) return;
    setSavingBatch(true);
    setParseError(null);

    try {
      let savedCount = 0;
      let lastErrorMessage = "";

      for (const item of batchResults) {
        if (!item.success || !item.parsed) continue;
        const p = item.parsed;
        const res = await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: p.fullName || "Candidate",
            email: p.email || "",
            phone: p.phone || "",
            currentCompany: p.currentCompany || "",
            currentTitle: p.currentTitle || "",
            totalExpYears: p.totalExpYears || 0,
            currentCtc: p.currentCtc ? String(p.currentCtc) : "",
            expectedCtc: p.expectedCtc ? String(p.expectedCtc) : "",
            currency: p.currency || "INR",
            noticePeriodDays: p.noticePeriodDays || 30,
            location: p.location || "",
            skills: Array.isArray(p.skills) ? p.skills : (typeof p.skills === "string" ? p.skills.split(",") : []),
            summary: p.summary || "",
            rawResumeText: item.rawResumeText || "",
            resumeUrl: item.resumeUrl || null,
            qualification: p.qualification || "",
            mandateId: selectedMandateId || undefined,
          }),
        });

        if (res.ok) {
          savedCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastErrorMessage = errData.error || "Failed to save candidate.";
        }
      }

      if (savedCount > 0) {
        const mandateObj = selectedMandateId ? mandates.find((m) => m.id === selectedMandateId) : null;
        setSuccessMessage(
          `Successfully saved & ingested ${savedCount} candidate profile(s) into the ${
            mandateObj ? `Talent Bank attached to '${mandateObj.title}'` : "General Talent Bank"
          }!`
        );
        setIsImportModalOpen(false);
        setUploadFiles([]);
        setBatchResults([]);
        fetchCandidates();
      } else {
        throw new Error(lastErrorMessage || "Failed to save parsed candidates.");
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to save ingested candidates.");
    } finally {
      setSavingBatch(false);
    }
  };

  // Toggle Silver Medalist Tag (RC-07)
  const handleToggleSilver = async (candidate: CandidateRecord) => {
    const nextStatus = !candidate.isSilverMedalist;
    if (nextStatus) {
      setSilverModalCandidate(candidate);
      setSilverReason(candidate.silverMedalistReason || "Final round finalist pre-vetted in client interview rounds.");
    } else {
      try {
        const res = await fetch(`/api/candidates/${candidate.id}/silver-medalist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSilverMedalist: false }),
        });
        if (res.ok) {
          setSuccessMessage(`Candidate '${candidate.fullName}' removed from Silver Medalist Vault.`);
          fetchCandidates();
        }
      } catch (err) {
        console.error("Error untagging silver medalist:", err);
      }
    }
  };

  const handleSaveSilverModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!silverModalCandidate) return;
    setUpdatingSilver(true);

    try {
      const res = await fetch(`/api/candidates/${silverModalCandidate.id}/silver-medalist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSilverMedalist: true, reason: silverReason }),
      });

      if (res.ok) {
        setSuccessMessage(`Candidate '${silverModalCandidate.fullName}' added to Silver Medalist Recycling Vault!`);
        setSilverModalCandidate(null);
        fetchCandidates();
      }
    } catch (err) {
      console.error("Error updating silver medalist:", err);
    } finally {
      setUpdatingSilver(false);
    }
  };

  // 1-Click Redeployment to Active Mandate (RC-07)
  const handleRedeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeployCandidate || !redeployMandateId) return;
    setRedeploying(true);

    try {
      const res = await fetch(`/api/candidates/${redeployCandidate.id}/redeploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMandateId: redeployMandateId,
          recruiterNotes: redeployNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to redeploy candidate.");
      }

      setSuccessMessage(`⚡ '${redeployCandidate.fullName}' instantly redeployed to '${json.mandate.title}' in stage SCREENED QUALIFIED!`);
      setRedeployCandidate(null);
      setRedeployNotes("");
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Redeployment failed.");
    } finally {
      setRedeploying(false);
    }
  };

  // Open Schedule Interview Modal (RC-04)
  const handleOpenScheduleModal = (candidate: CandidateRecord) => {
    setScheduleModalCandidate(candidate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setScheduleForm({
      scheduledAt: localIso,
      durationMinutes: 60,
      interviewType: "TECHNICAL_ROUND",
      meetingLink: "https://meet.google.com/xyz-rec-live",
      panelistNames: "Tech Lead, Engineering Director",
      sendWhatsApp: true,
      sendEmail: true,
      instructions: "Please test camera/mic and join 5 minutes prior.",
    });
  };

  // Submit Schedule Interview (RC-04)
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalCandidate || scheduleModalCandidate.submissions.length === 0) return;
    setScheduling(true);

    try {
      const primarySub = scheduleModalCandidate.submissions[0];
      const res = await fetch("/api/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: primarySub.id,
          scheduledAt: scheduleForm.scheduledAt,
          durationMinutes: scheduleForm.durationMinutes,
          interviewType: scheduleForm.interviewType,
          meetingLink: scheduleForm.meetingLink,
          panelistNames: scheduleForm.panelistNames.split(",").map((s) => s.trim()).filter(Boolean),
          sendWhatsApp: scheduleForm.sendWhatsApp,
          sendEmail: scheduleForm.sendEmail,
          instructions: scheduleForm.instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule interview.");
      }

      setSuccessMessage(
        `📅 Interview confirmed for '${scheduleModalCandidate.fullName}'. WhatsApp briefing & calendar invites dispatched!`
      );
      setScheduleModalCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Scheduling failed.");
    } finally {
      setScheduling(false);
    }
  };

  // Open Debrief Modal (RC-05)
  const handleOpenDebriefModal = (candidate: CandidateRecord) => {
    setDebriefCandidate(candidate);
    setDebriefForm({
      debriefNotes: "Candidate demonstrated strong technical grasp, solid communication, and high cultural alignment.",
      candidateSentiment: "HIGH_ENTHUSIASM",
      salaryAlignmentNotes: "Salary expectations confirmed within client budget.",
      noticePeriodConfirmed: candidate.noticePeriodDays || 30,
      nextAction: "MOVE_TO_OFFER",
    });
  };

  // Submit Debrief (RC-05)
  const handleDebriefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debriefCandidate || debriefCandidate.submissions.length === 0) return;
    setSavingDebrief(true);

    try {
      const primarySub = debriefCandidate.submissions[0];
      const iRes = await fetch(`/api/interviews`);
      const iData = await iRes.json();
      const interview = (iData.interviews || []).find((i: any) => i.candidate?.id === debriefCandidate.id);

      if (!interview) {
        throw new Error("No active interview record found for this candidate.");
      }

      const res = await fetch(`/api/interviews/${interview.id}/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(debriefForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save debrief.");
      }

      setSuccessMessage(
        `📝 Debrief recorded for '${debriefCandidate.fullName}'. Candidate stage advanced to ${data.stage}!`
      );
      setDebriefCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to save debrief.");
    } finally {
      setSavingDebrief(false);
    }
  };

  // Open Offer Lockdown & Resignation Playbook Modal (RC-06)
  const handleOpenOfferModal = (candidate: CandidateRecord) => {
    setOfferModalCandidate(candidate);
    const sub = candidate.submissions[0];
    const defaultJoining = new Date();
    defaultJoining.setDate(defaultJoining.getDate() + (candidate.noticePeriodDays || 30));

    setOfferForm({
      offeredCtc: sub?.offeredCtc ? String(sub.offeredCtc) : candidate.expectedCtc ? String(candidate.expectedCtc) : "3200000",
      offeredJoiningDate: sub?.offeredJoiningDate ? new Date(sub.offeredJoiningDate).toISOString().slice(0, 10) : defaultJoining.toISOString().slice(0, 10),
      resignationDate: new Date().toISOString().slice(0, 10),
      currentManagerName: "Reporting Manager",
      noticePeriodDays: candidate.noticePeriodDays || 30,
      customResignationNotes: "",
    });
    setGeneratedLetter(sub?.resignationLetterDraft || null);
  };

  // Submit Pre-Offer Lockdown (RC-06)
  const handleOfferLockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModalCandidate || offerModalCandidate.submissions.length === 0) return;
    setLockingOffer(true);

    try {
      const sub = offerModalCandidate.submissions[0];
      const res = await fetch(`/api/offers/${sub.id}/pre-offer-lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredCtc: parseFloat(offerForm.offeredCtc),
          offeredJoiningDate: offerForm.offeredJoiningDate,
          resignationDate: offerForm.resignationDate,
          currentManagerName: offerForm.currentManagerName,
          noticePeriodDays: offerForm.noticePeriodDays,
          customResignationNotes: offerForm.customResignationNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to lock offer.");
      }

      setGeneratedLetter(data.resignationDraft);
      setSuccessMessage(
        `🎯 Offer locked for '${offerModalCandidate.fullName}' at ${(parseFloat(offerForm.offeredCtc) / 100000).toFixed(1)}L. Resignation draft generated!`
      );
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to lock offer.");
    } finally {
      setLockingOffer(false);
    }
  };

  // Open Retention Pulse Modal (RC-06)
  const handleOpenPulseModal = (candidate: CandidateRecord) => {
    setPulseModalCandidate(candidate);
    const sub = candidate.submissions[0];
    setPulseForm({
      resignationConfirmed: sub?.resignationConfirmed ?? true,
      counterOfferReceived: false,
      counterOfferAmount: "",
      counterOfferRiskLevel: sub?.counterOfferRiskLevel || "LOW",
      counterOfferRiskReason: sub?.counterOfferRiskReason || "Candidate completed project handover docs and confirmed Day 1 joining.",
      candidateSentimentScore: 5,
      recruiterNotes: "Candidate in high spirits, fully aligned on start date.",
    });
  };

  // Submit Retention Pulse (RC-06)
  const handlePulseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pulseModalCandidate || pulseModalCandidate.submissions.length === 0) return;
    setSavingPulse(true);

    try {
      const sub = pulseModalCandidate.submissions[0];
      const res = await fetch(`/api/offers/${sub.id}/retention-pulse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pulseForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log retention pulse.");
      }

      setSuccessMessage(
        `🛡️ Notice period check-in logged for '${pulseModalCandidate.fullName}'. Counter-offer risk: ${pulseForm.counterOfferRiskLevel}.`
      );
      setPulseModalCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to log pulse.");
    } finally {
      setSavingPulse(false);
    }
  };

  // Open Day-1 Joining & Invoicing Modal (PL-01, PL-02, RC-07)
  const handleOpenJoiningModal = (candidate: CandidateRecord) => {
    setJoiningCandidate(candidate);
    const sub = candidate.submissions[0];
    setJoiningForm({
      actualJoiningDate: new Date().toISOString().slice(0, 10),
      agreedCtc: sub?.offeredCtc ? String(sub.offeredCtc) : "3200000",
      clientBillingName: sub?.mandate?.client?.name || "Client Accounts",
      clientBillingEmail: "billing@client.com",
      clientGstin: "27AABCU9603R1ZM",
      paymentTermsDays: 30,
    });
    setGeneratedInvoice(null);
  };

  // Submit Day-1 Joining & Invoicing (PL-01, PL-02, RC-07)
  const handleConfirmJoiningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningCandidate || joiningCandidate.submissions.length === 0) return;
    setConfirmingPlacement(true);

    try {
      const sub = joiningCandidate.submissions[0];
      const res = await fetch(`/api/placements/${sub.id}/confirm-joining`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joiningForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm placement.");
      }

      setGeneratedInvoice(data.invoice);
      setSuccessMessage(
        `🎉 Day 1 Joining Confirmed for '${joiningCandidate.fullName}'. Tax invoice '${data.invoice?.invoiceNumber}' generated and 90-day guarantee started!`
      );
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to confirm joining.");
    } finally {
      setConfirmingPlacement(false);
    }
  };

  // Open Early Exit $0 Replacement Modal (RC-07)
  const handleOpenExitModal = (candidate: CandidateRecord) => {
    setExitCandidate(candidate);
    setExitReason("Candidate left organization during 90-day guarantee period. Initiating $0 replacement mandate.");
  };

  // Submit $0 Free Replacement Mandate (RC-07)
  const handleTriggerReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitCandidate || exitCandidate.submissions.length === 0) return;
    setTriggeringReplacement(true);

    try {
      const sub = exitCandidate.submissions[0];
      const res = await fetch(`/api/placements/${sub.id}/trigger-replacement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ earlyExitReason: exitReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger replacement.");
      }

      setSuccessMessage(
        `⚡ $0 Free Replacement Mandate '${data.replacementMandate.title}' activated! Silver Medalist Vault unlocked.`
      );
      setExitCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to trigger replacement.");
    } finally {
      setTriggeringReplacement(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <UserSandboxBanner />
      {/* Cockpit Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-extrabold text-slate-800 text-base shadow-sm">
                  R
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-lg tracking-tight">RecruitOS</span>
                    <span className="bg-brand-surfaceLight text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-brand-surface uppercase">
                      {session?.user?.agencyName || "Agency Cockpit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-2">
                <Link
                  href="/cockpit"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Mandates & SLA Radar
                </Link>
                <Link
                  href="/cockpit/candidates"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-xs"
                >
                  Candidate Bank & Placements (PL-01, PL-02)
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <UserSandboxToggle />

              <div className="hidden sm:flex items-center space-x-2 bg-brand-surfaceLight px-3 py-1.5 rounded-lg border border-brand-surface text-xs font-semibold text-slate-800">
                <span>{session?.user?.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Candidate Bank Header & Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-slate-800" />
              <h1 className="text-base font-extrabold text-slate-900">Permanent Agency Talent Bank</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Day-1 Physical Verification (PL-01), Auto-Invoicing (PL-02), and 90-Day Probation Guarantee Vault (RC-07).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setUploadFiles([]);
                setBatchResults([]);
                setParseError(null);
                setSelectedMandateId("");
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>+ Import & Parse Resumes (Gemini AI)</span>
            </button>
          </div>
        </div>

        {/* Top Macro KPI Stat Cards (RC-02, RC-06, RC-07, PL-01) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Talent Ingested */}
          <div
            onClick={() => {
              setSilverFilter(false);
              setNoticeFilter(false);
              setProbationFilter(false);
            }}
            className={`bg-white rounded-2xl border p-4.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
              !silverFilter && !noticeFilter && !probationFilter
                ? "border-slate-800 ring-1 ring-slate-800"
                : "border-slate-200/90 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Talent Bank</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{candidates.length}</span>
              <span className="text-xs text-slate-500 font-medium">Profiles Ingested</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Multi-resume AI batch parsed & deduplicated
            </p>
          </div>

          {/* Card 2: Silver Medalist Vault */}
          <div
            onClick={() => {
              setSilverFilter(!silverFilter);
              setNoticeFilter(false);
              setProbationFilter(false);
            }}
            className={`bg-white rounded-2xl border p-4.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
              silverFilter
                ? "border-amber-500 ring-1 ring-amber-500 bg-amber-50/20"
                : "border-slate-200/90 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Silver Medalists</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-amber-900">
                {candidates.filter((c) => c.isSilverMedalist).length}
              </span>
              <span className="text-xs text-amber-700 font-semibold">Pre-Vetted</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Final-round runners-up ready for 1-click redeploy
            </p>
          </div>

          {/* Card 3: Notice Period Radar */}
          <div
            onClick={() => {
              setNoticeFilter(!noticeFilter);
              setSilverFilter(false);
              setProbationFilter(false);
            }}
            className={`bg-white rounded-2xl border p-4.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
              noticeFilter
                ? "border-purple-500 ring-1 ring-purple-500 bg-purple-50/20"
                : "border-slate-200/90 hover:border-purple-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Notice Risk Radar</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-purple-900">
                {
                  candidates.filter((c) => {
                    const s = c.submissions[0]?.stage;
                    return s === "OFFER_ISSUED" || s === "OFFER_ACCEPTED" || s === "NOTICE_PERIOD_ACTIVE";
                  }).length
                }
              </span>
              <span className="text-xs text-purple-700 font-semibold">In Resignation</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Counter-offer risk monitor & retention pulses
            </p>
          </div>

          {/* Card 4: 90-Day Guarantee Vault */}
          <div
            onClick={() => {
              setProbationFilter(!probationFilter);
              setSilverFilter(false);
              setNoticeFilter(false);
            }}
            className={`bg-white rounded-2xl border p-4.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
              probationFilter
                ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20"
                : "border-slate-200/90 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">90-Day Guarantee Vault</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-900">
                {
                  candidates.filter((c) => {
                    const s = c.submissions[0];
                    return s?.stage === "JOINED_DAY_1_ACTIVE" && s?.probationStatus !== "EARLY_EXIT_REPLACEMENT";
                  }).length
                }
              </span>
              <span className="text-xs text-emerald-700 font-semibold">Active Placements</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Fee protection countdown & early exit monitor
            </p>
          </div>
        </div>

        {/* Table Filters & Views */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
            <div className="relative rounded-lg shadow-sm flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, skill, company, title..."
                className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center space-x-2.5">
              {/* 90-Day Probation Vault Filter (RC-07, PL-01) */}
              <button
                onClick={() => {
                  setProbationFilter(!probationFilter);
                  if (!probationFilter) {
                    setNoticeFilter(false);
                    setSilverFilter(false);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  probationFilter
                    ? "bg-emerald-100 border-emerald-400 text-emerald-900 shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Shield className={`h-3.5 w-3.5 ${probationFilter ? "text-emerald-700" : "text-slate-400"}`} />
                <span>90-Day Guarantee Vault (RC-07)</span>
                {probationFilter && <Check className="h-3 w-3 text-emerald-800 ml-1" />}
              </button>

              {/* Notice Period Risk Board Filter (RC-06) */}
              <button
                onClick={() => {
                  setNoticeFilter(!noticeFilter);
                  if (!noticeFilter) {
                    setProbationFilter(false);
                    setSilverFilter(false);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  noticeFilter
                    ? "bg-purple-100 border-purple-400 text-purple-900 shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ShieldAlert className={`h-3.5 w-3.5 ${noticeFilter ? "text-purple-700" : "text-slate-400"}`} />
                <span>Notice Risk Board (RC-06)</span>
                {noticeFilter && <Check className="h-3 w-3 text-purple-800 ml-1" />}
              </button>

              {/* Silver Medalist Filter (RC-07) */}
              <button
                onClick={() => {
                  setSilverFilter(!silverFilter);
                  if (!silverFilter) {
                    setProbationFilter(false);
                    setNoticeFilter(false);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  silverFilter
                    ? "bg-amber-100 border-amber-400 text-amber-900 shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Award className={`h-3.5 w-3.5 ${silverFilter ? "text-amber-700" : "text-slate-400"}`} />
                <span>Silver Vault (RC-07)</span>
                {silverFilter && <Check className="h-3 w-3 text-amber-800 ml-1" />}
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-medium">Loading candidate bank...</p>
            </div>
          ) : displayedCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No candidate profiles found</p>
              <p className="text-xs text-slate-400 mt-1">
                {probationFilter
                  ? "No placements currently under 90-day probation tracking."
                  : noticeFilter
                  ? "No candidates currently in offer or notice period stage."
                  : silverFilter
                  ? "No candidates currently tagged as Silver Medalists."
                  : "Click '+ Import & Parse Resumes' to ingest candidate CVs via the Gemini AI parser."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-brand-surfaceLight text-slate-700 uppercase font-semibold tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold text-slate-700 min-w-[260px]">
                      Candidate & Role
                    </th>
                    <th scope="col" className="px-3 py-3 font-bold text-slate-700 w-[100px] whitespace-nowrap">
                      Date Sourced
                    </th>
                    <th scope="col" className="px-3 py-3 font-bold text-slate-700 w-[105px] whitespace-nowrap">
                      Source
                    </th>
                    <th scope="col" className="px-3 py-3 font-bold text-slate-700 w-[125px] whitespace-nowrap">
                      Mobile Number
                    </th>
                    <th scope="col" className="px-3 py-3 font-bold text-slate-700 w-[230px]">
                      Last Call Outcome
                    </th>
                    <th scope="col" className="px-3 py-3 font-bold text-slate-700 w-[130px] whitespace-nowrap">
                      Pipeline / Job
                    </th>
                    <th scope="col" className="px-3 py-3 font-bold text-slate-700 w-[1%] whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {displayedCandidates.map((c) => {
                    const primarySub = c.submissions[0];
                    const isScheduled = primarySub?.stage === "INTERVIEW_SCHEDULED";
                    const isCompleted = primarySub?.stage === "INTERVIEW_COMPLETED";
                    const isShortlisted = primarySub?.stage === "CLIENT_SHORTLISTED";
                    const isOfferStage = primarySub?.stage === "OFFER_ISSUED" || primarySub?.stage === "OFFER_ACCEPTED";
                    const isNoticeStage = primarySub?.stage === "NOTICE_PERIOD_ACTIVE";
                    const isJoined = primarySub?.stage === "JOINED_DAY_1_ACTIVE";

                    const dispObj = CALL_DISPOSITIONS.find((d) => d.value === c.lastCallDisposition);

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenCandidateModal(c)}
                      >
                        {/* 1. Candidate Name & Role (Expanded to take full primary space) */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-extrabold text-slate-800 text-xs flex-shrink-0">
                              {c.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center space-x-1.5">
                                <span className="text-xs sm:text-sm">{c.fullName}</span>
                                {c.isSilverMedalist && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center space-x-0.5 flex-shrink-0">
                                    <Award className="h-2.5 w-2.5 text-amber-700" />
                                    <span>SILVER</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium truncate">
                                {c.currentTitle || "Professional"} {c.currentCompany ? `at ${c.currentCompany}` : ""}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-slate-400 font-medium">
                                <span className="font-semibold text-slate-600">{c.totalExpYears}y Exp</span>
                                <span>•</span>
                                <span>{c.noticePeriodDays}d Notice</span>
                                <span>•</span>
                                <span>
                                  {c.currentCtc ? `${(c.currentCtc / 100000).toFixed(1)}L` : "N/A"} →{" "}
                                  <strong className="text-emerald-700 font-bold">
                                    {c.expectedCtc ? `${(c.expectedCtc / 100000).toFixed(1)}L ${c.currency}` : "Comp N/A"}
                                  </strong>
                                </span>
                                {c.resumeUrl && (
                                  <a
                                    href={c.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center space-x-0.5 font-bold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded hover:bg-blue-100 transition-colors ml-1"
                                    title="View Original CV"
                                  >
                                    <FileText className="h-2.5 w-2.5" />
                                    <span>CV</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Date Sourced */}
                        <td className="px-3 py-3 text-slate-600 font-medium whitespace-nowrap w-[100px] text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        {/* 3. Source Name */}
                        <td className="px-3 py-3 whitespace-nowrap w-[105px]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {c.source.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* 4. Mobile Number (From resume) */}
                        <td className="px-3 py-3 font-mono text-slate-800 font-semibold whitespace-nowrap w-[125px] text-[11px]">
                          {c.phone || "N/A"}
                        </td>

                        {/* 5. Last Call Outcome */}
                        <td className="px-3 py-3 w-[230px]">
                          {dispObj ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${dispObj.badge}`}>
                                  {dispObj.label}
                                </span>
                                {c.lastCallDisposition === "CONNECTED_CALLBACK" && c.nextCallbackAt && (() => {
                                  const cbBadge = getCallbackBadge(c.nextCallbackAt);
                                  return cbBadge ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border shadow-2xs ${cbBadge.className}`}>
                                      {cbBadge.text}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              {c.lastCallNotes && (
                                <p className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                                  "{c.lastCallNotes}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No calls logged yet</span>
                          )}
                        </td>

                        {/* 6. Pipeline / Job Context (Compact) */}
                        <td className="px-3 py-3 whitespace-nowrap w-[130px]">
                          {primarySub ? (
                            <div className="space-y-0.5 max-w-[130px]">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                isJoined
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : isNoticeStage
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : isOfferStage
                                  ? "bg-purple-100 text-purple-800 border-purple-300"
                                  : isScheduled
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}>
                                {primarySub.stage.replace(/_/g, " ")}
                              </span>
                              <div className="text-[10px] text-slate-500 font-medium truncate" title={`${primarySub.mandate.title} (${primarySub.mandate.client.name})`}>
                                {primarySub.mandate.title}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Talent Pool
                            </span>
                          )}
                        </td>

                        {/* 7. Actions (Shrink-wrapped, zero wasted space) */}
                        <td className="px-3 py-3 text-right whitespace-nowrap w-[1%]" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenCandidateModal(c)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-brand-surfaceLight hover:bg-brand-surface border border-brand-surfaceDark text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
                              title="Log Call Outcome & Screening Details"
                            >
                              <PhoneCall className="h-3 w-3 text-slate-700" />
                              <span>Log Call & Details</span>
                            </button>

                            {c.isSilverMedalist && (
                              <button
                                onClick={() => {
                                  setRedeployCandidate(c);
                                  setRedeployNotes(`Redeploying Silver Medalist '${c.fullName}' with pre-vetted experience.`);
                                }}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                title="1-Click Redeploy Silver Medalist"
                              >
                                <Zap className="h-3 w-3" />
                                <span>Redeploy</span>
                              </button>
                            )}

                            {primarySub && (primarySub.stage === "CLIENT_SHORTLISTED" || primarySub.stage === "SCREENED_QUALIFIED") && (
                              <button
                                onClick={() => handleOpenScheduleModal(c)}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                title="Schedule Interview"
                              >
                                <Calendar className="h-3 w-3" />
                                <span>Schedule</span>
                              </button>
                            )}

                            {primarySub && isNoticeStage && (
                              <button
                                onClick={() => handleOpenPulseModal(c)}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs transition-all cursor-pointer"
                                title="Retention Pulse Check"
                              >
                                <ShieldAlert className="h-3 w-3 text-amber-700" />
                                <span>Pulse</span>
                              </button>
                            )}

                            {primarySub && (isOfferStage || isNoticeStage) && (
                              <button
                                onClick={() => handleOpenJoiningModal(c)}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                title="Confirm Day 1 Joining & Auto-Invoice"
                              >
                                <Receipt className="h-3 w-3" />
                                <span>Join</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: CONFIRM DAY-1 PHYSICAL JOINING & AUTO-INVOICE (PL-01, PL-02, RC-07) */}
      {joiningCandidate && joiningCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-emerald-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Confirm Day-1 Physical Joining & Generate Commercial Tax Invoice (PL-01, PL-02)
                  </h3>
                  <p className="text-[10px] text-emerald-800">
                    Candidate: <strong>{joiningCandidate.fullName}</strong> • {joiningCandidate.submissions[0].mandate.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setJoiningCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleConfirmJoiningSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Actual Physical Start Date *</label>
                    <input
                      type="date"
                      required
                      value={joiningForm.actualJoiningDate}
                      onChange={(e) => setJoiningForm({ ...joiningForm, actualJoiningDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Final Agreed CTC (INR) *</label>
                    <input
                      type="number"
                      required
                      value={joiningForm.agreedCtc}
                      onChange={(e) => setJoiningForm({ ...joiningForm, agreedCtc: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Client Accounts / Billing Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={joiningForm.clientBillingEmail}
                      onChange={(e) => setJoiningForm({ ...joiningForm, clientBillingEmail: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Client GSTIN / Tax ID (Optional)</label>
                    <input
                      type="text"
                      value={joiningForm.clientGstin}
                      onChange={(e) => setJoiningForm({ ...joiningForm, clientGstin: e.target.value })}
                      placeholder="27AABCU9603R1ZM"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>

                {/* Instant Placement Invoicing Breakdown */}
                {joiningForm.agreedCtc && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="font-bold text-slate-900 text-xs block">Commercial Invoice Calculation Preview</span>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Agreed Placement Fee:</span>
                        <strong className="text-slate-900">
                          {joiningCandidate.submissions[0].mandate.feePercentage || 8.33}% of Annual CTC
                        </strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Base Agency Fee:</span>
                        <strong className="text-slate-900">
                          ₹{(
                            (parseFloat(joiningForm.agreedCtc) * (joiningCandidate.submissions[0].mandate.feePercentage || 8.33)) /
                            100
                          ).toLocaleString()}
                        </strong>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-emerald-800 block text-[10px]">Total (+ 18% GST):</span>
                        <strong className="text-emerald-950 text-xs">
                          ₹{Math.round(
                            ((parseFloat(joiningForm.agreedCtc) * (joiningCandidate.submissions[0].mandate.feePercentage || 8.33)) /
                              100) *
                              1.18
                          ).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setJoiningCandidate(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirmingPlacement}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>{confirmingPlacement ? "Generating Tax Invoice..." : "Confirm Joining & Dispatch Invoice"}</span>
                  </button>
                </div>
              </form>

              {/* Generated Invoice Card */}
              {generatedInvoice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-xs flex items-center space-x-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Commercial Invoice Dispatched: {generatedInvoice.invoiceNumber}</span>
                    </span>
                    <span className="bg-emerald-200 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Due in 30 Days
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Total Invoiced Amount: <strong>₹{generatedInvoice.totalInvoiceAmount.toLocaleString()} INR</strong>. 90-Day replacement guarantee active until{" "}
                    <strong>{new Date(Date.now() + 90 * 24 * 3600 * 1000).toLocaleDateString()}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EARLY EXIT $0 FREE REPLACEMENT TRIGGER (RC-07) */}
      {exitCandidate && exitCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-rose-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Trigger $0 Free Replacement Mandate (RC-07)
                  </h3>
                  <p className="text-[10px] text-rose-800">
                    Candidate: <strong>{exitCandidate.fullName}</strong> • 90-Day Guarantee Policy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExitCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleTriggerReplacementSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <strong>🛡️ 100% Free Replacement Guarantee:</strong>
                <p>
                  Since {exitCandidate.fullName} exited during the active 90-day guarantee period, a new replacement mandate with <strong>$0 agency fee (100% fee credit)</strong> will be cloned instantly.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Reason for Early Exit / Replacement *</label>
                <textarea
                  rows={3}
                  required
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExitCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggeringReplacement}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{triggeringReplacement ? "Cloning $0 Mandate..." : "Activate $0 Free Replacement Search"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OFFER LOCKDOWN & RESIGNATION PLAYBOOK (RC-06) */}
      {offerModalCandidate && offerModalCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Pre-Offer Lockdown & Counter-Offer Immunity (RC-06)
                  </h3>
                  <p className="text-[10px] text-purple-800">
                    Candidate: <strong>{offerModalCandidate.fullName}</strong> • {offerModalCandidate.submissions[0].mandate.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOfferModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <form onSubmit={handleOfferLockSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Offered Annual CTC (INR) *</label>
                    <input
                      type="number"
                      required
                      value={offerForm.offeredCtc}
                      onChange={(e) => setOfferForm({ ...offerForm, offeredCtc: e.target.value })}
                      placeholder="3200000"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Agreed Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={offerForm.offeredJoiningDate}
                      onChange={(e) => setOfferForm({ ...offerForm, offeredJoiningDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Reporting Manager</label>
                    <input
                      type="text"
                      value={offerForm.currentManagerName}
                      onChange={(e) => setOfferForm({ ...offerForm, currentManagerName: e.target.value })}
                      placeholder="e.g. Suresh Kumar (VP Engineering)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notice Period (Days)</label>
                    <input
                      type="number"
                      value={offerForm.noticePeriodDays}
                      onChange={(e) => setOfferForm({ ...offerForm, noticePeriodDays: parseInt(e.target.value, 10) || 30 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={lockingOffer}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{lockingOffer ? "Locking & Generating..." : "Lock Offer & Generate Resignation Draft"}</span>
                  </button>
                </div>
              </form>

              {/* Generated Resignation Letter Draft */}
              {generatedLetter && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>Formal Resignation Letter Draft (Counter-Offer Immunized)</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLetter);
                        alert("Resignation draft copied to clipboard!");
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Letter</span>
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {generatedLetter}
                  </div>

                  {/* Counter-Offer Immunization Talking Points (RC-06) */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-[11px] text-amber-950">
                    <span className="font-bold block text-amber-900">
                      🛡️ Counter-Offer Immunization Talking Points for Recruiter Check-in:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-amber-900">
                      <li><strong>Remind:</strong> 80%+ of people who accept a counter-offer still leave within 6 months.</li>
                      <li><strong>Firm Boundary:</strong> "Thank you for the counter-offer, but my decision is driven by the leadership scope and long-term career direction."</li>
                      <li><strong>No Hesitation:</strong> Submit resignation in writing within 24 hours of accepting the offer.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BI-WEEKLY RETENTION PULSE CHECK (RC-06) */}
      {pulseModalCandidate && pulseModalCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Notice Period Retention Pulse Check (RC-06)</h3>
                  <p className="text-[10px] text-amber-800">Candidate: {pulseModalCandidate.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setPulseModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePulseSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Resignation Submitted?</label>
                  <select
                    value={pulseForm.resignationConfirmed ? "yes" : "no"}
                    onChange={(e) => setPulseForm({ ...pulseForm, resignationConfirmed: e.target.value === "yes" })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value="yes">✅ Yes, Resignation Formally Logged</option>
                    <option value="no">⏳ Pending / In Conversation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Counter-Offer Made?</label>
                  <select
                    value={pulseForm.counterOfferReceived ? "yes" : "no"}
                    onChange={(e) => setPulseForm({ ...pulseForm, counterOfferReceived: e.target.value === "yes" })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value="no">🛡️ No Counter-Offer (Smooth Exit)</option>
                    <option value="yes">⚠️ Yes, Current Employer Matched/Offered Perks</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">Counter-Offer Risk Level *</label>
                  <select
                    value={pulseForm.counterOfferRiskLevel}
                    onChange={(e) => setPulseForm({ ...pulseForm, counterOfferRiskLevel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  >
                    <option value="LOW">🟢 LOW — Handover in progress, zero retention risk</option>
                    <option value="MEDIUM">🟡 MEDIUM — Manager requested discussion, candidate holding firm</option>
                    <option value="HIGH">🟠 HIGH — Formal counter-offer on table, needs intervention</option>
                    <option value="CRITICAL">🔴 CRITICAL — Candidate wavering, risk of back-out</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Risk Context & Observations</label>
                  <input
                    type="text"
                    value={pulseForm.counterOfferRiskReason}
                    onChange={(e) => setPulseForm({ ...pulseForm, counterOfferRiskReason: e.target.value })}
                    placeholder="e.g. Candidate confirmed KT handover schedule with team lead."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Recruiter Call Debrief Notes</label>
                  <textarea
                    rows={2}
                    value={pulseForm.recruiterNotes}
                    onChange={(e) => setPulseForm({ ...pulseForm, recruiterNotes: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPulseModalCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPulse}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingPulse ? "Logging..." : "Save Pulse Check & Update Risk Score"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MULTI-CHANNEL INTERVIEW SCHEDULING (RC-04) */}
      {scheduleModalCandidate && scheduleModalCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Schedule Interview & Multi-Channel Dispatch (RC-04)</h3>
                  <p className="text-[10px] text-purple-800">
                    Candidate: <strong>{scheduleModalCandidate.fullName}</strong> • {scheduleModalCandidate.submissions[0].mandate.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Round</label>
                  <select
                    value={scheduleForm.interviewType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interviewType: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value="TECHNICAL_ROUND">Technical Round</option>
                    <option value="LEADERSHIP_SYSTEMS">Leadership / System Design</option>
                    <option value="HR_CULTURE_FIT">Culture Fit & HR</option>
                    <option value="CLIENT_FINAL_ROUND">Client Final Round</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Mins)</label>
                  <select
                    value={scheduleForm.durationMinutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(e.target.value, 10) || 60 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">Video Meeting Link (Google Meet / Zoom) *</label>
                  <input
                    type="url"
                    required
                    value={scheduleForm.meetingLink}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/xyz-abc-def"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Client Panelists (Comma-separated)</label>
                  <input
                    type="text"
                    value={scheduleForm.panelistNames}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, panelistNames: e.target.value })}
                    placeholder="Dr. Arvind Subramanian (VP Engineering), Priya Nair"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Multi-Channel Dispatch Toggles */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="block font-bold text-slate-900 text-xs">Automated Candidate Logistics Dispatch</span>
                <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForm.sendWhatsApp}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, sendWhatsApp: e.target.checked })}
                    className="rounded text-purple-600 h-4 w-4"
                  />
                  <span>
                    📱 <strong>WhatsApp Candidate Briefing</strong> to {scheduleModalCandidate.phone || "Candidate Phone"} (Instant Prep Guidance)
                  </span>
                </label>
                <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForm.sendEmail}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, sendEmail: e.target.checked })}
                    className="rounded text-purple-600 h-4 w-4"
                  />
                  <span>
                    ✉️ <strong>Calendar Email Invite</strong> to {scheduleModalCandidate.email}
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {scheduling ? (
                    <span>Dispatching Logistics...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Lock Slot & Dispatch (WhatsApp + Email)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST-INTERVIEW DEBRIEF (RC-05) */}
      {debriefCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-emerald-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Post-Interview Debrief & Feedback Capture (RC-05)</h3>
                  <p className="text-[10px] text-emerald-800">Candidate: {debriefCandidate.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setDebriefCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDebriefSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Candidate Sentiment & Enthusiasm *</label>
                <select
                  value={debriefForm.candidateSentiment}
                  onChange={(e) => setDebriefForm({ ...debriefForm, candidateSentiment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                >
                  <option value="HIGH_ENTHUSIASM">🔥 High Enthusiasm (Top Choice for Candidate)</option>
                  <option value="POSITIVE_RECEPTIVE">👍 Positive & Receptive</option>
                  <option value="CAUTIOUS_CONCERNS">⚠️ Cautious / Had Counter-Offer or Commute Questions</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Debrief & Panel Feedback Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={debriefForm.debriefNotes}
                  onChange={(e) => setDebriefForm({ ...debriefForm, debriefNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirmed Notice Period (Days)</label>
                  <input
                    type="number"
                    value={debriefForm.noticePeriodConfirmed}
                    onChange={(e) => setDebriefForm({ ...debriefForm, noticePeriodConfirmed: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Next Action *</label>
                  <select
                    value={debriefForm.nextAction}
                    onChange={(e) => setDebriefForm({ ...debriefForm, nextAction: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  >
                    <option value="MOVE_TO_OFFER">🎯 Move to Offer Stage</option>
                    <option value="NEXT_ROUND">🔁 Schedule Next Interview Round</option>
                    <option value="REJECT">❌ Reject & Auto-Recycle to Silver Vault</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDebriefCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDebrief}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingDebrief ? "Recording Debrief..." : "Save Debrief & Advance Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: SILVER MEDALIST TAGGING & REASON (RC-07) */}
      {silverModalCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Add to Silver Medalist Vault (RC-07)</h3>
                  <p className="text-[10px] text-amber-800">Tag high-caliber finalist for cross-mandate redeployment</p>
                </div>
              </div>
              <button
                onClick={() => setSilverModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSilverModal} className="p-6 space-y-4">
              <div>
                <span className="font-bold text-slate-900 text-sm block mb-1">
                  Candidate: {silverModalCandidate.fullName}
                </span>
                <p className="text-slate-500 text-[11px]">
                  {silverModalCandidate.currentTitle} • {silverModalCandidate.totalExpYears} Years Exp
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Qualification Context / Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={silverReason}
                  onChange={(e) => setSilverReason(e.target.value)}
                  placeholder="e.g. Final round finalist at FinTech Unicorn — Client selected internal candidate. Stellar system design feedback."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSilverModalCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSilver}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {updatingSilver ? "Tagging..." : "Tag as Silver Medalist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-CLICK INSTANT REDEPLOYMENT (RC-07) */}
      {redeployCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">1-Click Instant Redeployment (RC-07)</h3>
                  <p className="text-[10px] text-slate-500">Jumpstart active search pipeline with pre-vetted finalist</p>
                </div>
              </div>
              <button
                onClick={() => setRedeployCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRedeploySubmit} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 text-sm block">
                  {redeployCandidate.fullName}
                </span>
                <div className="text-[11px] text-slate-500">
                  {redeployCandidate.currentTitle} • {redeployCandidate.totalExpYears} Years Exp • {redeployCandidate.noticePeriodDays} Days Notice
                </div>
                {redeployCandidate.silverMedalistReason && (
                  <div className="mt-1 text-[10px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Vault Context:</strong> {redeployCandidate.silverMedalistReason}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Target Active Hiring Mandate *
                </label>
                <select
                  required
                  value={redeployMandateId}
                  onChange={(e) => setRedeployMandateId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                >
                  {mandates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.client.name})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Promotes candidate directly to <strong>SCREENED QUALIFIED</strong> (skips raw sourcing).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recruiter Redeployment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={redeployNotes}
                  onChange={(e) => setRedeployNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRedeployCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeploying}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {redeploying ? (
                    <span>Redeploying...</span>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-slate-900" />
                      <span>Instant Redeploy (Zero Latency)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UNIFIED BATCH RESUME INGESTION & GEMINI AI PARSER MODAL (RC-02) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 text-sm">Batch AI Resume Parser & Clean Ingestion (RC-02)</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setBatchResults([]);
                  setUploadFiles([]);
                  setParseError(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                  <div className="flex-1">
                    <strong className="block font-bold">Upload / Parsing Issue</strong>
                    <span className="text-xs">{parseError}</span>
                  </div>
                </div>
              )}

              {/* Target Mandate Selector */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Target Mandate Assignment (Optional)
                </label>
                <select
                  value={selectedMandateId}
                  onChange={(e) => setSelectedMandateId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium focus:ring-1 focus:ring-slate-800"
                >
                  <option value="">
                    General Talent Bank (No Job Assigned - Available for Search & Redeployment)
                  </option>
                  {mandates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.client.name})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedMandateId
                    ? "Candidates will be saved to your Talent Bank and automatically submitted to this active mandate."
                    : "Candidates will be saved to your master Talent Bank without being tied to a specific job opening."}
                </p>
              </div>

              {batchResults.length === 0 && !parsing && (
                <div className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-3xl p-10 text-center bg-slate-50/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleMultiFileSelect}
                    id="candidate-bank-resume-upload-batch"
                    className="hidden"
                  />
                  <label htmlFor="candidate-bank-resume-upload-batch" className="cursor-pointer block">
                    <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <span className="font-extrabold text-slate-900 text-sm hover:underline block">
                      Click to Select Resumes (PDF, DOCX)
                    </span>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                      Select <strong>up to 5 resumes</strong> at once. Each file must be under <strong>10MB</strong>.
                    </p>
                    <div className="mt-3 inline-flex items-center space-x-2 text-[11px] font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                      <span>✓ Server-side permanent CV storage</span>
                      <span>•</span>
                      <span>✓ Gemini AI entity extraction</span>
                      <span>•</span>
                      <span>✓ Duplicate check</span>
                    </div>
                  </label>
                </div>
              )}

              {parsing && (
                <div className="p-8 bg-slate-50/80 rounded-3xl border border-slate-200 text-center space-y-4">
                  <div className="w-10 h-10 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-2 text-sm font-extrabold text-slate-900">
                      <span>Parsing Resume {parseProgress.current} of {parseProgress.total}</span>
                      <span className="text-xs font-bold text-slate-500 font-mono">({parseProgress.percent}%)</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate max-w-md mx-auto">
                      Current: <span className="font-mono text-slate-900 font-bold">{parseProgress.currentFileName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Extracting entities & saving permanent document copy to cloud storage
                    </p>
                  </div>

                  {/* Visual Animated Progress Bar */}
                  <div className="max-w-md mx-auto space-y-1.5">
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-yellow hover:bg-brand-yellowHover rounded-full transition-all duration-300 shadow-2xs"
                        style={{ width: `${Math.max(8, parseProgress.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>File {parseProgress.current} of {parseProgress.total}</span>
                      <span>{parseProgress.percent}% Complete</span>
                    </div>
                  </div>

                  {/* Completed files badge pills in this active batch */}
                  {batchResults.length > 0 && (
                    <div className="pt-2 text-left border-t border-slate-200/60 max-w-md mx-auto">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Parsed in this batch ({batchResults.length} of {parseProgress.total}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {batchResults.map((r, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 font-medium border ${
                              r.success
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {r.success ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-rose-600" />
                            )}
                            <span className="truncate max-w-[140px]">
                              {r.parsed?.fullName || r.fileName}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {batchResults.length > 0 && !parsing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                        Parsed Candidate Dossiers ({batchResults.filter((r) => r.success).length} Ready)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {selectedMandateId
                          ? `Review extracted information before attaching to '${mandates.find((m) => m.id === selectedMandateId)?.title}'`
                          : "Review extracted candidate dossiers before saving to General Talent Bank"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchResults([]);
                        setUploadFiles([]);
                        setParseError(null);
                      }}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      + Upload Different Files
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {batchResults.map((res, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          res.success
                            ? "bg-slate-50/80 border-slate-200"
                            : "bg-rose-50/60 border-rose-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-slate-500" />
                              <span className="font-mono text-[11px] font-bold text-slate-700">{res.fileName}</span>
                              {res.success ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full border border-emerald-300">
                                  Parsed Successfully
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.2 rounded-full border border-rose-300">
                                  Parse Error
                                </span>
                              )}
                            </div>

                            {res.success && res.parsed && (
                              <div className="pt-2">
                                <div className="text-sm font-extrabold text-slate-900">
                                  {res.parsed.fullName || "Unnamed Candidate"}
                                </div>
                                <div className="text-xs text-slate-600 font-medium">
                                  {res.parsed.currentTitle || "Title not found"} {res.parsed.currentCompany ? `at ${res.parsed.currentCompany}` : ""}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[11px]">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Phone</span>
                                    <span className="font-mono font-bold text-slate-800">{res.parsed.phone || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Email</span>
                                    <span className="font-bold text-slate-800 truncate block">{res.parsed.email || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Experience</span>
                                    <span className="font-bold text-slate-800">{res.parsed.totalExpYears ?? 0} Years</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Qualification</span>
                                    <span className="font-bold text-slate-800">{res.parsed.qualification || "N/A"}</span>
                                  </div>
                                </div>
                                {res.parsed.skills && res.parsed.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2.5">
                                    {res.parsed.skills.slice(0, 6).map((sk: string, sIdx: number) => (
                                      <span
                                        key={sIdx}
                                        className="bg-white border border-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-medium"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {!res.success && (
                              <p className="text-xs text-rose-700 mt-1 font-medium">{res.error || "Unknown extraction error"}</p>
                            )}
                          </div>

                          {res.resumeUrl && (
                            <a
                              href={res.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <span>Saved CV Copy</span>
                              <FileText className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setBatchResults([]);
                        setUploadFiles([]);
                        setParseError(null);
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBatchCandidates}
                      disabled={savingBatch || batchResults.filter((r) => r.success).length === 0}
                      className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                    >
                      {savingBatch ? (
                        <span>Saving Candidates...</span>
                      ) : (
                        <span>
                          Save & Ingest {batchResults.filter((r) => r.success).length} Candidate(s)
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CENTERED CANDIDATE DETAIL & CALL SCREENING MODAL (RC-01, RC-02, RC-04)     */}
      {/* ========================================================================= */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    Candidate Screening & Call Record
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Source: {selectedCandidate.source.replace(/_/g, " ")}</span>
                  {selectedCandidate.qualification && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                      {selectedCandidate.qualification}
                    </span>
                  )}
                  {selectedCandidate.isSilverMedalist && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                      <Award className="h-3 w-3 text-amber-700" />
                      <span>Silver Medalist</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-extrabold text-slate-900">{selectedCandidate.fullName}</h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedCandidate.currentTitle || "Professional"} {selectedCandidate.currentCompany ? `at ${selectedCandidate.currentCompany}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedCandidate.submissions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const cand = selectedCandidate;
                      setSelectedCandidate(null);
                      handleOpenScheduleModal(cand);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>⚡ Schedule Interview</span>
                  </button>
                )}
                {selectedCandidate.resumeUrl && (
                  <a
                    href={selectedCandidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-brand-surfaceLight hover:bg-brand-surface text-slate-800 text-xs font-bold rounded-xl border border-brand-surfaceDark transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span>View Original CV</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="h-8 w-8 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xl leading-none cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Quick Candidate Snapshot Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Mobile (Resume)</span>
                  <strong className="text-slate-900 text-xs block font-mono">{selectedCandidate.phone || "N/A"}</strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Email Address</span>
                  <strong className="text-slate-900 text-xs block truncate">{selectedCandidate.email}</strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Total Experience</span>
                  <strong className="text-slate-900 text-xs block">{selectedCandidate.totalExpYears} Years</strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Compensation (CTC)</span>
                  <strong className="text-slate-900 text-xs block">
                    {selectedCandidate.currentCtc ? `${(selectedCandidate.currentCtc / 100000).toFixed(1)}L` : "N/A"} →{" "}
                    <span className="text-emerald-700">{selectedCandidate.expectedCtc ? `${(selectedCandidate.expectedCtc / 100000).toFixed(1)}L ${selectedCandidate.currency}` : "N/A"}</span>
                  </strong>
                </div>
              </div>

              {/* STRUCTURED CALL LOGGING & SCREENING FORM */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <PhoneCall className="h-4 w-4 text-blue-600" />
                    <span>Log Recruiter Call & Screened Qualification</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Fields with * are required to qualify candidate</span>
                </div>

                {callValidationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 text-xs font-bold">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
                    <span>{callValidationError}</span>
                  </div>
                )}

                <form onSubmit={handleLogCall} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Call Disposition (Required) */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Call Outcome Disposition <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={callDisposition}
                        onChange={(e) => {
                          setCallDisposition(e.target.value);
                          setCallValidationError(null);
                        }}
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white text-slate-900 ${
                          !callDisposition ? "border-rose-300 ring-1 ring-rose-100" : "border-slate-300"
                        }`}
                      >
                        <option value="">-- Select Call Disposition * --</option>
                        {CALL_DISPOSITIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Associated Job Mandate (Optional) */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Align to Job Mandate (Optional)
                      </label>
                      <select
                        value={callMandateId}
                        onChange={(e) => setCallMandateId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-900"
                      >
                        <option value="">Talent Bank (General Screening / Unassigned)</option>
                        {mandates.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title} — {m.client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scheduled Callback Date & Time (revealed when CONNECTED_CALLBACK is selected) */}
                  {callDisposition === "CONNECTED_CALLBACK" && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 animate-in fade-in duration-200 shadow-2xs">
                      <div className="flex items-center space-x-1.5 text-amber-950 font-extrabold text-xs">
                        <Clock className="h-4 w-4 text-amber-700" />
                        <span>Schedule Follow-Up Call Back</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-amber-900 mb-1">
                            Call Back Date <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="date"
                            value={callbackDate}
                            onChange={(e) => setCallbackDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-900 mb-1">
                            Call Back Time <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="time"
                            value={callbackTime}
                            onChange={(e) => setCallbackTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium">
                        RecruitOS will display overdue alerts and prioritize this candidate on today's callback queue when this time arrives.
                      </p>
                    </div>
                  )}

                  {/* 7 Recruiter Screening Items */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider text-blue-700">
                      Recruiter Call Screening & Presentation Parameters (Shared with Client)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {/* 1. Ready to Relocate */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">1. Ready to Relocate</label>
                        <select
                          value={readyToRelocate}
                          onChange={(e) => setReadyToRelocate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Hybrid Only">Hybrid Only</option>
                          <option value="Remote Only">Remote Only</option>
                          <option value="Already in Target City">Already in Target City</option>
                        </select>
                      </div>

                      {/* 2. Relevant Exp: in Years */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">2. Relevant Exp (Years)</label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 5"
                          value={relevantExpYears}
                          onChange={(e) => setRelevantExpYears(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      {/* 3. Current Salary */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">3. Current Salary</label>
                        <input
                          type="text"
                          placeholder="e.g. 12 LPA"
                          value={currentSalary}
                          onChange={(e) => setCurrentSalary(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold"
                        />
                      </div>

                      {/* 4. Expectation */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">4. Expected Salary</label>
                        <input
                          type="text"
                          placeholder="e.g. 16 LPA"
                          value={expectedSalary}
                          onChange={(e) => setExpectedSalary(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold"
                        />
                      </div>

                      {/* 5. Notice Period */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">5. Notice Period</label>
                        <input
                          type="text"
                          placeholder="e.g. 30 Days / Serving Notice"
                          value={noticePeriod}
                          onChange={(e) => setNoticePeriod(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      {/* 6. Reason of Leaving */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">6. Reason for Leaving</label>
                        <input
                          type="text"
                          placeholder="e.g. Looking for growth & leadership"
                          value={reasonForLeaving}
                          onChange={(e) => setReasonForLeaving(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      {/* 7. Offer in Hand */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">7. Offer in Hand?</label>
                        <select
                          value={offerInHand}
                          onChange={(e) => setOfferInHand(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold"
                        >
                          <option value="No">No</option>
                          <option value="Yes (1 Offer)">Yes (1 Offer)</option>
                          <option value="Yes (Multiple Offers)">Yes (Multiple Offers)</option>
                          <option value="In Final Stages">In Final Stages</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Call Notes / Conversation Summary</label>
                    <textarea
                      rows={2}
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="e.g. Candidate confirmed notice period is negotiable to 30 days, interested in backend engineering stack..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(null)}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loggingCall}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer text-xs disabled:opacity-50 flex items-center space-x-1.5"
                    >
                      {loggingCall ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Call...</span>
                        </>
                      ) : (
                        <span>Save Call Outcome & Screening</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* CALL & ACTIVITY HISTORY */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Call & Activity History</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(selectedCandidate.callLogs || []).length} interaction(s) logged
                  </span>
                </h3>

                {(!selectedCandidate.callLogs || selectedCandidate.callLogs.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    No calls logged for this candidate yet. Use the form above to record your conversation.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {selectedCandidate.callLogs.map((log) => {
                      const disp = CALL_DISPOSITIONS.find((d) => d.value === log.disposition);
                      return (
                        <div key={log.id} className="p-3 space-y-1 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${disp?.badge || "bg-slate-100 text-slate-800"}`}>
                                {disp?.label || log.disposition}
                              </span>
                              {log.mandate && (
                                <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded font-semibold">
                                  {log.mandate.title} ({log.mandate.client.name})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.calledAt).toLocaleString()} by <strong>{log.recruiter?.name || "Recruiter"}</strong>
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-slate-700 font-medium pl-1">{log.notes}</p>
                          )}
                          {log.callbackAt && (
                            <div className="text-[10px] text-amber-800 font-bold flex items-center space-x-1 mt-1 pl-1">
                              <Clock className="h-3 w-3 text-amber-600 mr-0.5" />
                              <span>Scheduled Call Back: {new Date(log.callbackAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CLIENT REVIEW & TELEMETRY (If attached to any mandate) */}
              {selectedCandidate.submissions.length > 0 && selectedCandidate.submissions[0].clientQuestionText && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-blue-800">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>Inquiry from Client Hiring Manager:</span>
                  </div>
                  <p className="italic bg-white p-2.5 rounded-lg border border-blue-200 text-slate-800">
                    "{selectedCandidate.submissions[0].clientQuestionText}"
                  </p>
                </div>
              )}

              {/* RESUME PREVIEW & SKILLS */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-600" />
                  <span>Resume Summary & Skills</span>
                </h3>
                {selectedCandidate.summary && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
                    {selectedCandidate.summary}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCandidate.skills.map((skill, idx) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                Talent Bank • {selectedCandidate.submissions.length > 0 ? `Active on ${selectedCandidate.submissions[0].mandate.title}` : "General Pool"}
              </span>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
