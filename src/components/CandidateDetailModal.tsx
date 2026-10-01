"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Award,
  Calendar,
  FileText,
  PhoneCall,
  AlertCircle,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

export const CALL_DISPOSITIONS = [
  {
    value: "CONNECTED_INTERESTED",
    label: "🟢 Connected — Interested & Profile Matched",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    value: "CONNECTED_CALLBACK",
    label: "🟡 Connected — Call Back Requested",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    value: "CONNECTED_CTC_MISMATCH",
    label: "🟠 Connected — CTC / Budget Mismatch",
    badge: "bg-orange-100 text-orange-900 border-orange-300",
  },
  {
    value: "CONNECTED_NOTICE_MISMATCH",
    label: "🟠 Connected — Notice Period Too Long",
    badge: "bg-orange-100 text-orange-900 border-orange-300",
  },
  {
    value: "CONNECTED_NOT_INTERESTED",
    label: "🔴 Connected — Not Interested / Declined",
    badge: "bg-rose-100 text-rose-900 border-rose-300",
  },
  {
    value: "RINGING_NO_ANSWER",
    label: "⚪ Ringing / No Answer",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
  },
  {
    value: "UNREACHABLE_BUSY",
    label: "⚪ Switched Off / Busy / Out of Coverage",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
  },
];

export function normalizeDisposition(disp?: string | null): string {
  if (!disp) return "";
  const upper = disp.toUpperCase().trim();
  if (upper === "CALL_NOT_ANSWERED" || upper === "CALL_DISCONNECTED") return "RINGING_NO_ANSWER";
  if (upper === "CALL_BUSY" || upper === "NUMBER_SWITCHED_OFF") return "UNREACHABLE_BUSY";
  if (upper === "WRONG_INVALID_NUMBER") return "CONNECTED_NOT_INTERESTED";
  return upper;
}

export interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  mandateContext?: {
    id: string;
    title: string;
    clientName: string;
  };
  availableMandates?: Array<{
    id: string;
    title: string;
    client: { name: string };
  }>;
  onCallLogged?: (result: any) => void;
  onOpenSchedule?: (candidate: any, submissionId: string, mandateTitle: string) => void;
  onRemoveFromMandate?: (candidate: any) => void;
  onDeleteCandidate?: (candidate: any) => void;
}

