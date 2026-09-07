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
  Eye,
  Check,
  X,
  MessageSquare,
  Calendar,
  DollarSign,
  Lock,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Mail,
  Phone,
  FileDown,
  GraduationCap,
  FileText,
  PauseCircle,
  Maximize2,
  Download,
} from "lucide-react";

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
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "SHORTLISTED" | "HOLD" | "REJECTED">("ALL");

  // Expandable CV Slide-Over Drawer State
  const [expandedCandidate, setExpandedCandidate] = useState<PortalCandidate | null>(null);
  const [expandedTab, setExpandedTab] = useState<"CV" | "TELEMETRY">("CV");

  // Interactive Decision Modal State (CL-02)
  const [selectedCandidate, setSelectedCandidate] = useState<PortalCandidate | null>(null);
  const [actionType, setActionType] = useState<"SHORTLIST" | "HOLD" | "REJECT" | "QUESTION" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [interviewTimes, setInterviewTimes] = useState("Flexible — Next 48 hours");
  const [rejectionReason, setRejectionReason] = useState("Lacks required depth in core tech stack");
  const [holdReason, setHoldReason] = useState("Comparing with incoming profiles");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

      // Check date client-side
      if (json.portal?.expiresAt && new Date() > new Date(json.portal.expiresAt)) {
        setIsLinkExpired(true);
        throw new Error("This client presentation link has expired.");
      }

      setPortal(json.portal);
    } catch (err: any) {
      setError(err.message || "Failed to load client portal");
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
    if (type === "SHORTLIST") setInterviewTimes("Flexible — Next 48 hours");
    if (type === "HOLD") setHoldReason("Comparing with incoming profiles");
    if (type === "REJECT") setRejectionReason("Lacks required depth in core tech stack");
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !actionType) return;
    setSubmittingDecision(true);

    try {
      const res = await fetch(`/api/portal/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedCandidate.submissionId,
          decision: actionType,
          notes: decisionNotes,
          preferredInterviewTimes: actionType === "SHORTLIST" ? interviewTimes : undefined,
          rejectionReason: actionType === "REJECT" ? rejectionReason : actionType === "HOLD" ? holdReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record feedback");
      }

      setSuccessMessage(
        actionType === "SHORTLIST"
          ? `Candidate '${selectedCandidate.fullName}' shortlisted for next round!`
          : actionType === "HOLD"
          ? `Candidate '${selectedCandidate.fullName}' marked on hold.`
          : actionType === "REJECT"
          ? `Feedback logged for '${selectedCandidate.fullName}'.`
          : `Inquiry sent to desk recruiter.`
      );

      // Keep expandedCandidate updated if open
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
        });
      }

      setSelectedCandidate(null);
      setActionType(null);
      loadPortalData();
    } catch (err: any) {
      alert(err.message || "Failed to record decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
            Loading Client Presentation Portal...
          </p>
        </div>
      </div>
    );
  }

  // EXPIRED STATE BANNER & SCREEN (PII Protection)
  if (isLinkExpired || (portal?.expiresAt && new Date() > new Date(portal.expiresAt))) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-amber-200 shadow-sm max-w-lg text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Review Link Expired</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            To safeguard candidate confidentiality and protect sensitive personally identifiable information (PII), client review links strictly expire after <strong>7 days</strong>.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-1">
            <p className="font-bold text-slate-800">Need to review this shortlist?</p>
            <p className="text-slate-500">
              Please contact your dedicated search recruiter or agency team to request a newly generated presentation link.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
            >
              <span>RecruitOS Portal Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Presentation Link Unavailable</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">{error || "This shortlist portal link is invalid or deactivated."}</p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-yellow text-slate-900 font-bold text-xs rounded-lg shadow-sm hover:bg-brand-yellowHover"
          >
            <span>RecruitOS Login</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate 7-Day Countdown
  const daysRemaining = portal.expiresAt
    ? Math.max(0, Math.ceil((new Date(portal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

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

  const filteredCandidates = portal.candidates.filter((c) => {
    if (activeFilter === "PENDING") return c.stage === "SUBMITTED_TO_CLIENT" || c.clientDecision === "PENDING_REVIEW";
    if (activeFilter === "SHORTLISTED") return c.stage === "CLIENT_SHORTLISTED" || c.clientDecision === "SHORTLISTED_FOR_INTERVIEW";
    if (activeFilter === "HOLD") return c.clientDecision === "INFO_REQUESTED" || (c as any).clientDecision === "HOLD";
    if (activeFilter === "REJECTED") return c.stage === "STAGE_REJECTED" || c.clientDecision === "REJECTED_WITH_FEEDBACK";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900">
      {/* Top Client Header with 7-Day Security Badge */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-black text-slate-800 text-sm shadow-sm">
              {portal.agency.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm">{portal.agency.name}</span>
                <span className="bg-brand-surfaceLight text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-brand-surface uppercase">
                  Candidate Screening Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Prepared for {portal.clientOrgName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 7-Day Expiry Countdown Pill */}
            <div className="flex items-center space-x-1.5 text-xs bg-amber-50 text-amber-900 border border-amber-200/90 px-3 py-1 rounded-full font-bold shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>Link Active: {daysRemaining} Day{daysRemaining === 1 ? "" : "s"} Left</span>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>PII Confidential</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in duration-150 text-xs">
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

        {/* Role Brief & 48h Feedback SLA Velocity Hero */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span>{portal.clientOrgName}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {portal.mandate.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  {portal.mandate.location || "Bengaluru"} ({portal.mandate.workMode})
                </span>
                <span>•</span>
                <span>Experience: {portal.mandate.minExp}–{portal.mandate.maxExp} Years</span>
                <span>•</span>
                <span>Openings: {portal.mandate.openings}</span>
              </div>
            </div>

            {/* 48-Hour Feedback SLA Velocity Clock */}
            <div className="bg-brand-surfaceLight border-2 border-brand-surface rounded-2xl p-4 sm:w-80 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Screening SLA Clock
                </span>
                <Clock className="h-4 w-4 text-slate-700" />
              </div>
              <div className="text-xl font-black text-slate-900">
                {portal.feedbackSlaHours}-Hour Review Window
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Candidate availability is prioritized for rapid client review to ensure top talent is secured promptly.
              </p>
              {portal.mandate.assignedRecruiter && (
                <div className="mt-3 pt-2.5 border-t border-brand-surface text-xs text-slate-700">
                  <span className="text-slate-500 block text-[10px]">Lead Search Recruiter:</span>
                  <span className="font-bold text-slate-900">{portal.mandate.assignedRecruiter.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Skills */}
          {portal.mandate.skills && portal.mandate.skills.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Mandate Skill Competencies
              </span>
              <div className="flex flex-wrap gap-2">
                {portal.mandate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-1 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs & Candidate List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs gap-1 max-w-xl">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Submitted Profiles ({portal.candidates.length})
              </button>

              <button
                onClick={() => setActiveFilter("PENDING")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeFilter === "PENDING"
                    ? "bg-brand-yellow text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pending Review ({pendingCount})
              </button>

              <button
                onClick={() => setActiveFilter("SHORTLISTED")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeFilter === "SHORTLISTED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Shortlisted ({shortlistedCount})
              </button>

              <button
                onClick={() => setActiveFilter("HOLD")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeFilter === "HOLD"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                On Hold ({holdCount})
              </button>

              <button
                onClick={() => setActiveFilter("REJECTED")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeFilter === "REJECTED"
                    ? "bg-slate-200 text-slate-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Archived ({rejectedCount})
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredCandidates.length} candidate profile(s)
            </span>
          </div>

          {/* Candidate Profile Cards Grid */}
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">No candidate profiles in this view</p>
              <p className="text-xs text-slate-400 mt-1">
                Your search team will present qualified candidates here as vetting is completed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredCandidates.map((cand) => {
                const isShortlisted =
                  cand.stage === "CLIENT_SHORTLISTED" || cand.clientDecision === "SHORTLISTED_FOR_INTERVIEW";
                const isHold =
                  cand.clientDecision === "INFO_REQUESTED" || (cand as any).clientDecision === "HOLD";
                const isRejected =
                  cand.stage === "STAGE_REJECTED" || cand.clientDecision === "REJECTED_WITH_FEEDBACK";
                const isPending = !isShortlisted && !isHold && !isRejected;

                const slaPillColor =
                  cand.slaStatus === "BREACHED"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : cand.slaStatus === "WARNING"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200";

                return (
                  <div
                    key={cand.submissionId}
                    className={`bg-white rounded-3xl border transition-all p-6 sm:p-7 space-y-5 shadow-sm ${
                      isShortlisted
                        ? "border-emerald-300 ring-2 ring-emerald-400/20"
                        : isHold
                        ? "border-amber-300 ring-2 ring-amber-400/20"
                        : isRejected
                        ? "border-slate-200 opacity-75"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {/* Header: Candidate Identity & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <div className="w-11 h-11 rounded-2xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-black text-slate-800 text-sm shadow-xs">
                            {cand.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h3 className="font-extrabold text-slate-900 text-lg">{cand.fullName}</h3>
                              {isShortlisted && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span>Selected for Next Round</span>
                                </span>
                              )}
                              {isHold && (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1">
                                  <PauseCircle className="h-3 w-3 text-amber-600" />
                                  <span>On Hold</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-slate-300">
                                  Archived / Rejected
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap pt-0.5">
                              <span>Applied Role: <strong className="text-slate-900">{portal.mandate.title}</strong></span>
                              <span>•</span>
                              <span>Current: <strong className="text-slate-900">{cand.currentTitle || "Professional"}</strong> {cand.currentCompany ? `at ${cand.currentCompany}` : ""}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Expandable CV Drawer CTA & SLA */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isPending && (
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-extrabold border ${slaPillColor}`}>
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {cand.hoursRemaining > 0
                                ? `⏳ ${cand.hoursRemaining}h remaining`
                                : `⚠️ Overdue (${cand.hoursElapsed}h)`}
                            </span>
                          </span>
                        )}

                        {/* Expand CV Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedCandidate(cand);
                            setExpandedTab("CV");
                          }}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-brand-yellow" />
                          <span>Expand CV & Screening</span>
                        </button>
                      </div>
                    </div>

                    {/* Candidate Direct Contacts */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">Email:</span>
                        <strong className="text-slate-900">{cand.email}</strong>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">Phone:</span>
                        <strong className="text-slate-900 font-mono">{cand.phone}</strong>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">Client:</span>
                        <strong className="text-slate-900">{portal.clientOrgName}</strong>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">Sourced:</span>
                        <strong className="text-slate-900">{new Date(cand.dateOfSourcing).toLocaleDateString()}</strong>
                        <span className="text-slate-400 text-[10px]">({cand.sourceName})</span>
                      </div>
                    </div>

                    {/* 19-Column Screening Telemetry Snapshot */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Total Experience</span>
                        <strong className="text-slate-900 text-xs">{cand.totalExpYears} Years</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Relevant Experience</span>
                        <strong className="text-slate-900 text-xs">
                          {cand.relevantExpYears !== null && cand.relevantExpYears !== undefined ? `${cand.relevantExpYears} Years` : "Verified in Screening"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Current Salary (CTC)</span>
                        <strong className="text-slate-900 text-xs">{cand.currentSalary || "Confidential"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Expected Salary (CTC)</span>
                        <strong className="text-emerald-700 text-xs">{cand.expectedSalary || "Negotiable"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Notice Period</span>
                        <strong className="text-slate-900 text-xs">{cand.noticePeriod || `${cand.noticePeriodDays} Days`}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Ready to Relocate</span>
                        <strong className="text-slate-900 text-xs">{cand.readyToRelocate || "Yes"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Offer in Hand</span>
                        <strong className="text-slate-900 text-xs">{cand.offerInHand || "No"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Highest Qualification</span>
                        <strong className="text-slate-900 text-xs truncate block">{cand.qualification || "Graduate / Degree"}</strong>
                      </div>
                    </div>

                    {/* Reason for Leaving */}
                    {cand.reasonForLeaving && (
                      <div className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                        <span className="font-bold text-amber-950 block text-[11px] mb-0.5">Reason for Leaving:</span>
                        <p className="italic text-amber-900">{cand.reasonForLeaving}</p>
                      </div>
                    )}

                    {/* Executive Summary */}
                    {cand.summary && (
                      <div className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                        <span className="font-bold text-slate-900 block text-[11px] mb-1">Executive Summary:</span>
                        {cand.summary}
                      </div>
                    )}

                    {/* Skills Matrix */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Verified Technical & Domain Competencies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cand.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-brand-surfaceLight border border-brand-surface text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Client Decision Feedback Box (if already acted) */}
                    {cand.clientFeedbackNotes && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900 block text-[11px] mb-0.5">Your Logged Feedback:</span>
                        <p>{cand.clientFeedbackNotes}</p>
                        {cand.preferredInterviewTimes && (
                          <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                            Preferred Timeframe: {cand.preferredInterviewTimes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 1-Click Interactive Action Controls (CL-02) */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(cand, "QUESTION")}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                        <span>Ask Recruiter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDecision(cand, "HOLD")}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Hold Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDecision(cand, "REJECT")}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ThumbsDown className="h-3.5 w-3.5 text-rose-500" />
                        <span>Decline / Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDecision(cand, "SHORTLIST")}
                        className="px-5 py-2 rounded-xl text-xs font-extrabold bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ThumbsUp className="h-3.5 w-3.5 text-slate-900" />
                        <span>Shortlist for Next Round</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* EXPANDABLE CV & CANDIDATE TELEMETRY SLIDE-OVER DRAWER */}
      {expandedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-black text-slate-800 text-sm">
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

            {/* View Mode Toggle: Original CV vs 19-Point Telemetry */}
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
                  <span>Original Resume / CV View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedTab("TELEMETRY")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    expandedTab === "TELEMETRY"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Full 19-Point Screening Telemetry</span>
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
                      <h4 className="font-bold text-slate-800 text-sm">Resume File Available via Attachment</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        The raw resume for {expandedCandidate.fullName} is attached to the presentation email sent to your inbox. You can also view full verified screening details in the adjacent tab.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Full 19-Column Telemetry View */
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm border-b pb-2 flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-slate-500" />
                      <span>Executive Candidate Screening Dossier (19 Standard Telemetry Fields)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">1. Date of Sourcing</span>
                        <strong className="text-slate-900">{new Date(expandedCandidate.dateOfSourcing).toLocaleDateString()}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">2. Sourcing Channel / Source</span>
                        <strong className="text-slate-900">{expandedCandidate.sourceName}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">3. Client Organization</span>
                        <strong className="text-slate-900">{portal.clientOrgName}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">4. Applied Position Name</span>
                        <strong className="text-slate-900">{portal.mandate.title}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">5. Candidate Name</span>
                        <strong className="text-slate-900">{expandedCandidate.fullName}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">6. Candidate Email ID</span>
                        <strong className="text-slate-900">{expandedCandidate.email}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">7. Candidate Contact Number</span>
                        <strong className="text-slate-900 font-mono">{expandedCandidate.phone}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">8. Candidate Location</span>
                        <strong className="text-slate-900">{expandedCandidate.location || portal.mandate.location || "Bengaluru"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">9. Ready to Relocate</span>
                        <strong className="text-slate-900">{expandedCandidate.readyToRelocate || "Yes"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">10. Total Experience</span>
                        <strong className="text-slate-900">{expandedCandidate.totalExpYears} Years</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">11. Relevant Experience</span>
                        <strong className="text-slate-900">
                          {expandedCandidate.relevantExpYears !== null && expandedCandidate.relevantExpYears !== undefined
                            ? `${expandedCandidate.relevantExpYears} Years`
                            : "Verified in Screening"}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">12. Designation / Current Title</span>
                        <strong className="text-slate-900">{expandedCandidate.currentTitle || "Professional"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">13. Highest Qualification</span>
                        <strong className="text-slate-900">{expandedCandidate.qualification || "Graduate Degree"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">14. Current / Last Company</span>
                        <strong className="text-slate-900">{expandedCandidate.currentCompany || "Confidential"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">15. Current Salary (CTC)</span>
                        <strong className="text-slate-900">{expandedCandidate.currentSalary || "Confidential"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">16. Expected Salary (CTC)</span>
                        <strong className="text-emerald-700 font-bold">{expandedCandidate.expectedSalary || "Negotiable"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">17. Notice Period</span>
                        <strong className="text-slate-900">{expandedCandidate.noticePeriod || `${expandedCandidate.noticePeriodDays} Days`}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">18. Offer in Hand</span>
                        <strong className="text-slate-900">{expandedCandidate.offerInHand || "No"}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">19. Reason of Leaving</span>
                        <p className="text-slate-800 italic mt-0.5">{expandedCandidate.reasonForLeaving || "Exploring progressive career growth"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Skills */}
                  {expandedCandidate.summary && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Executive Search Notes</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{expandedCandidate.summary}</p>
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Verified Competencies</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {expandedCandidate.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="bg-brand-surfaceLight border border-brand-surface text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Action will immediately update recruitment status and alert desk team.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenDecision(expandedCandidate, "QUESTION")}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Ask Recruiter
                </button>
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
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  Shortlist for Next Round
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE DECISION MODAL (CL-02) */}
      {selectedCandidate && actionType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                actionType === "SHORTLIST"
                  ? "bg-emerald-50 border-emerald-200"
                  : actionType === "HOLD"
                  ? "bg-amber-50 border-amber-200"
                  : actionType === "REJECT"
                  ? "bg-rose-50 border-rose-200"
                  : "bg-brand-surfaceLight border-brand-surface"
              }`}
            >
              <div className="flex items-center space-x-2">
                {actionType === "SHORTLIST" && <ThumbsUp className="h-5 w-5 text-emerald-700" />}
                {actionType === "HOLD" && <PauseCircle className="h-5 w-5 text-amber-700" />}
                {actionType === "REJECT" && <ThumbsDown className="h-5 w-5 text-rose-700" />}
                {actionType === "QUESTION" && <MessageSquare className="h-5 w-5 text-slate-800" />}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {actionType === "SHORTLIST" && "Shortlist Candidate for Next Round"}
                    {actionType === "HOLD" && "Put Candidate on Temporary Hold"}
                    {actionType === "REJECT" && "Decline Profile & Provide Feedback"}
                    {actionType === "QUESTION" && "Ask Search Lead a Question"}
                  </h3>
                  <p className="text-[10px] text-slate-600">Candidate: {selectedCandidate.fullName}</p>
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
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Preferred Interview Availability / Timeframes *
                    </label>
                    <select
                      value={interviewTimes}
                      onChange={(e) => setInterviewTimes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    >
                      <option value="Flexible — Next 48 hours">Flexible — Next 48 hours</option>
                      <option value="Weekday mornings (10 AM – 1 PM)">Weekday mornings (10 AM – 1 PM)</option>
                      <option value="Weekday afternoons (2 PM – 6 PM)">Weekday afternoons (2 PM – 6 PM)</option>
                      <option value="This Friday / Weekend slot">This Friday / Weekend slot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Panel Notes / Specific Focus Areas (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Please focus technical round on ROS2 navigation stack experience."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Hold Flow */}
              {actionType === "HOLD" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Hold Reason *
                    </label>
                    <select
                      value={holdReason}
                      onChange={(e) => setHoldReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    >
                      <option value="Comparing with incoming profiles">Comparing with incoming profiles</option>
                      <option value="Hiring manager / interview panel traveling">Hiring manager / interview panel traveling</option>
                      <option value="Requirement timeline adjusted">Requirement timeline adjusted</option>
                      <option value="Reviewing internal budget / compensation">Reviewing internal budget / compensation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Additional Notes for Recruiter (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Keep warm; we will revisit after interviewing the first 2 candidates."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Reject Flow */}
              {actionType === "REJECT" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Primary Decline Reason (Helps calibrate future profiles) *
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    >
                      <option value="Lacks required depth in core tech stack">Lacks required depth in core tech stack</option>
                      <option value="Compensation expectation is above budget">Compensation expectation is above budget</option>
                      <option value="Notice period is too long for hiring timeline">Notice period is too long for hiring timeline</option>
                      <option value="Domain / Industry mismatch">Domain / Industry mismatch</option>
                      <option value="Seniority level mismatch (under/overqualified)">Seniority level mismatch (under/overqualified)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Additional Calibration Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Good profile, but we specifically need hands-on production experience."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Question Flow */}
              {actionType === "QUESTION" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Question for Search Lead *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Has this candidate led autonomous deployment in physical production environments?"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
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
                  className={`px-5 py-2 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                    actionType === "SHORTLIST"
                      ? "bg-brand-yellow hover:bg-brand-yellowHover text-slate-900"
                      : actionType === "HOLD"
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : actionType === "REJECT"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {submittingDecision ? "Submitting..." : "Confirm & Send Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        RecruitOS Executive Client Presentation Portal • Powered by {portal.agency.name} • 7-Day Temporary Protected Session
      </footer>
    </div>
  );
}
