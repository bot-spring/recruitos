"use client";

import React, { useState, useEffect } from "react";
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
}

export function CandidateDetailModal({
  isOpen,
  onClose,
  candidate,
  mandateContext,
  availableMandates = [],
  onCallLogged,
  onOpenSchedule,
}: CandidateDetailModalProps) {
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

  const [loggingCall, setLoggingCall] = useState(false);
  const [callValidationError, setCallValidationError] = useState<string | null>(null);

  const [sendingSlotInvite, setSendingSlotInvite] = useState(false);
  const [slotInviteSuccess, setSlotInviteSuccess] = useState<string | null>(null);
  const [slotInviteError, setSlotInviteError] = useState<string | null>(null);

  // Track the candidate whose details are loaded in the form
  const activeCandidateIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !candidate) {
      activeCandidateIdRef.current = null;
      return;
    }

    const currentCandidateId = candidate.id || candidate.candidateId;
    if (activeCandidateIdRef.current === currentCandidateId) {
      // Modal is already open for this exact candidate; don't wipe in-progress form state
      return;
    }
    activeCandidateIdRef.current = currentCandidateId;

    // Pre-populate saved call disposition from candidate history
    const rawDisposition =
      candidate.lastCallDisposition ||
      candidate.lastCallOutcome ||
      (candidate.thisJobCallLogs && candidate.thisJobCallLogs.find((l: any) => l.disposition)?.disposition) ||
      (candidate.callLogs && candidate.callLogs.find((l: any) => l.disposition)?.disposition) ||
      (candidate.submissions && candidate.submissions.find((s: any) => s.lastCallDisposition)?.lastCallDisposition) ||
      "";
    setCallDisposition(normalizeDisposition(rawDisposition));
    setCallNotes("");
    setCallValidationError(null);

    // Pre-populate mandate alignment
    if (mandateContext) {
      setCallMandateId(mandateContext.id);
    } else if (candidate.callLogs && candidate.callLogs.length > 0 && candidate.callLogs[0]?.mandate?.id) {
      // Prioritize the mandate from the most recent logged interaction
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
          (candidate.noticePeriodDays ? `${candidate.noticePeriodDays} Days` : "30 Days")
      );
      setReasonForLeaving(candidate.reasonForLeaving || "");
      setOfferInHand(candidate.offerInHand || "No");
  }, [isOpen, candidate, mandateContext]);

  if (!isOpen || !candidate) return null;

  // Determine active submission ID & mandate title for scheduling
  let activeSubmissionId: string | null = null;
  let activeMandateTitle = "";

  if (mandateContext && candidate.submissionId) {
    activeSubmissionId = candidate.submissionId;
    activeMandateTitle = mandateContext.title;
  } else if (candidate.submissions && candidate.submissions.length > 0) {
    activeSubmissionId = candidate.submissions[0].id;
    activeMandateTitle = candidate.submissions[0].mandate?.title || "";
  } else if (candidate.submissionId) {
    activeSubmissionId = candidate.submissionId;
    activeMandateTitle = mandateContext?.title || "";
  }

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
        setSlotInviteSuccess("WhatsApp 4-option slot picker dispatched to candidate!");
        setTimeout(() => setSlotInviteSuccess(null), 6000);
      } else {
        setSlotInviteError(data.error || "Failed to dispatch slot invite.");
      }
    } catch (err: any) {
      setSlotInviteError(err.message || "Failed to dispatch slot invite.");
    } finally {
      setSendingSlotInvite(false);
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callDisposition) {
      setCallValidationError("Please select a call disposition outcome before saving.");
      return;
    }

    if (callDisposition === "CONNECTED_CALLBACK" && (!callbackDate || !callbackTime)) {
      setCallValidationError("Please specify both a Date and Time for the scheduled call back.");
      return;
    }

    setLoggingCall(true);
    setCallValidationError(null);

    try {
      const combinedCallback =
        callDisposition === "CONNECTED_CALLBACK" && callbackDate && callbackTime
          ? new Date(`${callbackDate}T${callbackTime}:00`).toISOString()
          : null;

      let res: Response;

      if (mandateContext) {
        // Mandate Workspace call log endpoint
        res = await fetch(`/api/mandates/${mandateContext.id}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: candidate.submissionId,
            disposition: callDisposition,
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
        // Candidate Bank call log endpoint
        res = await fetch(`/api/candidates/${candidate.id}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandateId: callMandateId || null,
            disposition: callDisposition,
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

      // Keep saved disposition selected
      setCallDisposition(callDisposition);
      setCallNotes("");

      if (onCallLogged) {
        onCallLogged(data);
      }
    } catch (err: any) {
      setCallValidationError(err.message || "Failed to log call outcome");
    } finally {
      setLoggingCall(false);
    }
  };

  // Interactions list (unify callLogs from Candidate Bank and thisJobCallLogs from Mandate Workspace)
  const candidateCallLogs = candidate.callLogs || candidate.thisJobCallLogs || [];
  const otherJobsHistory = candidate.otherJobsHistory || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Candidate Screening & Call Record
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Source: {(candidate.source || "GENERAL").replace(/_/g, " ")}
              </span>
              {candidate.qualification && (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  {candidate.qualification}
                </span>
              )}
              {candidate.isSilverMedalist && (
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                  <Award className="h-3 w-3 text-amber-700" />
                  <span>Silver Medalist</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-extrabold text-slate-900">{candidate.fullName}</h2>
              <span className="text-xs text-slate-500 font-medium">
                {candidate.currentTitle || "Professional"}{" "}
                {candidate.currentCompany ? `at ${candidate.currentCompany}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* ⚡ Schedule Interview CTA (Active in BOTH Talent Bank and Mandate Workspace) */}
            {activeSubmissionId && onOpenSchedule && (
              <button
                type="button"
                onClick={() => {
                  onOpenSchedule(candidate, activeSubmissionId!, activeMandateTitle);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>⚡ Schedule Interview</span>
              </button>
            )}

            {candidate.resumeUrl && (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-brand-surfaceLight hover:bg-brand-surface text-slate-800 text-xs font-bold rounded-xl border border-brand-surfaceDark transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>View Original CV</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
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
              <strong className="text-slate-900 text-xs block font-mono">{candidate.phone || "N/A"}</strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Email Address</span>
              <strong className="text-slate-900 text-xs block truncate">{candidate.email}</strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Total Experience</span>
              <strong className="text-slate-900 text-xs block">{candidate.totalExpYears || 0} Years</strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px]">
                {candidate.currentCtc || candidate.expectedCtc ? "Compensation (CTC)" : "Qualification"}
              </span>
              {candidate.currentCtc || candidate.expectedCtc ? (
                <strong className="text-slate-900 text-xs block">
                  {candidate.currentCtc ? `${(candidate.currentCtc / 100000).toFixed(1)}L` : "N/A"} →{" "}
                  <span className="text-emerald-700">
                    {candidate.expectedCtc
                      ? `${(candidate.expectedCtc / 100000).toFixed(1)}L ${candidate.currency || "INR"}`
                      : "N/A"}
                  </span>
                </strong>
              ) : (
                <strong className="text-slate-900 text-xs block truncate">{candidate.qualification || "N/A"}</strong>
              )}
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

                {/* Associated Job Mandate */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {mandateContext ? "Associated Mandate" : "Align to Job Mandate (Optional)"}
                  </label>
                  {mandateContext ? (
                    <div className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 truncate">
                      {mandateContext.title} ({mandateContext.clientName})
                    </div>
                  ) : (
                    <select
                      value={callMandateId}
                      onChange={(e) => setCallMandateId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-900"
                    >
                      <option value="">Talent Bank (General Screening / Unassigned)</option>
                      {availableMandates.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} — {m.client.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Scheduled Callback Date & Time */}
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
                  onClick={onClose}
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
              <span>Call & Activity History {mandateContext ? "(This Job)" : ""}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {candidateCallLogs.length} interaction(s) logged
              </span>
            </h3>

            {/* Client Review Portal Feedback Event (If Available) */}
            {(candidate.clientDecision || candidate.submittedToClientAt) && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    <strong className="text-slate-900 text-xs font-bold">Client Review Portal Telemetry</strong>
                  </div>
                  {candidate.clientFeedbackAt && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Decision logged: {new Date(candidate.clientFeedbackAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Decision Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  {candidate.clientDecision === "SHORTLISTED_FOR_INTERVIEW" && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mr-1" />
                      Shortlisted for Interview by Client
                    </span>
                  )}
                  {candidate.clientDecision === "REJECTED_WITH_FEEDBACK" && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-700 mr-1" />
                      Rejected by Client: {candidate.rejectionReason || "Feedback Provided"}
                    </span>
                  )}
                  {candidate.clientDecision === "INFO_REQUESTED" && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-700 mr-1" />
                      Information Requested / On Hold by Client
                    </span>
                  )}
                  {(!candidate.clientDecision || candidate.clientDecision === "PENDING_REVIEW") &&
                    candidate.submittedToClientAt && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        <Clock className="h-3.5 w-3.5 text-blue-700 mr-1" />
                        Shared with Client — Awaiting Feedback
                      </span>
                    )}
                  {candidate.submittedToClientAt && (
                    <span className="text-[11px] text-slate-500">
                      (Shared: {new Date(candidate.submittedToClientAt).toLocaleDateString()})
                    </span>
                  )}
                </div>

                {/* Proposed Interview Times */}
                {candidate.preferredInterviewTimes && (
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-xs text-slate-800 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-emerald-800 flex items-center">
                        <Calendar className="h-3.5 w-3.5 text-emerald-700 mr-1.5 shrink-0" />
                        <span>Client Proposed Interview Availability:</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSendSlotInvite}
                        disabled={sendingSlotInvite}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[10px] flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                        title="Send 4-option Interactive List Message to candidate's WhatsApp"
                      >
                        {sendingSlotInvite ? (
                          <span>Dispatching...</span>
                        ) : (
                          <span>📱 Send WhatsApp Slot Picker</span>
                        )}
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900 pl-5">
                      {candidate.preferredInterviewTimes}
                    </p>

                    {/* Confirmed Slot Banner if candidate replied via WhatsApp */}
                    {candidate.clientFeedbackNotes?.includes("Confirmed Slot ->") && (
                      <div className="ml-5 p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center space-x-2 shadow-2xs">
                        <span className="text-base">🎉</span>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 block">
                            WhatsApp Slot Confirmed by Candidate:
                          </span>
                          <span className="text-xs font-black text-emerald-900">
                            {candidate.clientFeedbackNotes.split('Confirmed Slot -> "')[1]?.split('"')[0] || "Slot Confirmed"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Reschedule Request Banner if candidate requested another time */}
                    {candidate.clientFeedbackNotes?.includes("Requested alternative slot ->") && (
                      <div className="ml-5 p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-center space-x-2 shadow-2xs">
                        <span className="text-base">🔄</span>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 block">
                            Candidate Requested Alternative Time Window:
                          </span>
                          <span className="text-xs font-bold text-amber-900">
                            Check WhatsApp conversation for candidate availability.
                          </span>
                        </div>
                      </div>
                    )}

                    {slotInviteSuccess && (
                      <div className="ml-5 p-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center space-x-1.5">
                        <span>✅</span>
                        <span>{slotInviteSuccess}</span>
                      </div>
                    )}
                    {slotInviteError && (
                      <div className="ml-5 p-1.5 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 flex items-center space-x-1.5">
                        <span>⚠️</span>
                        <span>{slotInviteError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Client Feedback Comments */}
                {candidate.clientFeedbackNotes && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-700 flex items-center">
                      <MessageSquare className="h-3 w-3 text-slate-500 mr-1" />
                      <span>Client Comments & WhatsApp Timeline:</span>
                    </span>
                    <p className="italic text-slate-700 pl-4 whitespace-pre-line">
                      "{candidate.clientFeedbackNotes}"
                    </p>
                  </div>
                )}

                {/* Client Question Text */}
                {candidate.clientQuestionText && (
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs text-slate-800 space-y-1">
                    <span className="text-[11px] font-extrabold text-amber-800 flex items-center">
                      <AlertTriangle className="h-3 w-3 text-amber-600 mr-1" />
                      <span>Client Question / Clarification Requested:</span>
                    </span>
                    <p className="italic text-slate-800 pl-4">
                      "{candidate.clientQuestionText}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Candidate Bank client question fallback */}
            {!mandateContext &&
              candidate.submissions &&
              candidate.submissions.length > 0 &&
              candidate.submissions[0].clientQuestionText &&
              !candidate.clientQuestionText && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-blue-800">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>Inquiry from Client Hiring Manager:</span>
                  </div>
                  <p className="italic bg-white p-2.5 rounded-lg border border-blue-200 text-slate-800">
                    "{candidate.submissions[0].clientQuestionText}"
                  </p>
                </div>
              )}

            {candidateCallLogs.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                No calls logged for this candidate yet. Use the form above to record your conversation.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                {candidateCallLogs.map((log: any) => {
                  const disp = CALL_DISPOSITIONS.find((d) => d.value === log.disposition);
                  return (
                    <div key={log.id} className="p-3 space-y-1 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              disp?.badge || "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {disp?.label || log.disposition}
                          </span>
                          {log.mandate && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded font-semibold">
                              {log.mandate.title} {log.mandate.client?.name ? `(${log.mandate.client.name})` : ""}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.calledAt).toLocaleString()} by{" "}
                          <strong>{log.recruiter?.name || log.recruiterName || "Recruiter"}</strong>
                        </span>
                      </div>
                      {log.notes && <p className="text-xs text-slate-700 font-medium pl-1">{log.notes}</p>}
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

          {/* HISTORY FROM OTHER JOBS IN THE AGENCY (Mandate Workspace Context) */}
          {mandateContext && otherJobsHistory && (
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>History From Other Agency Jobs ({otherJobsHistory.length})</span>
                <span className="text-[10px] text-purple-700 font-bold">Cross-Role Intelligence</span>
              </h3>

              {otherJobsHistory.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                  This candidate has not been considered for other jobs in your agency yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {otherJobsHistory.map((otherJob: any, idx: number) => (
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

                      {otherJob.callLogs && otherJob.callLogs.length > 0 && (
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
          )}

          {/* RESUME PREVIEW & SKILLS */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-600" />
              <span>Resume Summary & Skills</span>
            </h3>
            {candidate.summary && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
                {candidate.summary}
              </div>
            )}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {candidate.skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            {mandateContext
              ? `Mandate: ${mandateContext.title} • Client: ${mandateContext.clientName}`
              : `Talent Bank • ${
                  candidate.submissions && candidate.submissions.length > 0
                    ? `Active on ${candidate.submissions[0].mandate.title}`
                    : "General Pool"
                }`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer text-xs"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateDetailModal;
