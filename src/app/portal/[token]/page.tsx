"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Check,
  X,
  MessageSquare,
  Calendar,
  ThumbsDown,
  ExternalLink,
  ChevronRight,
  Mail,
  Phone,
  FileText,
  PauseCircle,
  Download,
  Search,
} from "lucide-react";
import { CandidateCard } from "@/components/CandidateCard";

interface PortalCandidate {
  submissionId: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  currentTitle: string | null;
  currentCompany: string | null;
  totalExpYears: number;
  relevantExpYears: number | null;
  expectedCtc: number | null;
  currentCtc: number | null;
  currentSalary: string;
  expectedSalary: string;
  currency: string;
  noticePeriodDays: number;
  noticePeriod: string;
  location: string | null;
  readyToRelocate: string;
  reasonForLeaving: string;
  offerInHand: string;
  qualification: string | null;
  sourceName: string;
  dateOfSourcing: string;
  resumeUrl: string | null;
  skills: string[];
  summary: string | null;
  stage: string;
  clientDecision: string;
  clientFeedbackNotes: string | null;
  preferredInterviewTimes: string | null;
  clientQuestionText: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  feedbackAt: string | null;
  feedbackSlaHours: number;
  hoursElapsed: number;
  hoursRemaining: number;
  slaStatus: "HEALTHY" | "WARNING" | "BREACHED";
}