export function CandidateDetailModal({
  isOpen,
  onClose,
  candidate,
  mandateContext,
  availableMandates = [],
  onCallLogged,
  onOpenSchedule,
  onRemoveFromMandate,
  onDeleteCandidate,
}: CandidateDetailModalProps) {
  // Active Tab for Right Dossier Pane: Default to "history" as per recruiter mental model
  const [activeTab, setActiveTab] = useState<"history" | "profile">("history");

  // Call Pad State
  const [callDisposition, setCallDisposition] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callMandateId, setCallMandateId] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [readyToRelocate, setReadyToRelocate] = useState("Yes");
  const [relevantExpYears, setRelevantExpYears] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [reasonForLeaving, setReasonForLeaving] = useState("");
  const [offerInHand, setOfferInHand] = useState("No");

  // Save Feedback & State
  const [loggingCall, setLoggingCall] = useState(false);
  const [callValidationError, setCallValidationError] = useState<string | null>(null);
  const [lastSavedOutcome, setLastSavedOutcome] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // History Accordion State (Show last 3, rest collapsed)
  const [showAllCallLogs, setShowAllCallLogs] = useState(false);

  // WhatsApp Slot Invite State
  const [sendingSlotInvite, setSendingSlotInvite] = useState(false);
  const [slotInviteSuccess, setSlotInviteSuccess] = useState<string | null>(null);
  const [slotInviteError, setSlotInviteError] = useState<string | null>(null);

  const activeCandidateIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !candidate) {
      activeCandidateIdRef.current = null;
      return;
    }

    const currentCandidateId = candidate.id || candidate.candidateId;
    if (activeCandidateIdRef.current === currentCandidateId) {
      return;
    }
    activeCandidateIdRef.current = currentCandidateId;

    // Reset default tab to history upon opening new candidate
    setActiveTab("history");
    setShowAllCallLogs(false);

    // Pre-populate saved call disposition
    const rawDisposition =
      candidate.lastCallDisposition ||
      candidate.lastCallOutcome ||
      (candidate.thisJobCallLogs && candidate.thisJobCallLogs.find((l: any) => l.disposition)?.disposition) ||
      (candidate.callLogs && candidate.callLogs.find((l: any) => l.disposition)?.disposition) ||
      (candidate.submissions && candidate.submissions.find((s: any) => s.lastCallDisposition)?.lastCallDisposition) ||
      "";
    const normalized = normalizeDisposition(rawDisposition);
    setCallDisposition(normalized);
    setCallNotes("");
    setCallValidationError(null);
    setLastSavedOutcome(null);

    // Pre-populate mandate alignment
    if (mandateContext) {
      setCallMandateId(mandateContext.id);
    } else if (candidate.callLogs && candidate.callLogs.length > 0 && candidate.callLogs[0]?.mandate?.id) {
      setCallMandateId(candidate.callLogs[0].mandate.id);
    } else if (candidate.submissions && candidate.submissions.length > 0) {
      setCallMandateId(candidate.submissions[0].mandate?.id || candidate.submissions[0].mandateId || "");
    } else {
      setCallMandateId("");
    }

    // Pre-populate callback date and time
    if (candidate.nextCallbackAt) {
      try {
        const d = new Date(candidate.nextCallbackAt);
        setCallbackDate(d.toISOString().split("T")[0]);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setCallbackTime(`${hh}:${mm}`);
      } catch (_) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setCallbackDate(tomorrow.toISOString().split("T")[0]);
        setCallbackTime("11:00");
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCallbackDate(tomorrow.toISOString().split("T")[0]);
      setCallbackTime("11:00");
    }

    setReadyToRelocate(candidate.readyToRelocate || "Yes");
    setRelevantExpYears(
      candidate.relevantExpYears !== undefined && candidate.relevantExpYears !== null
        ? String(candidate.relevantExpYears)
        : candidate.totalExpYears
        ? String(candidate.totalExpYears)
        : ""
    );
    setCurrentSalary(
      candidate.currentSalary ||
        (candidate.currentCtc ? `${(candidate.currentCtc / 100000).toFixed(1)} LPA` : "")
    );
    setExpectedSalary(
      candidate.expectedSalary ||
        (candidate.expectedCtc ? `${(candidate.expectedCtc / 100000).toFixed(1)} LPA` : "")
    );
    setNoticePeriod(
      candidate.noticePeriod ||
        (candidate.noticePeriodDays !== undefined && candidate.noticePeriodDays !== null
          ? `${candidate.noticePeriodDays} Days`
          : "30 Days")
    );
    setReasonForLeaving(candidate.reasonForLeaving || "");
    setOfferInHand(candidate.offerInHand || "No");
  }, [isOpen, candidate, mandateContext]);

  // Determine active submission ID & mandate title for scheduling
  let activeSubmissionId: string | null = null;
  let activeMandateTitle = "";

  if (mandateContext && candidate?.submissionId) {
    activeSubmissionId = candidate.submissionId;
    activeMandateTitle = mandateContext.title;
  } else if (candidate?.submissions && candidate.submissions.length > 0) {
    activeSubmissionId = candidate.submissions[0].id;
    activeMandateTitle = candidate.submissions[0].mandate?.title || "";
  } else if (candidate?.submissionId) {
    activeSubmissionId = candidate.submissionId;
    activeMandateTitle = mandateContext?.title || "";
  }

  // Core Call Save Function (Used by both auto-save and explicit form save)
  const executeCallSave = async (overrideDisposition?: string) => {
    const dispToSave = overrideDisposition || callDisposition;
    if (!dispToSave) {
      setCallValidationError("Please select a call disposition outcome before saving.");
      return;
    }

    if (dispToSave === "CONNECTED_CALLBACK" && (!callbackDate || !callbackTime)) {
      setCallValidationError("Please specify both a Date and Time for the scheduled call back.");
      return;
    }

    setLoggingCall(true);
    setCallValidationError(null);

    try {
      const combinedCallback =
        dispToSave === "CONNECTED_CALLBACK" && callbackDate && callbackTime
          ? new Date(`${callbackDate}T${callbackTime}:00`).toISOString()
          : null;

      let res: Response;

      if (mandateContext) {
        res = await fetch(`/api/mandates/${mandateContext.id}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: candidate.submissionId,
            disposition: dispToSave,
            notes: callNotes.trim() || undefined,
            callbackAt: combinedCallback,
            readyToRelocate,
            relevantExpYears: relevantExpYears ? parseFloat(relevantExpYears) : undefined,
            currentSalary: currentSalary.trim() || undefined,
            expectedSalary: expectedSalary.trim() || undefined,
            noticePeriod: noticePeriod.trim() || undefined,
            reasonForLeaving: reasonForLeaving.trim() || undefined,
            offerInHand,
          }),
        });
      } else {
        res = await fetch(`/api/candidates/${candidate.id}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandateId: callMandateId || null,
            disposition: dispToSave,
            notes: callNotes.trim() || undefined,
            callbackAt: combinedCallback,
            readyToRelocate,
            relevantExpYears: relevantExpYears ? parseFloat(relevantExpYears) : undefined,
            currentSalary: currentSalary.trim() || undefined,
            expectedSalary: expectedSalary.trim() || undefined,
            noticePeriod: noticePeriod.trim() || undefined,
            reasonForLeaving: reasonForLeaving.trim() || undefined,
            offerInHand,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log call outcome");
      }

      setCallDisposition(dispToSave);
      const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      const dispObj = CALL_DISPOSITIONS.find((d) => d.value === dispToSave);
      setLastSavedOutcome(`Saved at ${timeStr}`);

      if (onCallLogged) {
        onCallLogged(data);
      }
    } catch (err: any) {
      setCallValidationError(err.message || "Failed to log call outcome");
    } finally {
      setLoggingCall(false);
    }
  };

  // Auto-save handler when user picks from dropdown
  const handleDispositionChange = (newVal: string) => {
    setCallDisposition(newVal);
    setCallValidationError(null);
    if (!newVal) return;

    // For callback, don't auto-save yet; wait for date & time confirmation
    if (newVal === "CONNECTED_CALLBACK") {
      return;
    }

    // Auto-save immediately for all standard dispositions
    executeCallSave(newVal);
  };

  // 1-Click quick log helper
  const handleQuickLog = (dispValue: string) => {
    setCallDisposition(dispValue);
    executeCallSave(dispValue);
  };

  const handleSendSlotInvite = async () => {
    const candidateId = candidate.id || candidate.candidateId;
    if (!candidateId) return;
    setSendingSlotInvite(true);
    setSlotInviteSuccess(null);
    setSlotInviteError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/send-slot-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: activeSubmissionId,
          customTimes: candidate.preferredInterviewTimes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSlotInviteSuccess("WhatsApp slot picker dispatched to candidate!");
        setTimeout(() => setSlotInviteSuccess(null), 5000);
      } else {
        setSlotInviteError(data.error || "Failed to dispatch slot invite.");
      }
    } catch (err: any) {
      setSlotInviteError(err.message || "Failed to dispatch slot invite.");
    } finally {
      setSendingSlotInvite(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Keyboard Shortcuts (Esc to close, Ctrl/Cmd + Enter to save full form)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        executeCallSave();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, callDisposition, callbackDate, callbackTime, callNotes, readyToRelocate, relevantExpYears, currentSalary, expectedSalary, noticePeriod, reasonForLeaving, offerInHand]);

  if (!isOpen || !candidate) return null;

  const candidateCallLogs = candidate.callLogs || candidate.thisJobCallLogs || [];
  const otherJobsHistory = candidate.otherJobsHistory || [];
  const isConnected = callDisposition.startsWith("CONNECTED");

  // Show top 3 call logs by default, or all if expanded
  const displayedCallLogs = showAllCallLogs ? candidateCallLogs : candidateCallLogs.slice(0, 3);
  const hiddenCount = candidateCallLogs.length - 3;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* ========================================================================= */}
        {/* 1. TOP ANCHORED CANDIDATE HEADER                                          */}
        {/* ========================================================================= */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Botspring Gold Avatar */}
            <div className="w-11 h-11 rounded-full bg-[#fce17c] border border-[#f5d762] text-slate-900 font-black text-sm flex items-center justify-center shadow-2xs flex-shrink-0">
              {candidate.fullName.substring(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                  {candidate.fullName}
                </h2>
                {candidate.isSilverMedalist && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-md shadow-2xs">
                    🥈 Silver Medalist
                  </span>
                )}
                <span className="text-[11px] text-slate-400 font-mono">
                  Source: {(candidate.source || "GENERAL").replace(/_/g, " ")}
                </span>
              </div>

              {/* Subtitle & Inline Meta */}
              <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium truncate mt-0.5">
                <span className="truncate">
                  {candidate.currentTitle || "Professional"}
                  {candidate.currentCompany ? ` at ${candidate.currentCompany}` : ""}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-800 font-semibold">{candidate.totalExpYears || 0} yrs exp</span>
                {candidate.location && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{candidate.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* ⚡ Schedule Interview CTA */}
            {activeSubmissionId && onOpenSchedule && (
              <button
                type="button"
                onClick={() => {
                  onOpenSchedule(candidate, activeSubmissionId!, activeMandateTitle);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#FFD400] hover:bg-[#f0c800] active:bg-[#e0bb00] text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Schedule Interview Round"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-900" />
                <span>⚡ Schedule Interview</span>
              </button>
            )}

            {/* View Original CV Ghost Button */}
            {candidate.resumeUrl && (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-colors"
                title="Open Original Resume PDF"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>View CV</span>
              </a>
            )}

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TWO-PANE BODY:                                                         */}
        {/*    LEFT PANE = SCREENING PAD (ACTION)                                     */}
        {/*    RIGHT PANE = ACTIVITY & HISTORY (DEFAULT) + PROFILE & RESUME           */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT PANE (~45% width): LIVE CALL SCREENING PAD (ACTION FIRST)          */}
          {/* ----------------------------------------------------------------------- */}
          <div className="w-full md:w-[440px] flex-shrink-0 flex flex-col overflow-hidden bg-white">
            
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              
              {/* TOP ANCHORED CALL OUTCOME CARD (AUTO-SAVES INSTANTLY) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <PhoneCall className="h-3.5 w-3.5 text-slate-700" />
                    <span>Call Outcome <span className="text-rose-600">*</span></span>
                  </span>
                  
                  {/* Real-time Save Confirmation Badge */}
                  {loggingCall ? (
                    <span className="text-[10px] font-bold text-slate-500 flex items-center">
                      <div className="w-2.5 h-2.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                      Saving...
                    </span>
                  ) : lastSavedOutcome ? (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center animate-in fade-in">
                      <Check className="h-3 w-3 mr-0.5" /> {lastSavedOutcome}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Auto-saves on select</span>
                  )}
                </div>

                {/* 1-Click Quick Outcome Chips for Rapid Dials */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                    1-Click Rapid Log:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLog("RINGING_NO_ANSWER")}
                      disabled={loggingCall}
                      className={`py-1.5 px-2 border rounded-lg font-bold text-[11px] transition-colors shadow-2xs cursor-pointer text-center ${
                        callDisposition === "RINGING_NO_ANSWER"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                      title="Quick log Ringing No Answer and auto-save"
                    >
                      ⚪ No Answer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLog("UNREACHABLE_BUSY")}
                      disabled={loggingCall}
                      className={`py-1.5 px-2 border rounded-lg font-bold text-[11px] transition-colors shadow-2xs cursor-pointer text-center ${
                        callDisposition === "UNREACHABLE_BUSY"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                      title="Quick log Switched Off / Busy and auto-save"
                    >
                      ⚪ Busy / Off
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLog("CONNECTED_INTERESTED")}
                      disabled={loggingCall}
                      className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-colors shadow-2xs cursor-pointer text-center border ${
                        callDisposition === "CONNECTED_INTERESTED"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                      title="Select Connected — Interested and auto-save"
                    >
                      🟢 Interested
                    </button>
                  </div>
                </div>

                {/* Full Call Disposition Dropdown (Auto-saves on selection) */}
                <div>
                  <select
                    value={callDisposition}
                    onChange={(e) => handleDispositionChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 shadow-2xs cursor-pointer ${
                      !callDisposition ? "border-amber-300" : "border-slate-300"
                    }`}
                  >
                    <option value="">-- Select Call Outcome --</option>
                    {CALL_DISPOSITIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Validation Error Banner */}
                {callValidationError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center space-x-1.5 text-xs font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{callValidationError}</span>
                  </div>
                )}

                {/* Scheduled Callback Date & Time (Only expands when Callback requested) */}
                {callDisposition === "CONNECTED_CALLBACK" && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg space-y-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center">
                      <Clock className="h-3 w-3 text-amber-700 mr-1" />
                      <span>Set Follow-Up Callback Date & Time *</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-amber-300 rounded-md text-xs bg-white text-slate-900 font-semibold"
                        required
                      />
                      <input
                        type="time"
                        value={callbackTime}
                        onChange={(e) => setCallbackTime(e.target.value)}
                        className="w-full px-2 py-1.5 border border-amber-300 rounded-md text-xs bg-white text-slate-900 font-semibold"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => executeCallSave("CONNECTED_CALLBACK")}
                      disabled={loggingCall || !callbackDate || !callbackTime}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-md shadow-2xs transition-colors text-xs cursor-pointer disabled:opacity-50"
                    >
                      {loggingCall ? "Scheduling Callback..." : "⏰ Confirm & Save Callback"}
                    </button>
                  </div>
                )}
              </div>

              {/* Mandate Alignment Field */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  {mandateContext ? "Associated Mandate" : "Align to Job Mandate (Optional)"}
                </label>
                {mandateContext ? (
                  <div className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 truncate">
                    {mandateContext.title} ({mandateContext.clientName})
                  </div>
                ) : (
                  <select
                    value={callMandateId}
                    onChange={(e) => setCallMandateId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900"
                  >
                    <option value="">Talent Bank (General / Unassigned)</option>
                    {availableMandates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} — {m.client.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* DETAILED SCREENING PARAMETERS */}
              <div className={`p-3.5 rounded-xl border space-y-3 transition-colors ${
                isConnected ? "bg-slate-50/70 border-slate-200" : "bg-white border-slate-200/80"
              }`}>
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                  Screening Parameters (Shared with Client)
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Relevant Exp */}
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5 text-[10px]">Relevant Exp (Yrs)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 5"
                      value={relevantExpYears}
                      onChange={(e) => setRelevantExpYears(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    />
                  </div>

                  {/* Relocation */}
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5 text-[10px]">Ready to Relocate</label>
                    <select
                      value={readyToRelocate}
                      onChange={(e) => setReadyToRelocate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Hybrid Only">Hybrid Only</option>
                      <option value="Remote Only">Remote Only</option>
                      <option value="Already in Target City">Already in Target City</option>
                    </select>
                  </div>

                  {/* Current Salary */}
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5 text-[10px]">Current Salary</label>
                    <input
                      type="text"
                      placeholder="e.g. 12 LPA"
                      value={currentSalary}
                      onChange={(e) => setCurrentSalary(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    />
                  </div>

                  {/* Expected Salary */}
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5 text-[10px]">Expected Salary</label>
                    <input
                      type="text"
                      placeholder="e.g. 16 LPA"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    />
                  </div>

                  {/* Notice Period */}
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5 text-[10px]">Notice Period</label>
                    <input
                      type="text"
                      placeholder="e.g. 30 Days"
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    />
                  </div>

                  {/* Offer in Hand */}
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5 text-[10px]">Offer in Hand?</label>
                    <select
                      value={offerInHand}
                      onChange={(e) => setOfferInHand(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    >
                      <option value="No">No</option>
                      <option value="Yes (1 Offer)">Yes (1 Offer)</option>
                      <option value="Yes (Multiple)">Yes (Multiple)</option>
                      <option value="In Final Stages">In Final Stages</option>
                    </select>
                  </div>
                </div>

                {/* Reason for Leaving */}
                <div>
                  <label className="block font-semibold text-slate-600 mb-0.5 text-[10px]">Reason for Leaving</label>
                  <input
                    type="text"
                    placeholder="e.g. Looking for tech leadership & scale..."
                    value={reasonForLeaving}
                    onChange={(e) => setReasonForLeaving(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Call Notes Textarea */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Call Notes / Conversation Summary
                </label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. Candidate confirmed notice period is 30 days, willing to relocate to Mumbai, ready for tech interview round..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">
                Press Ctrl+Enter to save
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100 cursor-pointer text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeCallSave()}
                  disabled={loggingCall || !callDisposition}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-lg shadow-xs transition-all cursor-pointer text-xs disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {loggingCall ? (
                    <span>Saving...</span>
                  ) : (
                    <span>Save Screening & Notes</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT PANE (~55% width): INTELLIGENCE & DOSSIER                         */}
          {/* DEFAULT TAB = ACTIVITY & HISTORY                                        */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Right Pane Navigation Tabs */}
            <div className="px-5 pt-3 border-b border-slate-200/80 bg-white flex items-center space-x-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === "history"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Activity & History ({candidateCallLogs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === "profile"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Profile & Resume</span>
              </button>
            </div>

            {/* Right Pane Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeTab === "history" ? (
                <>
                  {/* TAB 1 (DEFAULT): ACTIVITY & CALL HISTORY */}
                  
                  {/* Client Review Feedback (De-colored, clean typography) */}
                  {(candidate.clientDecision || candidate.submittedToClientAt) && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="h-4 w-4 text-slate-700" />
                          <strong className="text-slate-900 text-xs font-bold">Client Review Feedback</strong>
                        </div>
                        {candidate.clientFeedbackAt && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(candidate.clientFeedbackAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Clean Status Typography (No loud fruit salad containers) */}
                      <div className="flex flex-wrap items-center gap-2">
                        {candidate.clientDecision === "SHORTLISTED_FOR_INTERVIEW" && (
                          <span className="inline-flex items-center text-xs font-bold text-slate-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1.5" />
                            Shortlisted for Interview by Client
                          </span>
                        )}
                        {candidate.clientDecision === "REJECTED_WITH_FEEDBACK" && (
                          <span className="inline-flex items-center text-xs font-bold text-slate-800">
                            <AlertCircle className="h-4 w-4 text-rose-600 mr-1.5" />
                            Rejected: {candidate.rejectionReason || "Feedback Provided"}
                          </span>
                        )}
                        {candidate.clientDecision === "INFO_REQUESTED" && (
                          <span className="inline-flex items-center text-xs font-bold text-slate-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mr-1.5" />
                            Information Requested by Client
                          </span>
                        )}
                        {(!candidate.clientDecision || candidate.clientDecision === "PENDING_REVIEW") &&
                          candidate.submittedToClientAt && (
                            <span className="inline-flex items-center text-xs font-semibold text-slate-700">
                              <Clock className="h-4 w-4 text-slate-500 mr-1.5" />
                              Awaiting Client Review
                            </span>
                          )}
                      </div>

                      {/* Client Proposed Interview Availability */}
                      {candidate.preferredInterviewTimes && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-800 flex items-center">
                              <Calendar className="h-3.5 w-3.5 text-slate-600 mr-1" />
                              <span>Proposed Interview Times:</span>
                            </span>
                            {/* Neutral Ghost Button for WhatsApp slot (no solid green) */}
                            <button
                              type="button"
                              onClick={handleSendSlotInvite}
                              disabled={sendingSlotInvite}
                              className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[10px] flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs transition-colors"
                              title="Send 4-option WhatsApp Slot Picker"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{sendingSlotInvite ? "Sending..." : "Send WhatsApp Slots"}</span>
                            </button>
                          </div>
                          <p className="font-semibold text-slate-800 pl-4">{candidate.preferredInterviewTimes}</p>

                          {/* Confirmed Slot Banner */}
                          {candidate.clientFeedbackNotes?.includes("Confirmed Slot ->") && (
                            <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold">
                              🎉 WhatsApp Confirmed: {candidate.clientFeedbackNotes.split('Confirmed Slot -> "')[1]?.split('"')[0] || "Slot Confirmed"}
                            </div>
                          )}

                          {slotInviteSuccess && (
                            <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                              ✅ {slotInviteSuccess}
                            </div>
                          )}
                          {slotInviteError && (
                            <div className="p-1.5 rounded bg-rose-50 text-rose-800 text-[11px] font-bold">
                              ⚠️ {slotInviteError}
                            </div>
                          )}
                        </div>
                      )}

                      {candidate.clientFeedbackNotes && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-xs text-slate-700">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Client Comments:</span>
                          <p className="italic">{candidate.clientFeedbackNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recruiter Call Records (Shows last 3, rest collapsible) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                        Call Records ({candidateCallLogs.length})
                      </span>
                      {candidateCallLogs.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          {showAllCallLogs ? "Showing all" : "Showing latest 3"}
                        </span>
                      )}
                    </div>

                    {candidateCallLogs.length === 0 ? (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                        No calls recorded yet. Select an outcome on the left to log your first call.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        {displayedCallLogs.map((log: any) => {
                          const disp = CALL_DISPOSITIONS.find((d) => d.value === log.disposition);
                          return (
                            <div key={log.id} className="p-3 space-y-1 hover:bg-slate-50 transition-colors text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">
                                  {disp?.label || log.disposition}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.calledAt).toLocaleString()} by {log.recruiter?.name || log.recruiterName || "Recruiter"}
                                </span>
                              </div>
                              {log.notes && <p className="text-slate-600 font-medium pl-0.5">{log.notes}</p>}
                              {log.callbackAt && (
                                <div className="text-[10px] text-amber-800 font-bold flex items-center space-x-1 mt-0.5 pl-0.5">
                                  <Clock className="h-3 w-3 text-amber-600" />
                                  <span>Callback: {new Date(log.callbackAt).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Collapsible Toggle for Older Records */}
                        {candidateCallLogs.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAllCallLogs(!showAllCallLogs)}
                            className="w-full py-2 px-3 text-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50/80 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                          >
                            {showAllCallLogs ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                <span>Collapse older call records</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                <span>View {hiddenCount} older call record{hiddenCount > 1 ? "s" : ""}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cross-Job Intelligence */}
                  {mandateContext && otherJobsHistory && otherJobsHistory.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                        Cross-Role History ({otherJobsHistory.length})
                      </span>
                      <div className="space-y-2">
                        {otherJobsHistory.map((otherJob: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <strong className="text-slate-900">{otherJob.mandateTitle}</strong>
                              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {otherJob.stage.replace(/_/g, " ")}
                              </span>
                            </div>
                            <span className="text-slate-500 text-[11px] block">{otherJob.clientName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* TAB 2: PROFILE & RESUME */}
                  
                  {/* Contact Snippets with 1-Click Copy */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Phone */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-700 font-mono font-semibold">{candidate.phone || "No phone"}</span>
                        {candidate.phone && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(candidate.phone, "phone")}
                            className="text-[10px] text-slate-500 hover:text-slate-900 font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedField === "phone" ? (
                              <span className="text-emerald-600 flex items-center">
                                <Check className="h-3 w-3 mr-0.5" /> Copied
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Copy className="h-3 w-3 mr-0.5" /> Copy
                              </span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Email */}
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-700 truncate max-w-[180px] font-medium">{candidate.email}</span>
                        {candidate.email && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(candidate.email, "email")}
                            className="text-[10px] text-slate-500 hover:text-slate-900 font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedField === "email" ? (
                              <span className="text-emerald-600 flex items-center">
                                <Check className="h-3 w-3 mr-0.5" /> Copied
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Copy className="h-3 w-3 mr-0.5" /> Copy
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Resdex Metrics Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Exp</span>
                        <strong className="text-slate-900 font-bold">{candidate.totalExpYears || 0} Years</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location</span>
                        <strong className="text-slate-900 font-semibold truncate block" title={candidate.location || "N/A"}>
                          {candidate.location || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current CTC</span>
                        <strong className="text-slate-900 font-semibold block">
                          {candidate.currentCtc ? `₹${(candidate.currentCtc / 100000).toFixed(1)}L` : "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expected CTC</span>
                        <strong className="text-emerald-700 font-bold block">
                          {candidate.expectedCtc ? `₹${(candidate.expectedCtc / 100000).toFixed(1)}L` : "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Key Skills */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                        Tagged Skills ({candidate.skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {candidate.summary && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                        Candidate Summary / Bio
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {candidate.summary}
                      </p>
                    </div>
                  )}

                  {/* Education Snippet */}
                  {candidate.qualification && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Education & Degree</span>
                      <p className="text-xs font-semibold text-slate-800">{candidate.qualification}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MODAL FOOTER STATUS BAR                                                */}
        {/* ========================================================================= */}
        <div className="px-6 py-2.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 flex-shrink-0 text-xs text-slate-500">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <span className="truncate max-w-sm">
              {mandateContext
                ? `Mandate: ${mandateContext.title} • Client: ${mandateContext.clientName}`
                : `Talent Bank • ${
                    candidate.submissions && candidate.submissions.length > 0
                      ? `Active on ${candidate.submissions[0].mandate.title}`
                      : "General Pool"
                  }`}
            </span>

            {onRemoveFromMandate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRemoveFromMandate(candidate);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center space-x-1 ml-2"
                title="Remove candidate from this mandate pipeline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove from Mandate</span>
              </button>
            )}

            {onDeleteCandidate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteCandidate(candidate);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center space-x-1 ml-2"
                title="Delete candidate profile from Talent Bank"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Profile</span>
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            RecruitOS Telemetry • Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Esc</kbd> to exit
          </span>
        </div>
      </div>
    </div>
  );
}

export default CandidateDetailModal;
