"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Calendar,
  Receipt,
  MoreVertical,
  Copy,
  Check,
  User,
  Zap,
  ShieldAlert,
  ChevronDown,
  PauseCircle,
  ThumbsDown,
  Sparkles,
  Trash2,
} from "lucide-react";
import { CALL_DISPOSITIONS } from "./CandidateDetailModal";

export interface CandidateSubmission {
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
}

export interface CandidateCardData {
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
  lastCallOutcome?: string | null;
  lastCallNotes?: string | null;
  lastCallAt?: string | null;
  nextCallbackAt?: string | null;
  readyToRelocate?: string | null;
  relevantExpYears?: number | null;
  reasonForLeaving?: string | null;
  offerInHand?: string | null;
  createdAt: string;
  submissions: CandidateSubmission[];
}

export interface StatusOption {
  value: string;
  label: string;
  badge?: string;
}

export interface CandidateCardProps {
  candidate: any;
  index?: number;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenModal: (candidate: any) => void;
  onScheduleInterview?: (candidate: any) => void;
  onRedeploy?: (candidate: any) => void;
  onRetentionPulse?: (candidate: any) => void;
  onConfirmJoining?: (candidate: any) => void;
  onStatusChange?: (candidate: any, newStatus: string) => void;
  onReject?: (candidate: any) => void;
  statusOptions?: StatusOption[];
  currentStatus?: string;
  clientPortalMode?: boolean;
  clientDecision?: string | null;
  onClientShortlist?: (candidate: any) => void;
  onClientHold?: (candidate: any) => void;
  onClientReject?: (candidate: any) => void;
  onClientViewCv?: (candidate: any) => void;
  onRemoveFromMandate?: (candidate: any) => void;
  onDeleteCandidate?: (candidate: any) => void;
}

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
        text: `Callback Overdue (${isToday ? timeStr : `${cbDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`})`,
        isOverdue: true,
      };
    }
    return {
      text: `Callback ${isToday ? `Today at ${timeStr}` : `${cbDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`}`,
      isOverdue: false,
    };
  } catch {
    return null;
  }
};

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  index,
  isSelected = false,
  onToggleSelect,
  onOpenModal,
  onScheduleInterview,
  onRedeploy,
  onRetentionPulse,
  onConfirmJoining,
  onStatusChange,
  onReject,
  statusOptions,
  currentStatus,
  clientPortalMode = false,
  clientDecision,
  onClientShortlist,
  onClientHold,
  onClientReject,
  onClientViewCv,
  onRemoveFromMandate,
  onDeleteCandidate,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close kebab menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const candidateId = candidate.id || candidate.candidateId || candidate.submissionId;
  const primarySub = candidate.submissions?.[0] || (candidate.stage ? candidate : null);
  const subStage = (candidate.stage || primarySub?.stage || candidate.status || "").toUpperCase();

  const isShortlisted = subStage === "CLIENT_SHORTLISTED" || subStage === "SCREENED_QUALIFIED";
  const isOfferStage = subStage === "OFFER_ISSUED" || subStage === "OFFER_ACCEPTED" || subStage === "OFFERED" || subStage.includes("OFFER");
  const isNoticeStage = subStage === "NOTICE_PERIOD_ACTIVE" || subStage.includes("NOTICE");

  // Client Portal Decision States
  const effectiveClientDecision = clientDecision || candidate.clientDecision;
  const isClientShortlisted =
    candidate.stage === "CLIENT_SHORTLISTED" ||
    effectiveClientDecision === "SHORTLISTED_FOR_INTERVIEW";
  const isClientHold =
    effectiveClientDecision === "INFO_REQUESTED" ||
    effectiveClientDecision === "HOLD";
  const isClientRejected =
    candidate.stage === "STAGE_REJECTED" ||
    effectiveClientDecision === "REJECTED_WITH_FEEDBACK";
  const isClientPending = !isClientShortlisted && !isClientHold && !isClientRejected;

  const dispObj = CALL_DISPOSITIONS.find((d) => d.value === (candidate.lastCallDisposition || candidate.lastCallOutcome));
  const cbBadge = getCallbackBadge(candidate.nextCallbackAt);

  // Plain comma-separated skills
  const rawSkills: string[] = Array.isArray(candidate.skills) ? candidate.skills : [];
  const topSkills = rawSkills.slice(0, 7).join(", ");
  const moreCount = rawSkills.length > 7 ? rawSkills.length - 7 : 0;

  // Notice period: subtle green text only if <= 15 days
  const isQuickNotice = candidate.noticePeriodDays !== null && candidate.noticePeriodDays !== undefined && candidate.noticePeriodDays <= 15;

  const defaultStatusOptions: StatusOption[] = [
    { value: "SCREENED_QUALIFIED", label: "Screened" },
    { value: "CLIENT_SHORTLISTED", label: "Client Shortlisted" },
    { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
    { value: "OFFER_ISSUED", label: "Offer Stage" },
    { value: "NOTICE_PERIOD_ACTIVE", label: "Notice Period" },
    { value: "JOINED_DAY_1_ACTIVE", label: "Joined Day 1" },
  ];

  const effectiveStatusOptions = statusOptions || defaultStatusOptions;
  const effectiveStatusValue = currentStatus || candidate.status || subStage || "";

  const handleCopyContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const contactStr = `${candidate.fullName} | Phone: ${candidate.phone || "N/A"} | Email: ${candidate.email || "N/A"}`;
    navigator.clipboard.writeText(contactStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  const handleStatusSelect = (newStatus: string) => {
    if (!newStatus) return;
    if (onStatusChange) {
      onStatusChange(candidate, newStatus);
      return;
    }
    if (newStatus === "INTERVIEW_SCHEDULED" && onScheduleInterview) {
      onScheduleInterview(candidate);
      return;
    }
    if (newStatus === "JOINED_DAY_1_ACTIVE" && onConfirmJoining) {
      onConfirmJoining(candidate);
      return;
    }
    onOpenModal(candidate);
  };

  return (
    <div
      onClick={() => (clientPortalMode && onClientViewCv ? onClientViewCv(candidate) : onOpenModal(candidate))}
      className={`group relative bg-white rounded-2xl border transition-all duration-150 cursor-pointer p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 ${
        clientPortalMode
          ? isClientShortlisted
            ? "border-emerald-300 ring-2 ring-emerald-50"
            : isClientHold
            ? "border-amber-300 ring-2 ring-amber-50"
            : isClientRejected
            ? "border-slate-200 opacity-80"
            : "border-slate-200/90"
          : isSelected
          ? "border-slate-900 ring-1 ring-slate-900/40 bg-slate-50/20"
          : "border-slate-200/90"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-5">
        {/* 1. LEFT SIDE (~80% width): Bio, Metrics Grid & Skills */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Top Header: Checkbox + Index + Full Name + Contact + Outcome status */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center space-x-2 min-w-0 flex-wrap">
              {/* Checkbox (recruiter only) */}
              {!clientPortalMode && onToggleSelect && (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect?.(candidateId)}
                    aria-label={`Select candidate ${candidate.fullName}`}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                </div>
              )}

              {/* Index Number */}
              {index !== undefined && (
                <span className="text-sm font-bold text-slate-400 select-none">
                  {index + 1}.
                </span>
              )}

              {/* Full Name */}
              <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {candidate.fullName}
              </span>

              {/* Client Portal Decision Badges */}
              {clientPortalMode ? (
                <>
                  {isClientShortlisted && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                      <Check className="h-3 w-3 text-emerald-700 stroke-[3]" />
                      <span>Shortlisted for Interview</span>
                    </span>
                  )}
                  {isClientHold && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                      <PauseCircle className="h-3 w-3 text-amber-700" />
                      <span>On Hold</span>
                    </span>
                  )}
                  {isClientRejected && (
                    <span className="bg-slate-100 text-slate-600 border border-slate-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      Declined
                    </span>
                  )}
                  {isClientPending && (
                    <span className="bg-amber-50 text-amber-900 border border-amber-200 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                      Awaiting Your Review
                    </span>
                  )}
                </>
              ) : (
                <>
                  {/* Subtle Silver Medalist Tag */}
                  {candidate.isSilverMedalist && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-md shadow-2xs">
                      🥈 Silver Medalist
                    </span>
                  )}
                </>
              )}

              {/* Subtle Phone Number Inline */}
              {candidate.phone && (
                <span className="text-xs font-mono text-slate-500 font-normal">
                  • {candidate.phone}
                </span>
              )}
            </div>

            {/* Call Outcome Status on Far Right of Header (recruiter only) */}
            {!clientPortalMode && (
              <div className="flex items-center space-x-2 flex-shrink-0">
                {dispObj && (
                  <span className="text-xs font-medium text-slate-700 flex items-center">
                    {dispObj.label}
                  </span>
                )}

                {cbBadge && (
                  <span className={`text-[11px] font-bold ${cbBadge.isOverdue ? "text-rose-600" : "text-amber-700"}`}>
                    • {cbBadge.text}
                  </span>
                )}

                <span className="text-[11px] text-slate-400">
                  Sourced {new Date(candidate.dateOfSourcing || candidate.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            )}
          </div>

          {/* Subtitle: Current Role at Current Company • Total Exp */}
          <div className="text-sm text-slate-700 font-medium truncate">
            <span>{candidate.currentTitle || "Professional"}</span>
            {candidate.currentCompany && (
              <span className="text-slate-900 font-semibold"> at {candidate.currentCompany}</span>
            )}
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-slate-700 font-semibold">
              {candidate.totalExpYears !== undefined && candidate.totalExpYears !== null
                ? `${candidate.totalExpYears} yrs exp`
                : "Fresher"}
            </span>
          </div>

          {/* Education Snippet */}
          {candidate.qualification && (
            <div className="text-xs text-slate-500 font-normal truncate">
              {candidate.qualification}
            </div>
          )}

          {/* Structured Metrics Matrix (4 Columns with Label-over-Value & Generous py-2.5) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2.5 border-y border-slate-100">
            {/* Col 1: TOTAL EXPERIENCE */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Total Exp
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate">
                {candidate.totalExpYears !== undefined && candidate.totalExpYears !== null
                  ? `${candidate.totalExpYears} Years`
                  : "0 Years"}
              </div>
            </div>

            {/* Col 2: LOCATION */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Location
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate" title={candidate.location || "Location N/A"}>
                {candidate.location || "Location N/A"}
              </div>
            </div>

            {/* Col 3: ANNUAL SALARY */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Annual Salary
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate">
                <span>{candidate.currentCtc ? `${(candidate.currentCtc / 100000).toFixed(1)}L` : "N/A"}</span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="font-bold text-emerald-700">
                  {candidate.expectedCtc ? `${(candidate.expectedCtc / 100000).toFixed(1)}L` : "N/A"}
                </span>
              </div>
            </div>

            {/* Col 4: NOTICE PERIOD */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Notice Period
              </div>
              <div className={`text-xs font-semibold truncate ${isQuickNotice ? "text-emerald-700 font-bold" : "text-slate-900"}`}>
                {candidate.noticePeriodDays === 0 ? "Immediate" : `${candidate.noticePeriodDays} Days`}
              </div>
            </div>
          </div>

          {/* Key Skills Block: Plain comma-separated text */}
          <div className="text-xs text-slate-600 leading-relaxed pt-0.5">
            <span className="font-semibold text-slate-700 mr-1.5">Key skills:</span>
            {topSkills ? (
              <span>
                {topSkills}
                {moreCount > 0 && (
                  <span className="text-slate-500 font-medium ml-1">
                    (+{moreCount} more)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic">No skills tagged</span>
            )}
          </div>

          {/* Client Portal Recruiter Recommendation Highlight */}
          {clientPortalMode && candidate.summary && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed space-y-1">
              <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Recruiter Recommendation</span>
              </div>
              <p>{candidate.summary}</p>
              {candidate.reasonForLeaving && (
                <div className="text-[11px] text-slate-500 pt-1 border-t border-blue-100/80">
                  Reason for change: <span className="italic text-slate-700">{candidate.reasonForLeaving}</span>
                </div>
              )}
            </div>
          )}

          {/* Client Portal Scheduled Interview Availability */}
          {clientPortalMode && isClientShortlisted && candidate.preferredInterviewTimes && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-950 flex items-center space-x-2 font-medium">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Interview schedule: <strong>{candidate.preferredInterviewTimes}</strong></span>
            </div>
          )}

          {/* Client Portal Hold / Decline Reason */}
          {clientPortalMode && (isClientHold || isClientRejected) && (candidate.rejectionReason || candidate.clientFeedbackNotes) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700">
              <span className="font-bold">{isClientHold ? "Hold note: " : "Decline reason: "}</span>
              <span>{candidate.rejectionReason || candidate.clientFeedbackNotes}</span>
            </div>
          )}
        </div>

        {/* 2. RIGHT SIDE: Client Portal Action Deck OR Recruiter Actions */}
        {clientPortalMode ? (
          <div
            className="w-full md:w-56 md:border-l border-slate-100 md:pl-5 flex flex-col justify-between items-end gap-3 flex-shrink-0 pt-2 md:pt-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top: Clean Initials Avatar in Botspring Gold */}
            <div className="w-10 h-10 rounded-full bg-[#fce17c] border border-[#f5d762] text-slate-900 font-black text-sm flex items-center justify-center shadow-2xs">
              {candidate.fullName.substring(0, 2).toUpperCase()}
            </div>

            {/* Client Action Buttons */}
            <div className="w-full space-y-1.5">
              <button
                type="button"
                onClick={() => onClientShortlist?.(candidate)}
                className={`w-full py-2 px-3 text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                  isClientShortlisted
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>{isClientShortlisted ? "Interview Scheduled ✓" : "Shortlist for Interview"}</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onClientHold?.(candidate)}
                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                    isClientHold
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-white hover:bg-amber-50 text-amber-900 border-slate-200"
                  }`}
                >
                  <PauseCircle className="h-3 w-3 text-amber-600" />
                  <span>{isClientHold ? "On Hold" : "Hold"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onClientReject?.(candidate)}
                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                    isClientRejected
                      ? "bg-rose-100 text-rose-900 border-rose-300"
                      : "bg-white hover:bg-rose-50 text-rose-700 border-slate-200"
                  }`}
                >
                  <ThumbsDown className="h-3 w-3 text-rose-500" />
                  <span>{isClientRejected ? "Declined" : "Decline"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => (onClientViewCv ? onClientViewCv(candidate) : onOpenModal(candidate))}
                className="w-full py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>View CV & Dossier</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full md:w-52 md:border-l border-slate-100 md:pl-5 flex flex-col justify-between items-end gap-3 flex-shrink-0 pt-1 md:pt-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top: Clean Initials Avatar in Botspring Gold */}
            <div className="w-11 h-11 rounded-full bg-[#fce17c] border border-[#f5d762] text-slate-900 font-black text-sm flex items-center justify-center shadow-2xs">
              {candidate.fullName.substring(0, 2).toUpperCase()}
            </div>

            {/* Middle & Bottom: Status Dropdown & Action Row */}
            <div className="w-full space-y-2">
              {/* Status Dropdown */}
              <div className="relative w-full">
                <select
                  value={effectiveStatusValue}
                  onChange={(e) => handleStatusSelect(e.target.value)}
                  className="w-full appearance-none py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400 transition-colors shadow-2xs"
                >
                  <option value="" disabled>Select status ⌵</option>
                  {effectiveStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

            {/* Action Row: View CV Ghost Button + Kebab Menu Button */}
            <div className="flex items-center space-x-1.5 w-full">
              {candidate.resumeUrl ? (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                  title="View Resume / CV"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>View CV</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenModal(candidate)}
                  className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-medium rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="View Profile Details"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>View Profile</span>
                </button>
              )}

              {/* Kebab Menu Trigger */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
                  title="More Options"
                  aria-label="More candidate actions"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 bottom-full mb-1 z-30 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    {candidate.isSilverMedalist && onRedeploy && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRedeploy(candidate);
                        }}
                        className="w-full text-left px-3 py-1.5 text-amber-900 hover:bg-amber-50 font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-600" />
                        <span>1-Click Redeploy Silver Medalist</span>
                      </button>
                    )}

                    {primarySub && isNoticeStage && onRetentionPulse && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRetentionPulse(candidate);
                        }}
                        className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        <span>Retention Pulse Check</span>
                      </button>
                    )}

                    {primarySub && (isOfferStage || isNoticeStage) && onConfirmJoining && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onConfirmJoining(candidate);
                        }}
                        className="w-full text-left px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Confirm Day-1 Joining & Tax Invoice</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyContact}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy Mobile & Email</span>
                        </>
                      )}
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenModal(candidate);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>View Full Candidate Dossier</span>
                    </button>

                    {(onRemoveFromMandate || onDeleteCandidate) && (
                      <div className="h-px bg-slate-100 my-1" />
                    )}

                    {onRemoveFromMandate && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRemoveFromMandate(candidate);
                        }}
                        className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                        title="Remove candidate from this mandate pipeline"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Remove from Mandate</span>
                      </button>
                    )}

                    {onDeleteCandidate && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDeleteCandidate(candidate);
                        }}
                        className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                        title="Delete candidate profile from Talent Bank"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>Delete Candidate Profile</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