interface PortalData {
  token: string;
  expiresAt: string | null;
  clientOrgName: string;
  clientContactName: string | null;
  feedbackSlaHours: number;
  viewsCount: number;
  agency: {
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  mandate: {
    id: string;
    title: string;
    department: string | null;
    openings: number;
    minExp: number;
    maxExp: number;
    workMode: string;
    location: string | null;
    skills: string[];
    description: string | null;
    assignedRecruiter: {
      name: string;
      email: string;
      phone: string | null;
    } | null;
  };
  candidates: PortalCandidate[];
}

export default function ZeroLoginClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLinkExpired, setIsLinkExpired] = useState(false);

  // Filters & Search (Mirroring Mandate Workspace)
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "SHORTLISTED" | "HOLD" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Slide-over CV & Dossier Drawer State
  const [expandedCandidate, setExpandedCandidate] = useState<PortalCandidate | null>(null);
  const [expandedTab, setExpandedTab] = useState<"CV" | "DOSSIER">("CV");

  // Interactive Decision Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<PortalCandidate | null>(null);
  const [actionType, setActionType] = useState<"SHORTLIST" | "HOLD" | "REJECT" | "QUESTION" | null>(null);
  const [shortlistMode, setShortlistMode] = useState<"COORDINATE" | "PROPOSE_SLOTS">("COORDINATE");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [slot1Date, setSlot1Date] = useState("");
  const [slot1Time, setSlot1Time] = useState("11:00");
  const [slot2Date, setSlot2Date] = useState("");
  const [slot2Time, setSlot2Time] = useState("");
  const [slot3Date, setSlot3Date] = useState("");
  const [slot3Time, setSlot3Time] = useState("");
  const [slotValidationError, setSlotValidationError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Lacks required depth in core tech stack");
  const [holdReason, setHoldReason] = useState("Comparing with incoming profiles");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function formatSlotDisplay(dateStr: string, timeStr: string): string {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      const d = new Date(year, month - 1, day, hours, minutes);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (_) {
      return `${dateStr} @ ${timeStr}`;
    }
  }

  const loadPortalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/portal/${token}`);
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 410 || json.expired) {
          setIsLinkExpired(true);
        }
        throw new Error(json.error || "Client presentation link is invalid or expired.");
      }

      if (json.portal?.expiresAt && new Date() > new Date(json.portal.expiresAt)) {
        setIsLinkExpired(true);
        throw new Error("This client presentation link has expired.");
      }

      setPortal(json.portal);
    } catch (err: any) {
      setError(err.message || "Failed to load candidate presentation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadPortalData();
  }, [token]);

  const handleOpenDecision = (cand: PortalCandidate, type: "SHORTLIST" | "HOLD" | "REJECT" | "QUESTION") => {
    setSelectedCandidate(cand);
    setActionType(type);
    setDecisionNotes("");
    setSlotValidationError(null);
    setShortlistMode("COORDINATE");

    if (type === "SHORTLIST") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSlot1Date(tomorrow.toISOString().split("T")[0]);
      setSlot1Time("11:00");
      setSlot2Date("");
      setSlot2Time("");
      setSlot3Date("");
      setSlot3Time("");
    }
    if (type === "HOLD") setHoldReason("Comparing with incoming profiles");
    if (type === "REJECT") setRejectionReason("Lacks required depth in core tech stack");
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !actionType) return;

    let validSlots: Array<{ date: string; time: string; formatted: string }> = [];
    let formattedSlotsString: string | undefined = undefined;

    if (actionType === "SHORTLIST") {
      if (shortlistMode === "PROPOSE_SLOTS") {
        if (!slot1Date || !slot1Time) {
          setSlotValidationError("Please provide both Date and Time for Slot Option 1.");
          return;
        }
        if ((slot2Date && !slot2Time) || (!slot2Date && slot2Time)) {
          setSlotValidationError("Please provide both Date and Time for Slot Option 2, or leave both empty.");
          return;
        }
        if ((slot3Date && !slot3Time) || (!slot3Date && slot3Time)) {
          setSlotValidationError("Please provide both Date and Time for Slot Option 3, or leave both empty.");
          return;
        }

        if (slot1Date && slot1Time) {
          validSlots.push({ date: slot1Date, time: slot1Time, formatted: formatSlotDisplay(slot1Date, slot1Time) });
        }
        if (slot2Date && slot2Time) {
          validSlots.push({ date: slot2Date, time: slot2Time, formatted: formatSlotDisplay(slot2Date, slot2Time) });
        }
        if (slot3Date && slot3Time) {
          validSlots.push({ date: slot3Date, time: slot3Time, formatted: formatSlotDisplay(slot3Date, slot3Time) });
        }
        formattedSlotsString = validSlots.map((s, i) => `Slot ${i + 1}: ${s.formatted}`).join(" | ");
      } else {
        formattedSlotsString = "Recruiter to coordinate interview schedule";
      }
    }

    setSubmittingDecision(true);
    setSlotValidationError(null);

    try {
      const res = await fetch(`/api/portal/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedCandidate.submissionId,
          decision: actionType,
          notes: decisionNotes,
          preferredInterviewTimes: actionType === "SHORTLIST" ? formattedSlotsString : undefined,
          proposedSlots: actionType === "SHORTLIST" && validSlots.length > 0 ? validSlots : undefined,
          rejectionReason: actionType === "REJECT" ? rejectionReason : actionType === "HOLD" ? holdReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record feedback");
      }

      setSuccessMessage(
        actionType === "SHORTLIST"
          ? `✓ '${selectedCandidate.fullName}' shortlisted for interview! Your search team has been alerted.`
          : actionType === "HOLD"
          ? `⏳ '${selectedCandidate.fullName}' marked on hold.`
          : actionType === "REJECT"
          ? `✓ Feedback recorded for '${selectedCandidate.fullName}'.`
          : `✓ Message sent to search lead.`
      );

      // Keep expandedCandidate updated if currently viewing drawer
      if (expandedCandidate && expandedCandidate.submissionId === selectedCandidate.submissionId) {
        setExpandedCandidate({
          ...expandedCandidate,
          clientDecision:
            actionType === "SHORTLIST"
              ? "SHORTLISTED_FOR_INTERVIEW"
              : actionType === "REJECT"
              ? "REJECTED_WITH_FEEDBACK"
              : "INFO_REQUESTED",
          clientFeedbackNotes: decisionNotes || expandedCandidate.clientFeedbackNotes,
          preferredInterviewTimes: actionType === "SHORTLIST" ? formattedSlotsString || null : expandedCandidate.preferredInterviewTimes,
        });
      }

      setSelectedCandidate(null);
      setActionType(null);
      loadPortalData();
    } catch (err: any) {
      alert(err.message || "Failed to record feedback.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-slate-900 border-t-amber-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
            Loading Candidate Presentation...
          </p>
        </div>
      </div>
    );
  }

  // EXPIRED STATE SCREEN
  if (isLinkExpired || (portal?.expiresAt && new Date() > new Date(portal.expiresAt))) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm max-w-lg text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Review Link Has Expired</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            To safeguard candidate privacy and confidential compensation data, presentation links expire after 7 days.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-1">
            <p className="font-bold text-slate-800">Need to access this shortlist?</p>
            <p className="text-slate-500">
              Please contact your dedicated search recruiter to receive a freshly generated presentation link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Presentation Unavailable</h2>
          <p className="text-xs text-slate-500">{error || "This shortlist portal link is invalid or deactivated."}</p>
        </div>
      </div>
    );
  }

  const totalCandidates = portal.candidates.length;
  const pendingCount = portal.candidates.filter(
    (c) => c.stage === "SUBMITTED_TO_CLIENT" || c.clientDecision === "PENDING_REVIEW"
  ).length;
  const shortlistedCount = portal.candidates.filter(
    (c) => c.stage === "CLIENT_SHORTLISTED" || c.clientDecision === "SHORTLISTED_FOR_INTERVIEW"
  ).length;
  const holdCount = portal.candidates.filter(
    (c) => c.clientDecision === "INFO_REQUESTED" || (c as any).clientDecision === "HOLD"
  ).length;
  const rejectedCount = portal.candidates.filter(
    (c) => c.stage === "STAGE_REJECTED" || c.clientDecision === "REJECTED_WITH_FEEDBACK"
  ).length;

  const reviewedCount = totalCandidates - pendingCount;

  // Filter & Search Candidates
  const filteredCandidates = portal.candidates.filter((c) => {
    // 1. Tab Filter
    if (activeTab === "PENDING" && !(c.stage === "SUBMITTED_TO_CLIENT" || c.clientDecision === "PENDING_REVIEW")) return false;
    if (activeTab === "SHORTLISTED" && !(c.stage === "CLIENT_SHORTLISTED" || c.clientDecision === "SHORTLISTED_FOR_INTERVIEW")) return false;
    if (activeTab === "HOLD" && !(c.clientDecision === "INFO_REQUESTED" || (c as any).clientDecision === "HOLD")) return false;
    if (activeTab === "REJECTED" && !(c.stage === "STAGE_REJECTED" || c.clientDecision === "REJECTED_WITH_FEEDBACK")) return false;

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.fullName?.toLowerCase().includes(q);
      const matchTitle = c.currentTitle?.toLowerCase().includes(q);
      const matchCompany = c.currentCompany?.toLowerCase().includes(q);
      const matchSkills = c.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchTitle && !matchCompany && !matchSkills) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900 font-sans">
      {/* Top Client Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-[#fce17c] border border-[#f5d762] flex items-center justify-center font-black text-slate-900 text-sm shadow-xs">
              {portal.agency.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">{portal.agency.name}</span>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide">
                  Candidate Presentation
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Prepared for <strong className="text-slate-800">{portal.clientOrgName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-3 py-1 rounded-full font-bold shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Confidential Shortlist</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full space-y-4">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in duration-150 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MANDATE HERO STRIP (REPLICATING MANDATE WORKSPACE DESIGN)                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          {/* Top Row: Client + Role Title + Openings + Right-side Concierge Actions */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Left: Client Org + Mandate Title */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span className="text-slate-600 font-bold">{portal.clientOrgName}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 font-medium">Candidate Review</span>
              </div>

              <div className="flex items-center space-x-3 flex-wrap gap-y-1.5 pt-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {portal.mandate.title}
                </h1>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-semibold text-slate-500">
                  {portal.mandate.openings} {portal.mandate.openings === 1 ? "Opening" : "Openings"}
                </span>
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Curated Shortlist</span>
                </span>
              </div>
            </div>

            {/* Right: Review Progress + Search Lead Concierge Contact */}
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              {/* Review Progress Badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium">Reviewed:</span>
                <span className="font-black text-slate-900">{reviewedCount} of {totalCandidates}</span>
              </div>

              {/* Dedicated Search Lead */}
              {portal.mandate.assignedRecruiter && (
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block leading-none">SEARCH LEAD</span>
                    <span className="font-extrabold text-slate-900">{portal.mandate.assignedRecruiter.name}</span>
                  </div>
                  {portal.mandate.assignedRecruiter.phone && (
                    <a
                      href={`tel:${portal.mandate.assignedRecruiter.phone}`}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 transition-colors flex items-center space-x-1"
                    >
                      <Phone className="h-3 w-3 text-slate-500" />
                      <span>Call</span>
                    </a>
                  )}
                  {portal.mandate.assignedRecruiter.email && (
                    <a
                      href={`mailto:${portal.mandate.assignedRecruiter.email}`}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 transition-colors flex items-center space-x-1"
                    >
                      <Mail className="h-3 w-3 text-slate-500" />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Key Specs Icon Bar + Skills */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Exp: <strong className="text-slate-800">{portal.mandate.minExp}–{portal.mandate.maxExp} Yrs</strong>
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  <strong className="text-slate-800">{portal.mandate.location || "Bengaluru"}</strong> ({portal.mandate.workMode})
                </span>
              </div>
            </div>

            {/* Top Skills Badges */}
            {portal.mandate.skills && portal.mandate.skills.length > 0 && (
              <div className="flex items-center space-x-1 flex-wrap">
                {portal.mandate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CANDIDATES DESK (UNDERLINE TABS + SEARCH + CANDIDATE CARDS)               */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Sleek Underline Tabs Bar */}
          <div className="px-5 pt-3 pb-2.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-6 overflow-x-auto -mb-2.5">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeTab === "ALL"
                    ? "border-slate-900 text-slate-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <span>All Candidates</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {totalCandidates}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("PENDING")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeTab === "PENDING"
                    ? "border-amber-600 text-amber-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <span>Awaiting Review</span>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("SHORTLISTED")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeTab === "SHORTLISTED"
                    ? "border-emerald-600 text-emerald-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <span>Shortlisted</span>
                {shortlistedCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-600 text-white">
                    {shortlistedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("HOLD")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeTab === "HOLD"
                    ? "border-amber-600 text-amber-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <span>On Hold</span>
                {holdCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
                    {holdCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("REJECTED")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeTab === "REJECTED"
                    ? "border-slate-800 text-slate-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <span>Declined</span>
                {rejectedCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
                    {rejectedCount}
                  </span>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredCandidates.length}</strong> profile{filteredCandidates.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
            <div className="relative rounded-lg shadow-sm flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, title, company, skills..."
                className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 bg-white text-slate-900"
              />
            </div>

            <span className="text-xs text-slate-400">
              Click <strong>Shortlist</strong>, <strong>Hold</strong>, or <strong>Decline</strong> on any profile
            </span>
          </div>

          {/* Candidate Cards Stack (Unified CandidateCard Architecture) */}
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No candidates in this view</p>
              <p className="text-slate-400 text-xs mt-1">
                Try selecting another tab or clearing your search keywords.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50/50 space-y-3">
              {filteredCandidates.map((cand, idx) => (
                <CandidateCard
                  key={cand.submissionId}
                  candidate={{
                    ...cand,
                    id: cand.candidateId,
                  }}
                  index={idx}
                  clientPortalMode={true}
                  clientDecision={cand.clientDecision}
                  onClientShortlist={() => handleOpenDecision(cand, "SHORTLIST")}
                  onClientHold={() => handleOpenDecision(cand, "HOLD")}
                  onClientReject={() => handleOpenDecision(cand, "REJECT")}
                  onClientViewCv={() => {
                    setExpandedCandidate(cand);
                    setExpandedTab("CV");
                  }}
                  onOpenModal={() => {
                    setExpandedCandidate(cand);
                    setExpandedTab("DOSSIER");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* EXPANDABLE CV & CANDIDATE DOSSIER SLIDE-OVER DRAWER */}
      {expandedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#fce17c] border border-[#f5d762] flex items-center justify-center font-black text-slate-900 text-sm">
                  {expandedCandidate.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <span>{expandedCandidate.fullName}</span>
                    <span className="text-xs text-slate-500 font-normal">
                      • {expandedCandidate.currentTitle || "Professional"} ({expandedCandidate.totalExpYears}y exp)
                    </span>
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                    <span>{expandedCandidate.email}</span>
                    <span>•</span>
                    <span className="font-mono">{expandedCandidate.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {expandedCandidate.resumeUrl && (
                  <a
                    href={expandedCandidate.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" />
                    <span>Download CV</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedCandidate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* View Mode Toggle: Original CV vs Structured Dossier */}
            <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setExpandedTab("CV")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    expandedTab === "CV"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Resume PDF View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedTab("DOSSIER")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    expandedTab === "DOSSIER"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Executive Dossier</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                Mandate: <strong>{portal.mandate.title}</strong>
              </span>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
              {expandedTab === "CV" ? (
                <div className="h-full flex flex-col">
                  {expandedCandidate.resumeUrl ? (
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col min-h-[550px]">
                      <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold truncate max-w-md">
                          CV Document: {expandedCandidate.fullName}.pdf
                        </span>
                        <a
                          href={expandedCandidate.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-bold"
                        >
                          <span>Open Fullscreen</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <iframe
                        src={expandedCandidate.resumeUrl}
                        className="w-full flex-1 border-0 min-h-[550px]"
                        title={`Resume of ${expandedCandidate.fullName}`}
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-800 text-sm">Resume Attached via Email</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        The resume document for {expandedCandidate.fullName} was shared in the email dispatch. You can review all verified background details in the Executive Dossier tab.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Clean Executive Dossier */
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm border-b pb-2 flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-slate-500" />
                      <span>Executive Background Overview</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Candidate Name</span>
                        <strong className="text-slate-900 text-sm">{expandedCandidate.fullName}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Designation</span>
                        <strong className="text-slate-900">{expandedCandidate.currentTitle || "Professional"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Current / Last Company</span>
                        <strong className="text-slate-900">{expandedCandidate.currentCompany || "Confidential"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Location</span>
                        <strong className="text-slate-900">{expandedCandidate.location || portal.mandate.location || "Bengaluru"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Experience</span>
                        <strong className="text-slate-900">{expandedCandidate.totalExpYears} Years</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Relevant Experience</span>
                        <strong className="text-slate-900">
                          {expandedCandidate.relevantExpYears !== null && expandedCandidate.relevantExpYears !== undefined
                            ? `${expandedCandidate.relevantExpYears} Years`
                            : "Vetted in screening"}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Compensation</span>
                        <strong className="text-slate-900">{expandedCandidate.currentSalary || "Confidential"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Expected Compensation</span>
                        <strong className="text-emerald-700 font-bold">{expandedCandidate.expectedSalary || "Negotiable"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Notice Period</span>
                        <strong className="text-slate-900">{expandedCandidate.noticePeriod || `${expandedCandidate.noticePeriodDays} Days`}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Highest Qualification</span>
                        <strong className="text-slate-900">{expandedCandidate.qualification || "Graduate Degree"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Offers in Hand</span>
                        <strong className="text-slate-900">{expandedCandidate.offerInHand || "No"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Ready to Relocate</span>
                        <strong className="text-slate-900">{expandedCandidate.readyToRelocate || "Yes"}</strong>
                      </div>
                      {expandedCandidate.reasonForLeaving && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Reason for Career Change</span>
                          <p className="text-slate-800 italic mt-0.5">{expandedCandidate.reasonForLeaving}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary & Skills */}
                  {expandedCandidate.summary && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Recruiter Evaluation</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{expandedCandidate.summary}</p>
                    </div>
                  )}

                  {expandedCandidate.skills && expandedCandidate.skills.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Verified Competencies</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {expandedCandidate.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Logged decisions immediately inform your dedicated search team.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenDecision(expandedCandidate, "HOLD")}
                  className="px-3.5 py-2 border border-amber-300 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50 cursor-pointer"
                >
                  Hold
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDecision(expandedCandidate, "REJECT")}
                  className="px-3.5 py-2 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDecision(expandedCandidate, "SHORTLIST")}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Shortlist Candidate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE FRICTIONLESS DECISION MODAL */}
      {selectedCandidate && actionType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                actionType === "SHORTLIST"
                  ? "bg-emerald-50/70 border-emerald-200"
                  : actionType === "HOLD"
                  ? "bg-amber-50 border-amber-200"
                  : actionType === "REJECT"
                  ? "bg-rose-50 border-rose-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {actionType === "SHORTLIST" && <Check className="h-5 w-5 text-emerald-600 stroke-[3]" />}
                {actionType === "HOLD" && <PauseCircle className="h-5 w-5 text-amber-700" />}
                {actionType === "REJECT" && <ThumbsDown className="h-5 w-5 text-rose-700" />}
                {actionType === "QUESTION" && <MessageSquare className="h-5 w-5 text-slate-800" />}
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {actionType === "SHORTLIST" && "Shortlist for Interview"}
                    {actionType === "HOLD" && "Put Candidate on Hold"}
                    {actionType === "REJECT" && "Decline Profile"}
                    {actionType === "QUESTION" && "Ask Search Lead a Question"}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Candidate: <strong className="text-slate-900">{selectedCandidate.fullName}</strong> • {portal.mandate.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCandidate(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4">
              {/* Shortlist Flow */}
              {actionType === "SHORTLIST" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block font-black text-slate-900 text-xs">
                      How would you like to schedule?
                    </label>

                    {/* Choice 1: Recruiter Coordinates */}
                    <div
                      onClick={() => setShortlistMode("COORDINATE")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        shortlistMode === "COORDINATE"
                          ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center border mt-0.5 transition-all ${
                          shortlistMode === "COORDINATE"
                            ? "bg-emerald-600 border-emerald-700 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {shortlistMode === "COORDINATE" && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">
                          Recruiter to Coordinate (Fastest)
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Your search lead will reach out to candidate and panel to coordinate interview slots seamlessly.
                        </p>
                      </div>
                    </div>

                    {/* Choice 2: Propose Specific Slots */}
                    <div
                      onClick={() => setShortlistMode("PROPOSE_SLOTS")}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        shortlistMode === "PROPOSE_SLOTS"
                          ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center border mt-0.5 transition-all ${
                          shortlistMode === "PROPOSE_SLOTS"
                            ? "bg-emerald-600 border-emerald-700 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {shortlistMode === "PROPOSE_SLOTS" && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">
                          I have specific interview slots ready
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Propose specific dates and times for candidate to confirm.
                        </p>
                      </div>
                    </div>
                  </div>

                  {shortlistMode === "PROPOSE_SLOTS" && (
                    <div className="space-y-3 pt-2">
                      {slotValidationError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>{slotValidationError}</span>
                        </div>
                      )}

                      {/* Slot 1 */}
                      <div className="p-3 rounded-xl border border-emerald-300/80 bg-emerald-50/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                            <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                            <span>Option 1 (Primary Slot) *</span>
                          </span>
                          {slot1Date && slot1Time && (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {formatSlotDisplay(slot1Date, slot1Time)}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Date *</label>
                            <input
                              type="date"
                              required
                              value={slot1Date}
                              min={new Date().toISOString().split("T")[0]}
                              onChange={(e) => {
                                setSlot1Date(e.target.value);
                                setSlotValidationError(null);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Time *</label>
                            <input
                              type="time"
                              required
                              value={slot1Time}
                              onChange={(e) => {
                                setSlot1Time(e.target.value);
                                setSlotValidationError(null);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Slot 2 */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">2</span>
                            <span>Option 2 (Alternative)</span>
                            <span className="text-[10px] font-normal text-slate-400">Optional</span>
                          </span>
                          {slot2Date && slot2Time ? (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {formatSlotDisplay(slot2Date, slot2Time)}
                            </span>
                          ) : (
                            slot2Date || slot2Time ? (
                              <button
                                type="button"
                                onClick={() => { setSlot2Date(""); setSlot2Time(""); }}
                                className="text-[10px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                              >
                                Clear
                              </button>
                            ) : null
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Date</label>
                            <input
                              type="date"
                              value={slot2Date}
                              min={new Date().toISOString().split("T")[0]}
                              onChange={(e) => {
                                setSlot2Date(e.target.value);
                                setSlotValidationError(null);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Time</label>
                            <input
                              type="time"
                              value={slot2Time}
                              onChange={(e) => {
                                setSlot2Time(e.target.value);
                                setSlotValidationError(null);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 text-xs">
                      Panel Notes / Evaluation Focus (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Focus on system architecture and leadership in Round 1."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              )}

              {/* Hold Flow */}
              {actionType === "HOLD" && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-black text-slate-900 mb-1 text-xs">
                      Reason for Hold *
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      Temporarily pause this profile while keeping candidate pipeline warm.
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: "Comparing with incoming profiles",
                          title: "Comparing with Other Profiles",
                          desc: "Evaluating other candidates before locking interview shortlist",
                        },
                        {
                          id: "Hiring manager / interview panel traveling",
                          title: "Interview Panel Traveling / Busy",
                          desc: "Team availability constrained this week",
                        },
                        {
                          id: "Requirement timeline adjusted",
                          title: "Requirement Timeline Shifted",
                          desc: "Role start date or urgency temporarily moved",
                        },
                        {
                          id: "Reviewing internal budget / compensation",
                          title: "Internal Budget / Level Review",
                          desc: "Clarifying internal compensation bands for this role",
                        },
                      ].map((item) => {
                        const isSelected = holdReason === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setHoldReason(item.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-2xs"
                                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs">{item.title}</div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{item.desc}</div>
                            </div>
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? "bg-amber-500 border-amber-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 text-xs">
                      Additional Notes for Recruiter (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Keep warm; we will revisit early next week."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                </div>
              )}

              {/* Decline Flow */}
              {actionType === "REJECT" && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-black text-slate-900 mb-1 text-xs">
                      Primary Reason for Declining *
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      Your feedback helps the search team calibrate subsequent candidate profiles.
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: "Compensation expectation is above budget",
                          title: "Compensation Above Budget",
                          desc: "Current or expected CTC exceeds client budget benchmark",
                        },
                        {
                          id: "Lacks required depth in core tech stack",
                          title: "Technical Competency / Depth Gap",
                          desc: "Missing required core competency or hands-on framework depth",
                        },
                        {
                          id: "Notice period is too long for hiring timeline",
                          title: "Notice Period Too Long",
                          desc: "Availability timeline does not match project start date",
                        },
                        {
                          id: "Domain / Industry mismatch",
                          title: "Domain / Industry Mismatch",
                          desc: "Requires specific niche background or sector familiarity",
                        },
                        {
                          id: "Seniority level mismatch (under/overqualified)",
                          title: "Seniority Mismatch (Over / Under)",
                          desc: "Years of experience or seniority level is not aligned",
                        },
                      ].map((item) => {
                        const isSelected = rejectionReason === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setRejectionReason(item.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 shadow-2xs"
                                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs">{item.title}</div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{item.desc}</div>
                            </div>
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? "bg-rose-600 border-rose-700 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 text-xs">
                      Calibration Notes for Search Lead (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Good profile, but we specifically need someone with deep Kafka experience."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                </div>
              )}

              {/* Question Flow */}
              {actionType === "QUESTION" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1 text-xs">
                      Message for Search Lead *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Has this candidate managed team sizes above 10 engineers?"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className={`px-6 py-2.5 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                    actionType === "SHORTLIST"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : actionType === "HOLD"
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : actionType === "REJECT"
                      ? "bg-slate-900 hover:bg-slate-800 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {submittingDecision
                    ? "Recording..."
                    : actionType === "SHORTLIST"
                    ? "Confirm Shortlist"
                    : actionType === "HOLD"
                    ? "Confirm Hold"
                    : "Confirm & Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Professional Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Client Candidate Presentation Portal • Curated by {portal.agency.name} for {portal.clientOrgName}
      </footer>
    </div>
  );
}
