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
} from "lucide-react";

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
  submittedToClientAt: string | null;
  lastCallOutcome: string | null;
  lastCallNotes: string | null;
  lastCallAt: string | null;
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Centered Call Screening Modal State (with 7 Call-Screening Metrics)
  const [selectedCandidate, setSelectedCandidate] = useState<AttachedCandidate | null>(null);
  const [callDisposition, setCallDisposition] = useState<string>("");
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

  // Pool Browse Modal State
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  // Multi-Resume Ingestion Modal State (Up to 5 files, 10MB limit)
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);

  // Client Portal Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedForSharing, setSelectedForSharing] = useState<string[]>([]);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [generatedPortalUrl, setGeneratedPortalUrl] = useState<string | null>(null);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);

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
    setCallDisposition(""); // Mandatory selection required
    setCallNotes("");
    setCallValidationError(null);
    setReadyToRelocate(cand.readyToRelocate || "Yes");
    setRelevantExpYears(cand.relevantExpYears !== null && cand.relevantExpYears !== undefined ? String(cand.relevantExpYears) : "");
    setCurrentSalary(cand.currentSalary || (cand.currentCtc ? `${cand.currentCtc} LPA` : ""));
    setExpectedSalary(cand.expectedSalary || (cand.expectedCtc ? `${cand.expectedCtc} LPA` : ""));
    setNoticePeriod(cand.noticePeriod || (cand.noticePeriodDays ? `${cand.noticePeriodDays} Days` : ""));
    setReasonForLeaving(cand.reasonForLeaving || "");
    setOfferInHand(cand.offerInHand || "No");
  };

  // Log Call Outcome & Screening Metrics
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    if (!callDisposition || callDisposition.trim() === "") {
      setCallValidationError("Please select a Call Outcome Disposition before saving.");
      return;
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
      setCallDisposition("");
      fetchWorkspace();

      // Update selectedCandidate state in modal
      if (selectedCandidate) {
        const newLog = {
          id: data.callLog.id,
          disposition: callDisposition,
          notes: callNotes,
          calledAt: new Date().toISOString(),
          recruiterName: session?.user?.name || "You",
        };
        setSelectedCandidate({
          ...selectedCandidate,
          lastCallOutcome: callDisposition,
          lastCallNotes: callNotes,
          lastCallAt: new Date().toISOString(),
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

    try {
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/candidates/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse resume document(s).");
      }

      if (data.results && Array.isArray(data.results)) {
        setBatchResults(data.results);
      } else if (data.parsed) {
        setBatchResults([{
          fileName: fileList[0].name,
          success: true,
          parsed: data.parsed,
          resumeUrl: data.resumeUrl,
          rawResumeText: data.rawResumeText,
        }]);
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
      for (const item of batchResults) {
        if (!item.success || !item.parsed) continue;
        const p = item.parsed;
        const res = await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: p.fullName || "Candidate",
            email: p.email || `${Date.now()}_candidate@example.com`,
            phone: p.phone || "N/A",
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
        }
      }

      setSuccessMessage(`Successfully ingested and attached ${savedCount} candidate(s) to this job!`);
      setIsIngestModalOpen(false);
      setUploadFiles([]);
      setBatchResults([]);
      fetchWorkspace();
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

  // Filter candidates in table
  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.fullName.toLowerCase().includes(q) ||
      (c.currentCompany && c.currentCompany.toLowerCase().includes(q)) ||
      (c.currentTitle && c.currentTitle.toLowerCase().includes(q)) ||
      c.phone.includes(q);

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Count candidates ready to share (Connected & Profile Matched + Not Shared)
  const readyToShareCount = candidates.filter(
    (c) => c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED"
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
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: ATTACHED CANDIDATES LIST (THE CORE RECRUITER DESK)           */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
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
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${dispObj.badge}`}>
                                {dispObj.label}
                              </span>
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
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Call & Activity History (This Job)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedCandidate.thisJobCallLogs.length} interactions logged
                  </span>
                </h3>

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
      {/* MODAL 2: INGEST RESUMES DIRECTLY TO THIS JOB (BATCH UP TO 5 CVS)         */}
      {/* ========================================================================= */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <UploadCloud className="h-5 w-5 text-slate-800" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">Ingest Resumes for '{mandate.title}'</h3>
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      Up to 5 CVs • Max 10MB each
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Extracts candidate details & permanently archives resume files on server</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsIngestModalOpen(false);
                  setBatchResults([]);
                  setUploadFiles([]);
                  setParseError(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                  <div className="flex-1">
                    <strong className="block font-bold">Upload / Parsing Issue</strong>
                    <span className="text-xs">{parseError}</span>
                  </div>
                </div>
              )}

              {batchResults.length === 0 && !parsing && (
                <div className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-3xl p-10 text-center bg-slate-50/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleMultiFileSelect}
                    id="mandate-resume-upload-batch"
                    className="hidden"
                  />
                  <label htmlFor="mandate-resume-upload-batch" className="cursor-pointer block">
                    <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <span className="font-extrabold text-slate-900 text-sm hover:underline block">
                      Click to Select Resumes (PDF, DOCX)
                    </span>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                      Select <strong>up to 5 resumes</strong> at once. Each file must be under <strong>10MB</strong>.
                    </p>
                    <div className="mt-3 inline-flex items-center space-x-2 text-[11px] font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                      <span>✓ Server-side permanent storage</span>
                      <span>•</span>
                      <span>✓ Gemini AI text & entity parsing</span>
                    </div>
                  </label>
                </div>
              )}

              {parsing && (
                <div className="p-12 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Processing {uploadFiles.length} resume(s)...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Extracting candidate entities, qualifications & saving file copies to server
                    </p>
                  </div>
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
                        Review extracted information before attaching to '{mandate.title}'
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
                        setIsIngestModalOpen(false);
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
                      onClick={handleSaveBatchIngest}
                      disabled={savingBatch || batchResults.filter((r) => r.success).length === 0}
                      className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                    >
                      {savingBatch ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
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

