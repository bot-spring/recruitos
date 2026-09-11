"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  UploadCloud,
  FileText,
  UserPlus,
  Send,
  Zap,
  Sparkles,
  ChevronRight,
  X,
  PhoneCall,
  MessageSquare,
  Shield,
  Award,
  DollarSign,
  ExternalLink,
  ChevronDown,
  Check,
  AlertTriangle,
  Radio,
  Share2,
  BellRing,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { UserSandboxToggle, UserSandboxBanner } from "@/components/UserSandboxToggle";

interface MandateDetails {
  id: string;
  title: string;
  department: string | null;
  openings: number;
  minExp: number;
  maxExp: number;
  minCtc: number | null;
  maxCtc: number | null;
  currency: string;
  location: string | null;
  workMode: string;
  skills: string[];
  description: string | null;
  specialInstructions: string | null;
  priority: string;
  feePercentage: number;
  guaranteeDays: number;
  status: string;
  slaTargetHours: number;
  slaStartedAt: string | null;
  slaStatus: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
    location: string | null;
  };
  contact: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    designation: string | null;
  } | null;
  assignedRecruiter: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AttachedCandidate {
  submissionId: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  phoneNormalized: string;
  currentCompany: string | null;
  currentTitle: string | null;
  totalExpYears: number;
  expectedCtc: number | null;
  currentCtc: number | null;
  currency: string;
  noticePeriodDays: number;
  location: string | null;
  skills: string[];
  summary: string | null;
  rawResumeText: string | null;
  resumeUrl: string | null;
  qualification: string | null;
  source: string;
  dateOfSourcing: string;
  status: "NOT_SHARED" | "SHARED_WITH_COMPANY" | "SELECTED_FOR_NEXT_ROUND" | "OFFERED" | "HOLD" | "REJECTED" | "JOINED";
  stage: string;
  clientDecision: string | null;
  clientFeedbackNotes: string | null;
  clientFeedbackAt: string | null;
  preferredInterviewTimes: string | null;
  rejectionReason: string | null;
  clientQuestionText: string | null;
  submittedToClientAt: string | null;
  lastCallOutcome: string | null;
  lastCallNotes: string | null;
  lastCallAt: string | null;
  nextCallbackAt: string | null;
  readyToRelocate: string | null;
  relevantExpYears: number | null;
  currentSalary: string | null;
  expectedSalary: string | null;
  noticePeriod: string | null;
  reasonForLeaving: string | null;
  offerInHand: string | null;
  isSilverMedalist: boolean;
  silverMedalistReason: string | null;
  thisJobCallLogs: Array<{
    id: string;
    disposition: string;
    notes: string | null;
    callbackAt?: string | null;
    calledAt: string;
    recruiterName: string;
  }>;
  otherJobsHistory: Array<{
    mandateId: string;
    mandateTitle: string;
    clientName: string;
    stage: string;
    candidateJobStatus: string;
    createdAt: string;
    callLogs: Array<{
      id: string;
      disposition: string;
      notes: string | null;
      calledAt: string;
      recruiterName: string;
    }>;
  }>;
}

interface PoolCandidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentCompany: string | null;
  currentTitle: string | null;
  totalExpYears: number;
  expectedCtc: number | null;
  noticePeriodDays: number;
  location: string | null;
  skills: string[];
  summary: string | null;
  source: string;
  matchScore: number;
  matchedSkills: string[];
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

const CANDIDATE_STATUSES = [
  { value: "NOT_SHARED", label: "Not Shared with Company", badge: "bg-slate-100 text-slate-800 border-slate-300" },
  { value: "SHARED_WITH_COMPANY", label: "Shared with Company", badge: "bg-blue-100 text-blue-900 border-blue-300" },
  { value: "SELECTED_FOR_NEXT_ROUND", label: "Selected for Next Round", badge: "bg-purple-100 text-purple-900 border-purple-300" },
  { value: "OFFERED", label: "Offered", badge: "bg-amber-100 text-amber-900 border-amber-300 font-black" },
  { value: "HOLD", label: "Hold", badge: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  { value: "REJECTED", label: "Rejected", badge: "bg-rose-100 text-rose-900 border-rose-300" },
  { value: "JOINED", label: "Joined (Day 1)", badge: "bg-emerald-100 text-emerald-950 border-emerald-400 font-black" },
];

export default function MandateWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const mandateId = params.id as string;

  const [mandate, setMandate] = useState<MandateDetails | null>(null);
  const [candidates, setCandidates] = useState<AttachedCandidate[]>([]);
  const [matchingPool, setMatchingPool] = useState<PoolCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeQuickTab, setActiveQuickTab] = useState<"ALL" | "CALLBACKS_TODAY" | "READY_TO_SHARE">("ALL");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Centered Call Screening Modal State (with 7 Call-Screening Metrics)
  const [selectedCandidate, setSelectedCandidate] = useState<AttachedCandidate | null>(null);
  const [callDisposition, setCallDisposition] = useState<string>("");
  const [callbackDate, setCallbackDate] = useState<string>("");
  const [callbackTime, setCallbackTime] = useState<string>("12:00");
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

  // Helper to format scheduled callback badge
  const getCallbackBadge = (callbackAtStr: string | null) => {
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

  // Pool Browse Modal State
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  // Multi-Resume Ingestion Modal State (RC-02 Split-Screen Review)
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [parseProgress, setParseProgress] = useState({
    current: 0,
    total: 0,
    currentFileName: "",
    percent: 0,
  });

  const updateActiveParsedField = (field: string, value: any) => {
    setBatchResults((prev) => {
      const updated = [...prev];
      if (updated[activeBatchIndex]?.parsed) {
        updated[activeBatchIndex] = {
          ...updated[activeBatchIndex],
          parsed: {
            ...updated[activeBatchIndex].parsed,
            [field]: value,
          },
        };
      }
      return updated;
    });
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setBatchResults((prev) => {
      const updated = [...prev];
      const curr = updated[activeBatchIndex]?.parsed;
      if (curr && Array.isArray(curr.skills)) {
        updated[activeBatchIndex] = {
          ...updated[activeBatchIndex],
          parsed: {
            ...curr,
            skills: curr.skills.filter((s: string) => s !== skillToRemove),
          },
        };
      }
      return updated;
    });
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const skillToAdd = newSkillInput.trim();
    setBatchResults((prev) => {
      const updated = [...prev];
      const curr = updated[activeBatchIndex]?.parsed;
      if (curr) {
        const existing = Array.isArray(curr.skills) ? curr.skills : [];
        if (!existing.includes(skillToAdd)) {
          updated[activeBatchIndex] = {
            ...updated[activeBatchIndex],
            parsed: {
              ...curr,
              skills: [...existing, skillToAdd],
            },
          };
        }
      }
      return updated;
    });
    setNewSkillInput("");
  };

  // Client Portal Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedForSharing, setSelectedForSharing] = useState<string[]>([]);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [generatedPortalUrl, setGeneratedPortalUrl] = useState<string | null>(null);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);
  const [chasingClient, setChasingClient] = useState(false);

  // Fetch Mandate Workspace Data
  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mandates/${mandateId}/workspace`);
      if (res.ok) {
        const data = await res.json();
        setMandate(data.mandate);
        setCandidates(data.attachedCandidates || []);
        setMatchingPool(data.matchingPool || []);

        // Pre-select candidates for sharing who are CONNECTED_INTERESTED and NOT_SHARED
        const readyIds = (data.attachedCandidates || [])
          .filter((c: AttachedCandidate) => c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED")
          .map((c: AttachedCandidate) => c.candidateId);
        setSelectedForSharing(readyIds);
      }
    } catch (err) {
      console.error("Failed to load mandate workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mandateId) {
      fetchWorkspace();
    }
  }, [mandateId]);

  // Open Centered Candidate Call Screening Modal
  const handleOpenCandidateModal = (cand: AttachedCandidate) => {
    setSelectedCandidate(cand);
    setCallDisposition(cand.lastCallOutcome || ""); // Pre-populate saved disposition!
    setCallNotes("");
    setCallValidationError(null);
    setReadyToRelocate(cand.readyToRelocate || "Yes");
    setRelevantExpYears(cand.relevantExpYears !== null && cand.relevantExpYears !== undefined ? String(cand.relevantExpYears) : "");
    setCurrentSalary(cand.currentSalary || (cand.currentCtc ? `${cand.currentCtc} LPA` : ""));
    setExpectedSalary(cand.expectedSalary || (cand.expectedCtc ? `${cand.expectedCtc} LPA` : ""));
    setNoticePeriod(cand.noticePeriod || (cand.noticePeriodDays ? `${cand.noticePeriodDays} Days` : ""));
    setReasonForLeaving(cand.reasonForLeaving || "");
    setOfferInHand(cand.offerInHand || "No");

    if (cand.nextCallbackAt) {
      try {
        const d = new Date(cand.nextCallbackAt);
        setCallbackDate(d.toISOString().split("T")[0]);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setCallbackTime(`${hh}:${mm}`);
      } catch (_) {
        setCallbackDate(new Date().toISOString().split("T")[0]);
        setCallbackTime("12:00");
      }
    } else {
      setCallbackDate(new Date().toISOString().split("T")[0]);
      setCallbackTime("12:00");
    }
  };

  // Log Call Outcome & Screening Metrics
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
      const res = await fetch(`/api/mandates/${mandateId}/call-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedCandidate.submissionId,
          disposition: callDisposition,
          notes: callNotes,
          callbackAt: callbackAtPayload,
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
      // Keep callDisposition selected so recruiter sees the saved outcome:
      setCallDisposition(callDisposition);
      fetchWorkspace();

      // Update selectedCandidate state in modal
      if (selectedCandidate) {
        const newLog = {
          id: data.callLog.id,
          disposition: callDisposition,
          notes: callNotes,
          callbackAt: callbackAtPayload,
          calledAt: new Date().toISOString(),
          recruiterName: session?.user?.name || "You",
        };
        setSelectedCandidate({
          ...selectedCandidate,
          lastCallOutcome: callDisposition,
          lastCallNotes: callNotes,
          lastCallAt: new Date().toISOString(),
          nextCallbackAt: callbackAtPayload,
          readyToRelocate,
          relevantExpYears: relevantExpYears ? parseFloat(relevantExpYears) : null,
          currentSalary,
          expectedSalary,
          noticePeriod,
          reasonForLeaving,
          offerInHand,
          thisJobCallLogs: [newLog, ...selectedCandidate.thisJobCallLogs],
        });
      }
    } catch (err: any) {
      setCallValidationError(err.message || "Failed to log call outcome");
    } finally {
      setLoggingCall(false);
    }
  };

  // Update Candidate Status
  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/mandates/${mandateId}/candidate-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setSuccessMessage(`Candidate status updated to: ${newStatus.replace(/_/g, " ")}`);
      fetchWorkspace();

      if (selectedCandidate && selectedCandidate.submissionId === submissionId) {
        setSelectedCandidate({ ...selectedCandidate, status: newStatus as any });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  // Add Candidate from Pool to this Mandate
  const handleAttachFromPool = async (candidateId: string) => {
    setAttachingId(candidateId);
    try {
      const res = await fetch(`/api/mandates/${mandateId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to attach candidate");
      }

      setSuccessMessage(`Candidate attached to this job successfully!`);
      fetchWorkspace();
    } catch (err: any) {
      alert(err.message || "Failed to attach candidate");
    } finally {
      setAttachingId(null);
    }
  };

  // Handle Multi-File Upload & Gemini AI Parse (Up to 5 files, 10MB limit)
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
    setActiveBatchIndex(0);
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
      setParseError(err.message || "Failed to parse resumes with Gemini AI.");
    } finally {
      setParsing(false);
    }
  };

  // Save Batch Ingested Candidates and Attach to this Mandate
  const handleSaveBatchIngest = async () => {
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
            mandateId,
          }),
        });

        if (res.ok) {
          savedCount++;
        } else {
          try {
            const errData = await res.json();
            lastErrorMessage = errData.error || `HTTP ${res.status}`;
          } catch (_) {
            lastErrorMessage = `Server returned ${res.status}: ${res.statusText}`;
          }
        }
      }

      if (savedCount > 0) {
        setSuccessMessage(`Successfully ingested and attached ${savedCount} candidate(s) to this job!`);
        setIsIngestModalOpen(false);
        setUploadFiles([]);
        setBatchResults([]);
        await fetchWorkspace();
      } else {
        setParseError(`Failed to save candidates: ${lastErrorMessage || "Unable to save to database."}`);
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to save ingested candidates.");
    } finally {
      setSavingBatch(false);
    }
  };

  // Generate Client Portal Share Link & Dispatch Shortlist Email
  const handleGenerateSharePortal = async () => {
    if (selectedForSharing.length === 0) return;
    setGeneratingPortal(true);

    try {
      const res = await fetch(`/api/mandates/${mandateId}/submit-to-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIds: selectedForSharing,
          feedbackSlaHours: 48,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate client presentation portal.");
      }

      const portalUrl = data.shareableUrl || (data.portalShare && data.portalShare.shareableUrl) || data.portalUrl || (data.portalToken ? `/portal/${data.portalToken}` : "");
      const fullUrl = portalUrl.startsWith("http") ? portalUrl : `${window.location.origin}${portalUrl}`;

      setGeneratedPortalUrl(fullUrl);
      setSuccessMessage(
        data.message || `Presentation link generated with 48h Feedback SLA for ${selectedForSharing.length} candidates!`
      );
      fetchWorkspace();
    } catch (err: any) {
      alert(err.message || "Failed to generate presentation link.");
    } finally {
      setGeneratingPortal(false);
    }
  };

  // 1-Click Threaded Client Reminder Chase (CF-04)
  const handleChaseClient = async () => {
    if (!confirm("Send polite in-thread reminder email to the hiring manager for unreviewed candidate profiles?")) {
      return;
    }
    setChasingClient(true);
    try {
      const res = await fetch(`/api/mandates/${mandateId}/chase-client`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reminder.");
      }
      setSuccessMessage(data.message || "Reminder email sent to hiring manager!");
      fetchWorkspace();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch client chase.");
    } finally {
      setChasingClient(false);
    }
  };

  // Helper to determine if callback is due today or overdue
  const isCallbackDue = (c: AttachedCandidate) => {
    if (c.lastCallOutcome !== "CONNECTED_CALLBACK" || !c.nextCallbackAt) return false;
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const cbTime = new Date(c.nextCallbackAt).getTime();
    return cbTime < todayEnd;
  };

  const callbacksDueCount = candidates.filter(isCallbackDue).length;

  // Filter candidates in table
  const filteredCandidates = candidates
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.fullName.toLowerCase().includes(q) ||
        (c.currentCompany && c.currentCompany.toLowerCase().includes(q)) ||
        (c.currentTitle && c.currentTitle.toLowerCase().includes(q)) ||
        c.phone.includes(q);

      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

      let matchesTab = true;
      if (activeQuickTab === "CALLBACKS_TODAY") {
        matchesTab = isCallbackDue(c);
      } else if (activeQuickTab === "READY_TO_SHARE") {
        matchesTab = c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED";
      }

      return matchesSearch && matchesStatus && matchesTab;
    })
    .sort((a, b) => {
      if (activeQuickTab === "CALLBACKS_TODAY") {
        const timeA = a.nextCallbackAt ? new Date(a.nextCallbackAt).getTime() : Infinity;
        const timeB = b.nextCallbackAt ? new Date(b.nextCallbackAt).getTime() : Infinity;
        return timeA - timeB;
      }
      return 0;
    });

  // Count candidates ready to share (Connected & Profile Matched + Not Shared)
  const readyToShareCount = candidates.filter(
    (c) => c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED"
  ).length;

  // Count candidates currently shared with company awaiting feedback
  const sharedWithClientCount = candidates.filter(
    (c) => c.status === "SHARED_WITH_COMPANY" || c.stage === "SUBMITTED_TO_CLIENT"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-700">Opening Mandate Execution Desk...</p>
        </div>
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 text-center">
        <p className="text-sm font-bold text-slate-700">Search Mandate not found.</p>
        <Link href="/cockpit?tab=mandates" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          &larr; Return to Mandates List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <UserSandboxBanner />
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/cockpit?tab=mandates"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Mandates</span>
              </Link>

              <div className="h-5 w-px bg-slate-200" />

              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-base">{mandate.title}</span>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                  {mandate.client.name}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  SLA: {mandate.slaStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <UserSandboxToggle />

              <Link
                href="/cockpit/candidates"
                className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>Candidate Bank</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: TOP MANDATE SPECIFICATION & JOB DESCRIPTION CARD             */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-slate-700" />
                <h1 className="text-base font-black text-slate-900">{mandate.title}</h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Client: <strong>{mandate.client.name}</strong> • Work Mode: <strong>{mandate.workMode}</strong> • Location: <strong>{mandate.location || "Remote / Flexible"}</strong> • Experience: <strong>{mandate.minExp && mandate.maxExp ? `${mandate.minExp} - ${mandate.maxExp} Years` : mandate.minExp ? `${mandate.minExp}+ Years` : "Open"}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs flex-wrap gap-y-2">
              <div className="bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
                Exp: {mandate.minExp && mandate.maxExp ? `${mandate.minExp} - ${mandate.maxExp} Yrs` : mandate.minExp ? `${mandate.minExp}+ Yrs` : "Open"}
              </div>
              <div className="bg-purple-50 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-200 font-bold">
                Fee: {mandate.feePercentage}% CTC
              </div>
              <div className="bg-blue-50 text-blue-900 px-3 py-1.5 rounded-xl border border-blue-200 font-bold">
                Guarantee: {mandate.guaranteeDays}d
              </div>
              <div className="bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 font-bold">
                Target CTC: {mandate.minCtc ? `${(mandate.minCtc / 100000).toFixed(1)}L` : "Open"} - {mandate.maxCtc ? `${(mandate.maxCtc / 100000).toFixed(1)}L` : "Negotiable"}
              </div>
            </div>
          </div>

          {/* Formatted JD & Client Contact Accordion / Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            <div className="lg:col-span-2 space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                Job Description & Requirements
              </span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-slate-700 leading-relaxed whitespace-pre-wrap font-sans max-h-36 overflow-y-auto">
                {mandate.description || "No full JD text provided."}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {mandate.skills.map((s, idx) => (
                  <span key={idx} className="bg-brand-surfaceLight border border-brand-surface text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                Client Organization & Contact
              </span>
              <div className="space-y-1.5 text-slate-600">
                <div><strong>Company:</strong> {mandate.client.name}</div>
                <div><strong>Industry:</strong> {mandate.client.industry || "Technology / Corporate"}</div>
                {mandate.contact && (
                  <>
                    <div className="border-t border-slate-200 pt-1.5">
                      <strong>Hiring Lead:</strong> {mandate.contact.name} ({mandate.contact.designation || "Lead"})
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span>{mandate.contact.email}</span>
                    </div>
                    {mandate.contact.phone && (
                      <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{mandate.contact.phone}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: RECRUITER ACTION TOOLBAR (POOL MATCH, DIRECT INGEST, SHARE)   */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* BUTTON 1: BROWSE MATCHING CANDIDATES IN POOL */}
            <button
              onClick={() => setIsPoolModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Browse Matching Candidates in Pool ({matchingPool.length})</span>
            </button>

            {/* BUTTON 2: INGEST CANDIDATES DIRECTLY TO THIS JOB */}
            <button
              onClick={() => {
                setIsIngestModalOpen(true);
                setUploadFiles([]);
                setBatchResults([]);
                setParseError(null);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>+ Ingest Resumes for this Job</span>
            </button>
          </div>

          {/* BUTTON 3: SHARE WITH CLIENT PORTAL (SMART HELPER) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsShareModalOpen(true);
                setGeneratedPortalUrl(null);
                setCopiedPortalUrl(false);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Share Shortlist with Client Portal</span>
              {readyToShareCount > 0 && (
                <span className="bg-white text-blue-900 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                  {readyToShareCount} Ready
                </span>
              )}
            </button>

            {/* 1-CLICK CLIENT CHASE REMINDER (CF-04) */}
            {sharedWithClientCount > 0 && (
              <button
                type="button"
                onClick={handleChaseClient}
                disabled={chasingClient}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <BellRing className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                <span>{chasingClient ? "Sending Reminder..." : "⚡ Chase Client for Feedback"}</span>
                <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                  {sharedWithClientCount} Awaiting
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: ATTACHED CANDIDATES LIST (THE CORE RECRUITER DESK)           */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Quick Filter Segmented Control */}
          <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveQuickTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeQuickTab === "ALL"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              All Candidates ({candidates.length})
            </button>

            <button
              onClick={() => setActiveQuickTab("CALLBACKS_TODAY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeQuickTab === "CALLBACKS_TODAY"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-amber-900 bg-amber-100/70 hover:bg-amber-100 border border-amber-300/80"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Callbacks Due Today</span>
              {callbacksDueCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  activeQuickTab === "CALLBACKS_TODAY" ? "bg-white text-amber-900" : "bg-amber-600 text-white"
                }`}>
                  {callbacksDueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveQuickTab("READY_TO_SHARE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeQuickTab === "READY_TO_SHARE"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-blue-900 bg-blue-50 hover:bg-blue-100/70 border border-blue-200"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Ready to Share</span>
              {readyToShareCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  activeQuickTab === "READY_TO_SHARE" ? "bg-white text-blue-900" : "bg-blue-600 text-white"
                }`}>
                  {readyToShareCount}
                </span>
              )}
            </button>
          </div>

          {/* Table Filters & Search */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
            <div className="flex items-center space-x-3 flex-1 max-w-lg">
              <div className="relative rounded-lg shadow-sm flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by candidate name, company, title, phone..."
                  className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-700"
              >
                <option value="ALL">All Statuses ({candidates.length})</option>
                <option value="NOT_SHARED">Not Shared with Company</option>
                <option value="SHARED_WITH_COMPANY">Shared with Company</option>
                <option value="SELECTED_FOR_NEXT_ROUND">Selected for Next Round</option>
                <option value="OFFERED">Offered</option>
                <option value="HOLD">Hold</option>
                <option value="REJECTED">Rejected</option>
                <option value="JOINED">Joined</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredCandidates.length}</strong> candidates in this job
            </div>
          </div>

          {/* Candidates Table */}
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No candidates in this mandate yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Click <strong>"Browse Matching Candidates in Pool"</strong> or <strong>"+ Ingest Resumes for this Job"</strong> above!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-brand-surfaceLight text-slate-700 uppercase font-semibold tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3">Candidate & Role</th>
                    <th scope="col" className="px-4 py-3">Date Sourced</th>
                    <th scope="col" className="px-4 py-3">Source Name</th>
                    <th scope="col" className="px-4 py-3">Mobile Number</th>
                    <th scope="col" className="px-5 py-3">Last Call Outcome</th>
                    <th scope="col" className="px-4 py-3">Company Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredCandidates.map((c) => {
                    const dispObj = CALL_DISPOSITIONS.find((d) => d.value === c.lastCallOutcome);
                    const statusObj = CANDIDATE_STATUSES.find((s) => s.value === c.status) || CANDIDATE_STATUSES[0];

                    return (
                      <tr
                        key={c.submissionId}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenCandidateModal(c)}
                      >
                        {/* 1. Candidate Name & Role */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center space-x-1.5">
                            <span>{c.fullName}</span>
                            {c.isSilverMedalist && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center space-x-0.5">
                                <Award className="h-2.5 w-2.5 text-amber-700" />
                                <span>SILVER</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {c.currentTitle || "Professional"} {c.currentCompany ? `at ${c.currentCompany}` : ""}
                          </div>
                        </td>

                        {/* 2. Date of Sourcing */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(c.dateOfSourcing).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        {/* 3. Source Name */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {c.source.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* 4. Mobile Number (From resume) */}
                        <td className="px-4 py-3.5 font-mono text-slate-800 font-semibold whitespace-nowrap">
                          {c.phone || "N/A"}
                        </td>

                        {/* 5. Last Call Outcome */}
                        <td className="px-5 py-3.5">
                          {dispObj ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${dispObj.badge}`}>
                                  {dispObj.label}
                                </span>
                                {c.lastCallOutcome === "CONNECTED_CALLBACK" && c.nextCallbackAt && (() => {
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

                        {/* 6. Company Status Dropdown */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={c.status}
                            onChange={(e) => handleUpdateStatus(c.submissionId, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${statusObj.badge}`}
                          >
                            {CANDIDATE_STATUSES.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 7. Action Button */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenCandidateModal(c)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-brand-surfaceLight hover:bg-brand-surface border border-brand-surfaceDark text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <PhoneCall className="h-3 w-3 text-slate-700" />
                            <span>Log Call & Details</span>
                          </button>
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

      {/* ========================================================================= */}
      {/* CENTERED CANDIDATE DETAIL & CALL SCREENING MODAL                          */}
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
                  <span className="text-[10px] text-slate-500 font-mono">Source: {selectedCandidate.source}</span>
                  {selectedCandidate.qualification && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                      {selectedCandidate.qualification}
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
                  <span className="text-slate-400 block text-[10px]">Qualification</span>
                  <strong className="text-slate-900 text-xs block">{selectedCandidate.qualification || "N/A"}</strong>
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
                      placeholder="e.g. Candidate confirmed notice period is negotiable to 30 days, interested in robotics tech stack..."
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

              {/* CALL & ACTIVITY HISTORY FOR THIS JOB */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Call & Activity History (This Job)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedCandidate.thisJobCallLogs.length} interactions logged
                  </span>
                </h3>

                {/* 1. Client Review Portal Feedback Event */}
                {(selectedCandidate.clientDecision || selectedCandidate.submittedToClientAt) && (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="h-4 w-4 text-blue-700" />
                        <strong className="text-slate-900 text-xs font-bold">Client Review Portal Telemetry</strong>
                      </div>
                      {selectedCandidate.clientFeedbackAt && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Decision logged: {new Date(selectedCandidate.clientFeedbackAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Decision Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedCandidate.clientDecision === "SHORTLISTED_FOR_INTERVIEW" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mr-1" />
                          Shortlisted for Interview by Client
                        </span>
                      )}
                      {selectedCandidate.clientDecision === "REJECTED_WITH_FEEDBACK" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-700 mr-1" />
                          Rejected by Client: {selectedCandidate.rejectionReason || "Feedback Provided"}
                        </span>
                      )}
                      {selectedCandidate.clientDecision === "INFO_REQUESTED" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700 mr-1" />
                          Information Requested / On Hold by Client
                        </span>
                      )}
                      {(!selectedCandidate.clientDecision || selectedCandidate.clientDecision === "PENDING_REVIEW") && selectedCandidate.submittedToClientAt && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          <Clock className="h-3.5 w-3.5 text-blue-700 mr-1" />
                          Shared with Client — Awaiting Feedback
                        </span>
                      )}
                      {selectedCandidate.submittedToClientAt && (
                        <span className="text-[11px] text-slate-500">
                          (Shared: {new Date(selectedCandidate.submittedToClientAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>

                    {/* Proposed Interview Times */}
                    {selectedCandidate.preferredInterviewTimes && (
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs text-slate-800 space-y-1">
                        <span className="text-[11px] font-extrabold text-emerald-800 flex items-center">
                          <Calendar className="h-3 w-3 text-emerald-700 mr-1" />
                          <span>Client Proposed Interview Availability:</span>
                        </span>
                        <p className="font-semibold text-slate-900 pl-4">
                          {selectedCandidate.preferredInterviewTimes}
                        </p>
                      </div>
                    )}

                    {/* Client Feedback Comments */}
                    {selectedCandidate.clientFeedbackNotes && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1">
                        <span className="text-[11px] font-extrabold text-slate-700 flex items-center">
                          <MessageSquare className="h-3 w-3 text-slate-500 mr-1" />
                          <span>Client Comments / Notes:</span>
                        </span>
                        <p className="italic text-slate-700 pl-4">
                          "{selectedCandidate.clientFeedbackNotes}"
                        </p>
                      </div>
                    )}

                    {/* Client Question Text */}
                    {selectedCandidate.clientQuestionText && (
                      <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs text-slate-800 space-y-1">
                        <span className="text-[11px] font-extrabold text-amber-800 flex items-center">
                          <AlertTriangle className="h-3 w-3 text-amber-600 mr-1" />
                          <span>Client Question / Clarification Requested:</span>
                        </span>
                        <p className="italic text-slate-800 pl-4">
                          "{selectedCandidate.clientQuestionText}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedCandidate.thisJobCallLogs.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    No calls logged for this role yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {selectedCandidate.thisJobCallLogs.map((log) => {
                      const disp = CALL_DISPOSITIONS.find((d) => d.value === log.disposition);
                      return (
                        <div key={log.id} className="p-3 space-y-1 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${disp?.badge || "bg-slate-100 text-slate-800"}`}>
                              {disp?.label || log.disposition}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.calledAt).toLocaleString()} by <strong>{log.recruiterName}</strong>
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

              {/* HISTORY FROM OTHER JOBS IN THE AGENCY */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>History From Other Agency Jobs ({selectedCandidate.otherJobsHistory.length})</span>
                  <span className="text-[10px] text-purple-700 font-bold">Cross-Role Intelligence</span>
                </h3>

                {selectedCandidate.otherJobsHistory.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    This candidate has not been considered for other jobs in your agency yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCandidate.otherJobsHistory.map((otherJob, idx) => (
                      <div key={idx} className="p-3.5 bg-purple-50/40 border border-purple-200/70 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-slate-900 text-xs">{otherJob.mandateTitle}</strong>
                            <span className="text-[11px] text-slate-500 block">{otherJob.clientName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                            Stage: {otherJob.stage.replace(/_/g, " ")}
                          </span>
                        </div>

                        {otherJob.callLogs.length > 0 && (
                          <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-purple-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Past Call Outcome:</span>
                            <div className="font-semibold text-slate-800">
                              {otherJob.callLogs[0].disposition.replace(/_/g, " ")}
                            </div>
                            {otherJob.callLogs[0].notes && <p className="italic">"{otherJob.callLogs[0].notes}"</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                Mandate: <strong>{mandate.title}</strong> • Client: <strong>{mandate.client.name}</strong>
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

      {/* ========================================================================= */}
      {/* MODAL 1: BROWSE MATCHING CANDIDATES IN POOL (HIGH TO LOW SKILL MATCH)     */}
      {/* ========================================================================= */}
      {isPoolModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Matching Candidates in Existing Pool</h3>
                  <p className="text-[10px] text-purple-800">
                    Sorted by Skill Match % against '{mandate.title}'
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPoolModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {matchingPool.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  All agency pool candidates are already attached to this mandate!
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingPool.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-purple-50/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <strong className="text-slate-900 text-sm">{p.fullName}</strong>
                          <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-300">
                            {p.matchScore}% Match
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.currentTitle} • {p.totalExpYears}y Exp • {p.noticePeriodDays}d Notice
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.skills.slice(0, 4).map((s, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAttachFromPool(p.id)}
                        disabled={attachingId === p.id}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap text-xs disabled:opacity-50 flex items-center space-x-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{attachingId === p.id ? "Attaching..." : "+ Add to this Mandate"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsPoolModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 2: INGEST RESUMES DIRECTLY TO THIS JOB (BATCH UP TO 5 CVS) - RC-02   */}
      {/* ========================================================================= */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div
            className={`bg-white rounded-3xl shadow-2xl border border-slate-200 ${
              batchResults.length > 0 && !parsing ? "max-w-5xl" : "max-w-2xl"
            } w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs flex flex-col max-h-[92vh]`}
          >
            {/* Modal Header with Botspring Gold (#fce17c) */}
            <div className="bg-[#fce17c] px-6 py-4 border-b border-[#ebd06b] flex items-center justify-between text-slate-900 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/80 border border-[#e8c757] flex items-center justify-center text-slate-900 shadow-2xs font-black">
                  <Sparkles className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-slate-900 text-sm tracking-tight">
                      CV Intake Engine for '{mandate.title}' (RC-02)
                    </h3>
                    <span className="bg-white/90 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded border border-[#ebd06b] uppercase">
                      Mandate Direct
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-800 font-medium">
                    {batchResults.length > 0 && !parsing
                      ? "Split-screen review: Inspect extracted fields, adjust skills & attach directly to this mandate"
                      : "Drag and drop up to 5 resumes for automated entity extraction & mandate attachment"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsIngestModalOpen(false);
                  setBatchResults([]);
                  setUploadFiles([]);
                  setParseError(null);
                  setActiveBatchIndex(0);
                }}
                className="text-slate-700 hover:text-slate-900 text-xl font-bold leading-none cursor-pointer w-7 h-7 rounded-lg hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                  <div className="flex-1">
                    <strong className="block font-bold">Upload / Parsing Issue</strong>
                    <span className="text-xs">{parseError}</span>
                  </div>
                </div>
              )}

              {/* State 1: Dropzone */}
              {batchResults.length === 0 && !parsing && (
                <div className="space-y-4">
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-[#fce17c] border border-[#ebd06b] flex items-center justify-center text-slate-900 font-bold">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Target Job Mandate</span>
                        <span className="text-xs font-black text-slate-900">{mandate.title} ({mandate.client.name})</span>
                      </div>
                    </div>
                    <span className="bg-white text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-2xs">
                      ✓ Auto-Attach Enabled
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-amber-300 hover:border-amber-400 rounded-3xl p-10 text-center bg-amber-50/20 hover:bg-amber-50/40 transition-all">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt"
                      onChange={handleMultiFileSelect}
                      id="mandate-resume-upload-batch"
                      className="hidden"
                    />
                    <label htmlFor="mandate-resume-upload-batch" className="cursor-pointer block">
                      <div className="w-16 h-16 rounded-2xl bg-[#fce17c]/40 border border-[#ebd06b] flex items-center justify-center text-slate-900 mx-auto mb-3 shadow-2xs">
                        <UploadCloud className="h-8 w-8 text-slate-800" />
                      </div>
                      <span className="font-black text-slate-900 text-sm hover:underline block">
                        Click to Select Resumes (PDF, DOCX)
                      </span>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto font-medium">
                        Select <strong>up to 5 resumes</strong> at once. Each file must be under <strong>10MB</strong>.
                      </p>
                      <div className="mt-4 inline-flex items-center space-x-2 text-[11px] font-bold text-slate-700 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                        <span>✓ Permanent CV document storage</span>
                        <span>•</span>
                        <span>✓ Gemini AI entity extraction</span>
                        <span>•</span>
                        <span>✓ Auto-attach to pipeline</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* State 2: Active Parsing Progress Indicator */}
              {parsing && (
                <div className="p-8 bg-slate-50/80 rounded-3xl border border-slate-200 text-center space-y-4">
                  <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-2 text-sm font-black text-slate-900">
                      <span>Parsing Resume {parseProgress.current} of {parseProgress.total}</span>
                      <span className="text-xs font-bold text-amber-700 font-mono">({parseProgress.percent}%)</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate max-w-md mx-auto">
                      Extracting: <span className="font-mono text-slate-900 font-bold">{parseProgress.currentFileName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Extracting candidate entities, qualifications & saving file copies to server
                    </p>
                  </div>

                  <div className="max-w-md mx-auto space-y-1.5">
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#fce17c] rounded-full transition-all duration-300 shadow-2xs border border-[#ebd06b]"
                        style={{ width: `${Math.max(8, parseProgress.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>File {parseProgress.current} of {parseProgress.total}</span>
                      <span>{parseProgress.percent}% Complete</span>
                    </div>
                  </div>
                </div>
              )}

              {/* State 3: Split-Screen Review & Human-Correction Drawer (RC-02) */}
              {batchResults.length > 0 && !parsing && (
                <div className="space-y-4">
                  {/* Top Batch Dossiers Selector Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1 flex-shrink-0">
                        Parsed Dossiers:
                      </span>
                      {batchResults.map((r, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveBatchIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer flex-shrink-0 border ${
                            activeBatchIndex === idx
                              ? "bg-[#fce17c] text-slate-900 border-[#ebd06b] shadow-xs ring-1 ring-[#ebd06b]"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-500" />
                          <span className="truncate max-w-[120px] font-bold">
                            {r.parsed?.fullName || r.fileName}
                          </span>
                          {r.success ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 ml-0.5" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-rose-600 ml-0.5" />
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBatchResults([]);
                        setUploadFiles([]);
                        setParseError(null);
                        setActiveBatchIndex(0);
                      }}
                      className="text-xs text-blue-600 hover:underline font-bold flex-shrink-0 flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Upload Different Files</span>
                    </button>
                  </div>

                  {/* Active Candidate Split-Screen Container */}
                  {batchResults[activeBatchIndex] && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* LEFT PANE: Document Source & Raw Text Excerpt (5 cols) */}
                      <div className="md:col-span-5 space-y-3">
                        {/* Document Metadata Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                                <FileText className="h-4 w-4 text-slate-700" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 text-xs block truncate max-w-[180px]">
                                  {batchResults[activeBatchIndex].fileName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {batchResults[activeBatchIndex].fileSize
                                    ? `${Math.round(batchResults[activeBatchIndex].fileSize / 1024)} KB`
                                    : "Document File"}
                                </span>
                              </div>
                            </div>

                            {batchResults[activeBatchIndex].resumeUrl && (
                              <a
                                href={batchResults[activeBatchIndex].resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <span>View PDF</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>

                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center space-x-2 text-[11px] text-emerald-900 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span>Duplicate Check Passed — Record Ready</span>
                          </div>
                        </div>

                        {/* Target Mandate Badge */}
                        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-1">
                          <label className="block font-bold text-slate-700 text-xs">
                            Mandate Pipeline Target
                          </label>
                          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2">
                            <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {mandate.title} ({mandate.client.name})
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Candidate will be saved in master talent pool & submitted directly to this job.
                          </p>
                        </div>

                        {/* Raw Resume Text Preview Box */}
                        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Original CV Text Excerpt
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Cross-Verification</span>
                          </div>
                          <div className="max-h-56 overflow-y-auto bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[10px] leading-relaxed select-text">
                            {batchResults[activeBatchIndex].rawResumeText ||
                              batchResults[activeBatchIndex].parsed?.summary ||
                              "No raw text available. Review extracted attributes on right."}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT PANE: Human-Editable Form Fields (7 cols) */}
                      <div className="md:col-span-7 bg-slate-50/70 rounded-2xl p-4 border border-slate-200 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h5 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            <span>AI-Extracted Structured Attributes</span>
                          </h5>
                          <span className="text-[10px] text-slate-500 italic">Editable before saving</span>
                        </div>

                        {batchResults[activeBatchIndex].parsed ? (
                          <div className="space-y-3">
                            {/* Candidate Full Name */}
                            <div>
                              <label className="block font-bold text-slate-700 mb-0.5 text-[11px]">
                                Full Legal Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={batchResults[activeBatchIndex].parsed.fullName || ""}
                                onChange={(e) => updateActiveParsedField("fullName", e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-bold focus:ring-2 focus:ring-[#fce17c] focus:outline-none"
                              />
                            </div>

                            {/* Designation & Company */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Current Designation
                                </label>
                                <input
                                  type="text"
                                  value={batchResults[activeBatchIndex].parsed.currentTitle || ""}
                                  onChange={(e) => updateActiveParsedField("currentTitle", e.target.value)}
                                  placeholder="Senior Software Engineer"
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Current Company
                                </label>
                                <input
                                  type="text"
                                  value={batchResults[activeBatchIndex].parsed.currentCompany || ""}
                                  onChange={(e) => updateActiveParsedField("currentCompany", e.target.value)}
                                  placeholder="Swiggy"
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
                                />
                              </div>
                            </div>

                            {/* Experience & Notice Period */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Total Experience (Years)
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={batchResults[activeBatchIndex].parsed.totalExpYears ?? 0}
                                  onChange={(e) =>
                                    updateActiveParsedField("totalExpYears", parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Notice Period (Days)
                                </label>
                                <input
                                  type="number"
                                  value={batchResults[activeBatchIndex].parsed.noticePeriodDays ?? 30}
                                  onChange={(e) =>
                                    updateActiveParsedField("noticePeriodDays", parseInt(e.target.value, 10) || 0)
                                  }
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-bold"
                                />
                              </div>
                            </div>

                            {/* Compensation Trajectory (CTC) */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Current CTC (INR Annual)
                                </label>
                                <input
                                  type="text"
                                  value={batchResults[activeBatchIndex].parsed.currentCtc || ""}
                                  onChange={(e) => updateActiveParsedField("currentCtc", e.target.value)}
                                  placeholder="e.g. 2400000"
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Expected CTC (INR Annual)
                                </label>
                                <input
                                  type="text"
                                  value={batchResults[activeBatchIndex].parsed.expectedCtc || ""}
                                  onChange={(e) => updateActiveParsedField("expectedCtc", e.target.value)}
                                  placeholder="e.g. 3200000"
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono font-bold text-emerald-800"
                                />
                              </div>
                            </div>

                            {/* Mobile Phone & Email */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Candidate Mobile / WhatsApp
                                </label>
                                <input
                                  type="text"
                                  value={batchResults[activeBatchIndex].parsed.phone || ""}
                                  onChange={(e) => updateActiveParsedField("phone", e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                  Candidate Email
                                </label>
                                <input
                                  type="email"
                                  value={batchResults[activeBatchIndex].parsed.email || ""}
                                  onChange={(e) => updateActiveParsedField("email", e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
                                />
                              </div>
                            </div>

                            {/* Qualification */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-0.5 text-[11px]">
                                Highest Qualification / Degree
                              </label>
                              <input
                                type="text"
                                value={batchResults[activeBatchIndex].parsed.qualification || ""}
                                onChange={(e) => updateActiveParsedField("qualification", e.target.value)}
                                placeholder="B.Tech Computer Science, IIT Bombay"
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
                              />
                            </div>

                            {/* Interactive Skills Tags */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                                Primary Skills Tags
                              </label>
                              <div className="flex flex-wrap gap-1.5 mb-2 bg-white p-2.5 rounded-xl border border-slate-200 min-h-[42px]">
                                {Array.isArray(batchResults[activeBatchIndex].parsed.skills) &&
                                batchResults[activeBatchIndex].parsed.skills.length > 0 ? (
                                  batchResults[activeBatchIndex].parsed.skills.map((sk: string, sIdx: number) => (
                                    <span
                                      key={sIdx}
                                      className="bg-[#fce17c]/40 text-slate-900 border border-[#ebd06b] text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center space-x-1"
                                    >
                                      <span>{sk}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(sk)}
                                        className="text-slate-600 hover:text-slate-900 cursor-pointer ml-1 leading-none font-black"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">No skill tags extracted yet</span>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={newSkillInput}
                                  onChange={(e) => setNewSkillInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddSkill();
                                    }
                                  }}
                                  placeholder="Add skill tag (press Enter)..."
                                  className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddSkill}
                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  + Add Skill
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-rose-600" />
                            <p className="font-bold text-xs">{batchResults[activeBatchIndex].error || "Parse failed"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Modal Action Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-200 gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{batchResults.filter((r) => r.success).length} Profile(s) ready to attach to '{mandate.title}'</span>
                    </span>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsIngestModalOpen(false);
                          setBatchResults([]);
                          setUploadFiles([]);
                          setParseError(null);
                        }}
                        className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBatchIngest}
                        disabled={savingBatch || batchResults.filter((r) => r.success).length === 0}
                        className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 border border-[#e5bf00] text-xs"
                      >
                        {savingBatch ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-800" />
                            <span>Saving to Mandate...</span>
                          </>
                        ) : (
                          <span>
                            Save & Attach {batchResults.filter((r) => r.success).length} Candidate(s)
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SHARE WITH CLIENT PORTAL (SMART HELPER)                         */}
      {/* ========================================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-blue-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Share Shortlist with Client Portal</h3>
                  <p className="text-[10px] text-blue-800">Initiates 48-Hour Feedback SLA Countdown</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]">
                <strong>⚡ Smart Sharing Filter:</strong> Candidates with call outcome <strong>"Connected — Interested & Profile Matched"</strong> and status <strong>"Not Shared with Company"</strong> are automatically highlighted.
              </div>

              <span className="font-bold text-slate-900 text-xs block">
                Select Candidates to Include in Shortlist Presentation:
              </span>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {candidates.map((c) => {
                  const isChecked = selectedForSharing.includes(c.candidateId);
                  const isReady = c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED";

                  return (
                    <div
                      key={c.candidateId}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedForSharing(selectedForSharing.filter((id) => id !== c.candidateId));
                        } else {
                          setSelectedForSharing([...selectedForSharing, c.candidateId]);
                        }
                      }}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? "bg-blue-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{c.fullName}</span>
                          {isReady && (
                            <span className="bg-emerald-100 text-emerald-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300">
                              READY TO SHARE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.currentTitle} • Call Outcome: {c.lastCallOutcome ? c.lastCallOutcome.replace(/_/g, " ") : "Not Called"}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-600 h-4 w-4"
                      />
                    </div>
                  );
                })}
              </div>

              {generatedPortalUrl && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="font-extrabold text-emerald-900 text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Presentation Link Ready!</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedPortalUrl}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white text-slate-800 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPortalUrl);
                        setCopiedPortalUrl(true);
                        setTimeout(() => setCopiedPortalUrl(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      {copiedPortalUrl ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={generatingPortal || selectedForSharing.length === 0}
                  onClick={handleGenerateSharePortal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {generatingPortal ? "Generating..." : `Generate Link (${selectedForSharing.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

