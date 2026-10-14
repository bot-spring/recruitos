"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Award,
  Calendar,
  FileText,
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
  Phone,
  Mail,
  ExternalLink,
  Edit2,
  Download,
  Briefcase,
  GraduationCap,
  Sparkles,
  Video,
  Send,
  User,
  MapPin,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { ScheduleInterviewModal } from "@/components/ScheduleInterviewModal";

export const CALL_DISPOSITIONS = [
  {
    value: "CONNECTED_INTERESTED",
    label: "🟢 Connected — Interested & Profile Matched",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    value: "CONNECTED_CALLBACK",
    label: "🟡 Call Rescheduled / Callback",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    value: "CONNECTED_CTC_MISMATCH",
    label: "🟠 CTC / Budget Mismatch",
    badge: "bg-orange-100 text-orange-900 border-orange-300",
  },
  {
    value: "CONNECTED_NOTICE_MISMATCH",
    label: "🔴 Notice Period Blocker",
    badge: "bg-rose-100 text-rose-900 border-rose-300",
  },
  {
    value: "CONNECTED_NOT_INTERESTED",
    label: "🔴 Not Interested / Declined",
    badge: "bg-rose-100 text-rose-900 border-rose-300",
  },
  {
    value: "RINGING_NO_ANSWER",
    label: "⚪ Ringing / No Answer",
    badge: "bg-slate-100 text-slate-800 border-slate-300",
  },
  {
    value: "UNREACHABLE_BUSY",
    label: "⚪ Switched Off / Busy",
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

// 6 Universal Pipeline Stages matching RecruitOS & Stitch design
export const PIPELINE_STAGES = [
  { value: "SCREENED_QUALIFIED", label: "Screened", stepNum: 1 },
  { value: "CLIENT_SHORTLISTED", label: "Client Shortlist", stepNum: 2 },
  { value: "INTERVIEW_SCHEDULED", label: "Interview", stepNum: 3 },
  { value: "OFFER_ISSUED", label: "Offer", stepNum: 4 },
  { value: "NOTICE_PERIOD_ACTIVE", label: "Notice Period", stepNum: 5 },
  { value: "JOINED_DAY_1_ACTIVE", label: "Joined", stepNum: 6 },
];

export function getActiveStepIndex(stage?: string | null): number {
  if (!stage) return 0;
  const s = stage.toUpperCase();
  if (s === "PARSED_RAW") return 0;
  if (s === "SCREENED_QUALIFIED" || s === "NOT_SHARED") return 0;
  if (
    s === "SUBMITTED_TO_CLIENT" ||
    s === "SHARED_WITH_COMPANY" ||
    s === "CLIENT_SHORTLISTED" ||
    s === "SELECTED_FOR_NEXT_ROUND"
  )
    return 1;
  if (s === "INTERVIEW_SCHEDULED" || s === "INTERVIEW_COMPLETED") return 2;
  if (s === "OFFER_ISSUED" || s === "OFFER_ACCEPTED" || s === "OFFERED") return 3;
  if (s === "NOTICE_PERIOD_ACTIVE" || s.includes("NOTICE")) return 4;
  if (s === "JOINED_DAY_1_ACTIVE" || s === "JOINED") return 5;
  return 0;
}

export function getNextStageAction(currentStageValue?: string | null): {
  nextStageValue: string | null;
  buttonLabel: string;
  isScheduleModal?: boolean;
} {
  const stepIdx = getActiveStepIndex(currentStageValue);
  switch (stepIdx) {
    case 0:
      return { nextStageValue: "CLIENT_SHORTLISTED", buttonLabel: "Advance to Client Shortlist" };
    case 1:
      return { nextStageValue: "INTERVIEW_SCHEDULED", buttonLabel: "Schedule Interview", isScheduleModal: true };
    case 2:
      return { nextStageValue: "OFFER_ISSUED", buttonLabel: "Advance to Offer Review" };
    case 3:
      return { nextStageValue: "NOTICE_PERIOD_ACTIVE", buttonLabel: "Confirm Acceptance" };
    case 4:
      return { nextStageValue: "JOINED_DAY_1_ACTIVE", buttonLabel: "Confirm Day-1 Joining" };
    case 5:
      return { nextStageValue: null, buttonLabel: "✓ Placed & Joined" };
    default:
      return { nextStageValue: "CLIENT_SHORTLISTED", buttonLabel: "Advance Stage" };
  }
}

export interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  mandateContext?: {
    id: string;
    title: string;
    clientName: string;
    skills?: string[];
    minBudget?: number;
    maxBudget?: number;
    minCtc?: number | null;
    maxCtc?: number | null;
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
  onStatusChange?: (submissionId: string, newStatus: string) => void;
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
  onStatusChange,
}: CandidateDetailModalProps) {
  // Current Pipeline Stage / Status
  const [currentStage, setCurrentStage] = useState<string>("SCREENED_QUALIFIED");
  const [updatingStage, setUpdatingStage] = useState<boolean>(false);

  // Quick Conversation Note & Action State
  const [callNotes, setCallNotes] = useState("");
  const [callDisposition, setCallDisposition] = useState("CONNECTED_INTERESTED");
  const [showCallbackPicker, setShowCallbackPicker] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");
  const [loggingCall, setLoggingCall] = useState(false);
  const [lastSavedOutcome, setLastSavedOutcome] = useState<string | null>(null);
  const [callValidationError, setCallValidationError] = useState<string | null>(null);

  // Candidate DNA (Screening Parameters) State & Edit Popover
  const [isEditingDna, setIsEditingDna] = useState(false);
  const [readyToRelocate, setReadyToRelocate] = useState("Yes");
  const [relevantExpYears, setRelevantExpYears] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [reasonForLeaving, setReasonForLeaving] = useState("");
  const [offerInHand, setOfferInHand] = useState("No");
  const [savingDna, setSavingDna] = useState(false);

  // Client Info Request Reply State
  const [replyingToClient, setReplyingToClient] = useState(false);
  const [clientReplyText, setClientReplyText] = useState("");
  const [sendingClientReply, setSendingClientReply] = useState(false);

  // General Modal State
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [callMandateId, setCallMandateId] = useState("");
  const [showAllCallLogs, setShowAllCallLogs] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  // WhatsApp Slot Invite State
  const [sendingSlotInvite, setSendingSlotInvite] = useState(false);
  const [slotInviteSuccess, setSlotInviteSuccess] = useState<string | null>(null);
  const [slotInviteError, setSlotInviteError] = useState<string | null>(null);

  // Slide-Over Flyout Drawer State for Interview Scheduling
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [localInterviews, setLocalInterviews] = useState<any[]>([]);

  const activeCandidateIdRef = useRef<string | null>(null);

  // Initialize or reset state when candidate changes
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

    // Resolve active stage
    const initialStage =
      candidate.stage ||
      candidate.status ||
      (candidate.submissions && candidate.submissions[0]?.stage) ||
      "SCREENED_QUALIFIED";
    setCurrentStage(initialStage);

    // Reset notes & errors
    setCallNotes("");
    setCallValidationError(null);
    setLastSavedOutcome(null);
    setShowCallbackPicker(false);
    setIsEditingDna(false);
    setOptionsMenuOpen(false);
    setShowAllCallLogs(false);
    setShowAllSkills(false);
    setReplyingToClient(false);
    setClientReplyText("");
    setIsScheduleDrawerOpen(false);
    setLocalInterviews(
      candidate.interviews ||
        (candidate.submissions && candidate.submissions[0]?.interviews) ||
        []
    );

    // Pre-populate saved call disposition
    const rawDisposition =
      candidate.lastCallDisposition ||
      candidate.lastCallOutcome ||
      (candidate.thisJobCallLogs && candidate.thisJobCallLogs.find((l: any) => l.disposition)?.disposition) ||
      (candidate.callLogs && candidate.callLogs.find((l: any) => l.disposition)?.disposition) ||
      (candidate.submissions && candidate.submissions.find((s: any) => s.lastCallDisposition)?.lastCallDisposition) ||
      "CONNECTED_INTERESTED";
    setCallDisposition(normalizeDisposition(rawDisposition) || "CONNECTED_INTERESTED");

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

    // Candidate DNA (Screening Parameters)
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

  // Determine active submission ID & mandate title
  let activeSubmissionId: string | null = null;
  let activeMandateTitle = "";
  let activeMandateClient = "";

  if (mandateContext) {
    activeSubmissionId = candidate?.submissionId || null;
    activeMandateTitle = mandateContext.title;
    activeMandateClient = mandateContext.clientName;
  } else if (candidate?.submissions && candidate.submissions.length > 0) {
    activeSubmissionId = candidate.submissions[0].id;
    activeMandateTitle = candidate.submissions[0].mandate?.title || "";
    activeMandateClient = candidate.submissions[0].mandate?.client?.name || "";
  } else if (candidate?.submissionId) {
    activeSubmissionId = candidate.submissionId;
    activeMandateTitle = "";
    activeMandateClient = "";
  }

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (isScheduleDrawerOpen) {
          setIsScheduleDrawerOpen(false);
        } else if (isEditingDna) {
          setIsEditingDna(false);
        } else {
          onClose();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSaveQuickNote();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, callNotes, callDisposition, callbackDate, callbackTime, isEditingDna, isScheduleDrawerOpen]);

  if (!isOpen || !candidate) return null;

  // Save quick conversation note or callback
  const handleSaveQuickNote = async () => {
    if (!callNotes.trim() && !showCallbackPicker) {
      setCallValidationError("Please enter a note or schedule a callback.");
      return;
    }

    if (showCallbackPicker && (!callbackDate || !callbackTime)) {
      setCallValidationError("Please select both Date and Time for the callback.");
      return;
    }

    setLoggingCall(true);
    setCallValidationError(null);

    try {
      const combinedCallback =
        showCallbackPicker && callbackDate && callbackTime
          ? new Date(`${callbackDate}T${callbackTime}:00`).toISOString()
          : null;

      let res: Response;
      const effectiveMandateId = mandateContext?.id || callMandateId;

      if (mandateContext && candidate.submissionId) {
        res = await fetch(`/api/mandates/${mandateContext.id}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: candidate.submissionId,
            disposition: showCallbackPicker ? "CONNECTED_CALLBACK" : callDisposition,
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
        const candidateId = candidate.id || candidate.candidateId;
        res = await fetch(`/api/candidates/${candidateId}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandateId: effectiveMandateId || null,
            disposition: showCallbackPicker ? "CONNECTED_CALLBACK" : callDisposition,
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
        throw new Error(data.error || "Failed to log note");
      }

      setCallNotes("");
      setShowCallbackPicker(false);
      const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      setLastSavedOutcome(`Note logged at ${timeStr}`);

      if (onCallLogged) {
        onCallLogged(data);
      }
    } catch (err: any) {
      setCallValidationError(err.message || "Failed to save note");
    } finally {
      setLoggingCall(false);
    }
  };

  // Save Candidate DNA (Screening Parameters)
  const handleSaveDna = async () => {
    setSavingDna(true);
    try {
      let res: Response;
      const effectiveMandateId = mandateContext?.id || callMandateId;

      if (mandateContext && candidate.submissionId) {
        res = await fetch(`/api/mandates/${mandateContext.id}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: candidate.submissionId,
            disposition: callDisposition || "CONNECTED_INTERESTED",
            notes: "Updated candidate screening parameters (DNA)",
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
        const candidateId = candidate.id || candidate.candidateId;
        res = await fetch(`/api/candidates/${candidateId}/call-log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandateId: effectiveMandateId || null,
            disposition: callDisposition || "CONNECTED_INTERESTED",
            notes: "Updated candidate screening parameters (DNA)",
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
      if (!res.ok) throw new Error(data.error || "Failed to update parameters");

      setIsEditingDna(false);
      setLastSavedOutcome("DNA updated successfully");
      if (onCallLogged) onCallLogged(data);
    } catch (err: any) {
      alert(err.message || "Failed to save screening parameters");
    } finally {
      setSavingDna(false);
    }
  };

  // Advance Pipeline Stage (stage = status)
  const handleStageClick = async (stageValue: string) => {
    if (!activeSubmissionId) return;
    const effectiveMandateId = mandateContext?.id || (candidate.submissions && candidate.submissions[0]?.mandate?.id);
    if (!effectiveMandateId) return;

    // Optimistic UI update
    setCurrentStage(stageValue);
    setUpdatingStage(true);

    if (onStatusChange) {
      onStatusChange(activeSubmissionId, stageValue);
    }

    try {
      const res = await fetch(`/api/mandates/${effectiveMandateId}/candidate-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: activeSubmissionId,
          status: stageValue,
        }),
      });

      if (!res.ok) {
        console.error("Failed to update status on server");
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
    } finally {
      setUpdatingStage(false);
    }
  };

  // Handle Dynamic Next Stage Header CTA
  const nextAction = getNextStageAction(currentStage);
  const handleNextActionClick = () => {
    if (nextAction.isScheduleModal && activeSubmissionId) {
      setIsScheduleDrawerOpen(true);
      return;
    }
    if (nextAction.nextStageValue) {
      handleStageClick(nextAction.nextStageValue);
    }
  };

  // WhatsApp 4-slot picker invite
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
          submissionId: candidate.submissionId || activeSubmissionId,
          proposedTimes: candidate.preferredInterviewTimes || "Tomorrow 11 AM, 2 PM, 4 PM, 6 PM",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch WhatsApp slot picker");
      setSlotInviteSuccess(data.message || "4-option slot picker delivered via WhatsApp");
    } catch (err: any) {
      setSlotInviteError(err.message || "Failed to dispatch WhatsApp message");
    } finally {
      setSendingSlotInvite(false);
    }
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Skill Matching & Breakdown Calculation
  const mandateSkills: string[] = mandateContext?.skills || [];
  const candidateSkills: string[] = Array.isArray(candidate.skills) ? candidate.skills : [];

  const matchedSkills: string[] = [];
  const otherSkills: string[] = [];
  const missingMandateSkills: string[] = [];

  if (mandateSkills.length > 0) {
    const mandateSkillsLower = mandateSkills.map((s) => s.toLowerCase().trim());
    candidateSkills.forEach((cs) => {
      const csLower = cs.toLowerCase().trim();
      if (mandateSkillsLower.some((ms) => ms.includes(csLower) || csLower.includes(ms))) {
        matchedSkills.push(cs);
      } else {
        otherSkills.push(cs);
      }
    });

    const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase().trim());
    mandateSkills.forEach((ms) => {
      const msLower = ms.toLowerCase().trim();
      if (!candidateSkillsLower.some((cs) => cs.includes(msLower) || msLower.includes(cs))) {
        missingMandateSkills.push(ms);
      }
    });
  } else {
    otherSkills.push(...candidateSkills);
  }

  // Calculate Match Score
  let calculatedMatchScore: number | null = null;
  if (typeof candidate.matchScore === "number") {
    calculatedMatchScore = candidate.matchScore;
  } else if (mandateSkills.length > 0) {
    calculatedMatchScore = Math.min(100, Math.round((matchedSkills.length / mandateSkills.length) * 100));
  }

  // Sourced Call Logs
  const candidateCallLogs: any[] =
    candidate.thisJobCallLogs ||
    candidate.callLogs ||
    (candidate.submissions && candidate.submissions[0]?.callLogs) ||
    [];

  // Active step index in 6-stage funnel
  const currentStepIndex = getActiveStepIndex(currentStage);

  // Upcoming or latest interview record (incorporating locally scheduled interviews)
  const interviews: any[] =
    localInterviews.length > 0
      ? localInterviews
      : candidate.interviews ||
        (candidate.submissions && candidate.submissions[0]?.interviews) ||
        [];
  const upcomingInterview = interviews.find((i: any) => i.status === "SCHEDULED") || interviews[0] || null;

  // Parse preferred interview times for confirmed slot
  let confirmedSlotText: string | null = null;
  if (candidate.preferredInterviewTimes && candidate.preferredInterviewTimes.includes("Confirmed:")) {
    confirmedSlotText = candidate.preferredInterviewTimes.split("Confirmed:")[1]?.split("|")[0]?.trim() || null;
  }

  // Calculate CTC Hike %
  let ctchikeText = "";
  if (currentSalary && expectedSalary) {
    const currNum = parseFloat(currentSalary.replace(/[^0-9.]/g, ""));
    const expNum = parseFloat(expectedSalary.replace(/[^0-9.]/g, ""));
    if (currNum > 0 && expNum > currNum) {
      const hikePct = Math.round(((expNum - currNum) / currNum) * 100);
      const multiple = (expNum / currNum).toFixed(1);
      ctchikeText = `+${hikePct}% (${multiple}x hike)`;
    }
  }

  // Cross-job history
  const otherJobsHistory: any[] = candidate.otherJobsHistory || [];

  // Relative days calculation
  const getDaysAgo = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return null;
    }
  };

  const daysAgoAdded = getDaysAgo(candidate.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-100 border border-slate-200/90 rounded-2xl w-full max-w-[1720px] h-[94vh] max-h-[960px] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* ========================================================================= */}
        {/* TOP BAR: BREADCRUMB, CV QUICK LINKS, PIPELINE STEPPER & STAGE ACTIONS     */}
        {/* ========================================================================= */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3 shadow-xs flex-shrink-0">
          <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            
            {/* Left: Breadcrumbs & Candidate Meta */}
            <div className="flex items-center gap-3">
              {isScheduleDrawerOpen ? (
                <button
                  type="button"
                  onClick={() => setIsScheduleDrawerOpen(false)}
                  className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 mr-1 text-slate-600 rotate-180" />
                  Back to Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 mr-1 text-slate-400 rotate-180" />
                  Candidates
                </button>
              )}
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {candidate.fullName}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {isScheduleDrawerOpen
                    ? "Schedule Interview & Dispatch"
                    : activeMandateTitle
                    ? "Active Application"
                    : "Talent Bank Profile"}
                </span>
                {candidate.isSilverMedalist && !isScheduleDrawerOpen && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center">
                    <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
                    Silver Medalist
                  </span>
                )}
              </div>

              {/* View CV & Download Header Quick Buttons */}
              {candidate.resumeUrl && !isScheduleDrawerOpen && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Open Resume in new tab"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>View CV</span>
                  </a>
                  <a
                    href={candidate.resumeUrl}
                    download
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Download Resume"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Right: Dynamic Next-Stage Primary Action & Schedule Button */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              {!isScheduleDrawerOpen && activeSubmissionId && (
                <button
                  type="button"
                  onClick={() => setIsScheduleDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Schedule Interview</span>
                </button>
              )}

              {/* Primary Context-Aware Action Button (Split style matching Stitch) */}
              {!isScheduleDrawerOpen && (
                <div className="inline-flex rounded-lg shadow-xs">
                  <button
                    type="button"
                    onClick={handleNextActionClick}
                    disabled={!activeSubmissionId || updatingStage || !nextAction.nextStageValue}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-l-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                  >
                    <span>{updatingStage ? "Updating Stage..." : nextAction.buttonLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-l border-slate-700 rounded-r-lg transition-colors cursor-pointer"
                    title="More actions"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Options dropdown */}
              {optionsMenuOpen && (
                <div className="absolute right-12 mt-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-xs animate-in fade-in">
                  {onRemoveFromMandate && (
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        onClose();
                        onRemoveFromMandate(candidate);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove from Mandate</span>
                    </button>
                  )}
                  {onDeleteCandidate && (
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        onClose();
                        onDeleteCandidate(candidate);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Profile</span>
                    </button>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pipeline Step Progress Indicator */}
          <div className="max-w-[1720px] mx-auto mt-3 pt-3 border-t border-slate-100 overflow-x-auto no-scrollbar">
            <nav aria-label="Hiring Pipeline Stages" className="flex items-center min-w-max space-x-2 text-xs font-medium">
              {PIPELINE_STAGES.map((stage, index) => {
                const isPassed = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isFuture = index > currentStepIndex;

                return (
                  <React.Fragment key={stage.value}>
                    <button
                      type="button"
                      disabled={!activeSubmissionId || updatingStage}
                      onClick={() => handleStageClick(stage.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer disabled:cursor-default ${
                        isCurrent
                          ? "bg-slate-900 text-white shadow-xs font-semibold"
                          : isPassed
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                          : "text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200/80"
                      }`}
                      title={activeSubmissionId ? `Switch stage to ${stage.label}` : "Attached mandate required to advance stage"}
                    >
                      {isPassed ? (
                        <CheckCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      ) : isCurrent ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-700 text-[10px] font-bold text-white">
                          {stage.stepNum}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-semibold">{stage.stepNum}</span>
                      )}
                      <span>
                        {stage.label}
                        {isCurrent ? " (In Progress)" : ""}
                      </span>
                    </button>

                    {index < PIPELINE_STAGES.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </header>

        {/* ======================================================================= */}
        {/* 3-COLUMN CANDIDATE EVALUATION WORKSPACE                                 */}
        {/* ======================================================================= */}
        <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-y-auto">
          
          {/* ======================================================================= */}
          {/* LEFT PROFILE SIDEBAR (lg:col-span-3)                                    */}
          {/* ======================================================================= */}
          <aside className="lg:col-span-3 space-y-4">
            
            {/* Profile Overview Card */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shadow-xs border-2 border-white ring-2 ring-slate-100">
                  {(candidate.fullName || "C")
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>

                <h2 className="mt-3.5 text-base font-bold text-slate-900">
                  {candidate.fullName}
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {candidate.currentTitle || "Software Engineer"}
                </p>
                {candidate.currentCompany && (
                  <p className="text-xs text-slate-500">@ {candidate.currentCompany}</p>
                )}

                {/* Match Pill (Calibrated style matching Stitch) */}
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-700 text-xs font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      calculatedMatchScore !== null && calculatedMatchScore >= 70
                        ? "bg-emerald-500"
                        : calculatedMatchScore !== null && calculatedMatchScore >= 40
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {calculatedMatchScore !== null ? `${calculatedMatchScore}% Mandate Match` : `${candidate.totalExpYears || 0} Yrs Experience`}
                  </span>
                </div>

                {candidate.location && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.location}</span>
                  </div>
                )}
              </div>

              {/* Direct Reachout Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Direct Reachout
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {candidate.phone ? (
                    <a
                      href={`tel:${candidate.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Call Desk</span>
                    </a>
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center bg-slate-50 rounded-lg">
                      No Phone
                    </div>
                  )}

                  {candidate.phone ? (
                    <a
                      href={`https://wa.me/${candidate.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-500" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center bg-slate-50 rounded-lg">
                      No WhatsApp
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Details with 1-Click Copy */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Contact Details
                </p>

                {/* Mobile Phone */}
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between group">
                  <div className="truncate pr-2">
                    <span className="block text-[10px] text-slate-400 font-medium">Mobile Phone</span>
                    <span className="text-xs font-semibold text-slate-800 tracking-wide">
                      {candidate.phone || "Not provided"}
                    </span>
                  </div>
                  {candidate.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(candidate.phone, "phone")}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-white transition-colors cursor-pointer"
                      title="Copy phone number"
                    >
                      {copiedField === "phone" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Email Address */}
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between group">
                  <div className="truncate pr-2">
                    <span className="block text-[10px] text-slate-400 font-medium">Email Address</span>
                    <span className="text-xs font-semibold text-slate-800 truncate block" title={candidate.email}>
                      {candidate.email || "Not provided"}
                    </span>
                  </div>
                  {candidate.email && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(candidate.email, "email")}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-white transition-colors cursor-pointer shrink-0"
                      title="Copy email address"
                    >
                      {copiedField === "email" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Meta Source Info */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                <span>
                  Source: <strong className="text-slate-600 font-medium">{candidate.source || "Direct Upload"}</strong>
                </span>
                <span>
                  Added:{" "}
                  <strong className="text-slate-600 font-medium">
                    {candidate.createdAt
                      ? `${new Date(candidate.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}${daysAgoAdded !== null ? ` (${daysAgoAdded}d ago)` : ""}`
                      : "Recently"}
                  </strong>
                </span>
              </div>
            </section>

            {/* Screening DNA / Compensation & Notice Metrics Card */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">Screening DNA</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingDna(!isEditingDna)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {isEditingDna ? "Cancel" : "Edit DNA"}
                </button>
              </div>

              {isEditingDna ? (
                /* INLINE EDIT MODE */
                <div className="space-y-2.5 animate-in fade-in text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Current CTC</label>
                    <input
                      type="text"
                      value={currentSalary}
                      onChange={(e) => setCurrentSalary(e.target.value)}
                      placeholder="e.g. 5.0 LPA"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Expected CTC</label>
                    <input
                      type="text"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      placeholder="e.g. 19.0 LPA"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Notice Period</label>
                    <input
                      type="text"
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      placeholder="e.g. 100 Days"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">External Offers in Hand?</label>
                    <select
                      value={offerInHand}
                      onChange={(e) => setOfferInHand(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-900"
                    >
                      <option value="No">None (Pipeline exclusive)</option>
                      <option value="Yes (1 Offer)">Yes (1 Offer in Hand)</option>
                      <option value="Yes (Multiple)">Yes (Multiple Offers)</option>
                      <option value="In Final Stages">In Final Stages</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Relocation</label>
                    <select
                      value={readyToRelocate}
                      onChange={(e) => setReadyToRelocate(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-900"
                    >
                      <option value="Yes">Yes — Willing to Relocate</option>
                      <option value="No">No (Prefers Delhi-NCR / Remote)</option>
                      <option value="Remote Only">Remote Only</option>
                      <option value="Already in Target City">Already in Target City</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Motivation for leaving</label>
                    <input
                      type="text"
                      value={reasonForLeaving}
                      onChange={(e) => setReasonForLeaving(e.target.value)}
                      placeholder="e.g. Seeking Senior role aligned to microservices"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDna}
                    disabled={savingDna}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {savingDna ? "Saving..." : "Save Parameters"}
                  </button>
                </div>
              ) : (
                /* READ-ONLY DISPLAY GRID MATCHING STITCH */
                <div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Current CTC */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Current CTC</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {currentSalary || (candidate.currentCtc ? `${(candidate.currentCtc / 100000).toFixed(1)} LPA` : "N/A")}
                      </p>
                    </div>

                    {/* Expected CTC */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Expected CTC</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <p className="text-sm font-bold text-slate-900">
                          {expectedSalary || (candidate.expectedCtc ? `${(candidate.expectedCtc / 100000).toFixed(1)} LPA` : "N/A")}
                        </p>
                      </div>
                      {ctchikeText && (
                        <span className="text-[9px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                          {ctchikeText}
                        </span>
                      )}
                    </div>

                    {/* Notice Period */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Notice Period</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {noticePeriod || (candidate.noticePeriodDays ? `${candidate.noticePeriodDays} Days` : "30 Days")}
                      </p>
                      <span className="text-[9px] text-slate-500">Subject to buyout</span>
                    </div>

                    {/* External Offers */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">External Offers</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {offerInHand.includes("Yes") ? offerInHand : "None"}
                      </p>
                      <span className="text-[9px] text-slate-500 font-medium">Pipeline exclusive</span>
                    </div>
                  </div>

                  {/* Relocation & Reason */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Relocation:</span>
                      <span className="font-medium text-slate-800">{readyToRelocate || "Yes"}</span>
                    </div>
                    {reasonForLeaving && (
                      <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200/80 text-slate-700 text-[11px] leading-relaxed">
                        <span className="font-semibold text-slate-900 block">Motivation for leaving:</span>
                        "{reasonForLeaving}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </aside>

          {/* ======================================================================= */}
          {/* CENTER WORKSPACE (lg:col-span-6)                                        */}
          {/* ======================================================================= */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Interactive Conversation / Debrief Logger */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs" data-purpose="interaction-logger">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Log Conversation / Debrief Note
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {lastSavedOutcome && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                      <Check className="w-3 h-3 mr-0.5" /> {lastSavedOutcome}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">Press Ctrl+Enter to save</span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. Candidate confirmed notice is negotiable down to 45 days with buy-out. Positive on technical discussion..."
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition resize-none font-medium"
                />
              </div>

              {/* Scheduled Callback Inline Selector */}
              {showCallbackPicker && (
                <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-lg space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-amber-700" />
                    Set Scheduled Callback Time
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={callbackDate}
                      onChange={(e) => setCallbackDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-slate-900 font-semibold"
                      required
                    />
                    <input
                      type="time"
                      value={callbackTime}
                      onChange={(e) => setCallbackTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-slate-900 font-semibold"
                      required
                    />
                  </div>
                </div>
              )}

              {callValidationError && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{callValidationError}</span>
                </div>
              )}

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={callDisposition}
                    onChange={(e) => setCallDisposition(e.target.value)}
                    className="text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-lg py-1 px-2.5 focus:ring-slate-400 focus:border-slate-400 shadow-2xs cursor-pointer"
                  >
                    {CALL_DISPOSITIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowCallbackPicker(!showCallbackPicker)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
                      showCallbackPicker
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "text-slate-600 bg-slate-100 hover:bg-slate-200 border-transparent"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{showCallbackPicker ? "Callback Active" : "Set Callback"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveQuickNote}
                  disabled={loggingCall || (!callNotes.trim() && !showCallbackPicker)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loggingCall ? "Logging..." : "Log Note"}
                </button>
              </div>
            </section>

            {/* Executive Overview Card */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Executive Overview
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {candidate.summary ||
                  `Software professional with ${candidate.totalExpYears || 5} years of technology experience, specializing in modern engineering stacks. Seeking opportunities aligned to product engineering, scalable architecture, and technical ownership.`}
              </p>

              {/* Highlights Row */}
              <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Exp</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{candidate.totalExpYears || 0} Years</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Primary Focus</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {candidate.currentTitle || "Full Stack"}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Org</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {candidate.currentCompany || "Technology"}
                  </p>
                </div>
              </div>
            </section>

            {/* Experience & Career Journey Timeline */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Experience & Career Journey
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {candidate.totalExpYears || 0} Years Total Industry Experience
                </span>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-2">
                {/* Timeline Item 1: Current Organization */}
                <div className="relative group">
                  <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-white ring-2 ring-slate-100" />
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      {candidate.currentTitle || "Software Engineer"}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Current Role ({candidate.totalExpYears || 0} yrs)
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600">
                    {candidate.currentCompany || "Singularis Software"} • Full-time
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Proven track record delivering scalable system components, high-throughput service APIs, and engineering solutions aligned to product milestones.
                  </p>
                </div>

                {/* Cross-Job Mandate History in Agency (if any) */}
                {otherJobsHistory.map((oj: any, idx: number) => (
                  <div key={idx} className="relative group">
                    <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-white ring-2 ring-slate-100" />
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-xs font-bold text-slate-800">{oj.mandateTitle}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {oj.stage?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{oj.clientName}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills Profile & Verification (No Nested Scrollbars) */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Skills Profile & Verification ({candidateSkills.length})
                  </h3>
                </div>
                {candidateSkills.length > 16 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {showAllSkills ? "Show Less" : `View all ${candidateSkills.length}`}
                  </button>
                )}
              </div>

              {/* Matched Requirements */}
              {matchedSkills.length > 0 && (
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Matched To Role ({matchedSkills.length} of {mandateSkills.length} required)
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing / Flagged Requirements */}
              {missingMandateSkills.length > 0 && (
                <div className="mt-4">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Missing Role Requirements (To probe in interview)</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingMandateSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium"
                      >
                        ✕ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Candidate Skills */}
              {otherSkills.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Additional Candidate Skills ({otherSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(showAllSkills ? otherSkills : otherSkills.slice(0, 16)).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Latest Touchpoint History Timeline (Pinned Drawer with Collapsible History) */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Touchpoint History
                  </h3>
                </div>
                {candidateCallLogs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCallLogs(!showAllCallLogs)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAllCallLogs ? "Hide history" : `View past history (${candidateCallLogs.length})`}</span>
                    {showAllCallLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {candidateCallLogs.length > 0 ? (
                <div className="space-y-2.5">
                  {/* Latest Touchpoint Banner */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        {CALL_DISPOSITIONS.find((d) => d.value === candidateCallLogs[0].disposition)?.label ||
                          candidateCallLogs[0].disposition}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(candidateCallLogs[0].calledAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        • by {candidateCallLogs[0].recruiter?.name || candidateCallLogs[0].recruiterName || "Recruiter"}
                      </span>
                    </div>
                    {candidateCallLogs[0].notes ? (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {candidateCallLogs[0].notes}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1 italic">
                        Call outcome recorded with candidate confirmation.
                      </p>
                    )}
                  </div>

                  {/* Expanded Older Logs */}
                  {showAllCallLogs && (
                    <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1 space-y-2">
                      {candidateCallLogs.slice(1).map((log: any) => (
                        <div key={log.id} className="pt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {CALL_DISPOSITIONS.find((d) => d.value === log.disposition)?.label || log.disposition}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.calledAt).toLocaleString()}
                            </span>
                          </div>
                          {log.notes && <p className="text-slate-600 mt-0.5">{log.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No touchpoints recorded yet.</p>
              )}
            </section>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT SIDEBAR: MANDATE, SCHEDULE & DOCUMENTS (lg:col-span-3)            */}
          {/* ======================================================================= */}
          <aside className="lg:col-span-3 space-y-4">
            
            {/* Mandate Context & Job Match Summary */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mandate Context</span>
                {calculatedMatchScore !== null && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {calculatedMatchScore}% Match
                  </span>
                )}
              </div>

              {activeMandateTitle ? (
                <>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{activeMandateTitle}</h3>
                  <p className="text-xs text-slate-600">
                    Client: <strong className="text-slate-800 font-medium">{activeMandateClient || "Client Organization"}</strong>
                  </p>

                  {/* Match Progress Breakdown */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Skill Match Ratio</span>
                      <span className="font-bold text-slate-800">
                        {matchedSkills.length} of {mandateSkills.length || 3} Required
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-slate-700 h-1.5 rounded-full"
                        style={{ width: `${calculatedMatchScore || 33}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : availableMandates.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Attach to Active Search Mandate:
                  </label>
                  <select
                    value={callMandateId}
                    onChange={(e) => setCallMandateId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value="">-- General Talent Bank --</option>
                    {availableMandates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.client.name})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mt-2">General Talent Bank Pool</p>
              )}
            </section>

            {/* Active Offer Details Card (Surfaced when at Offer Stage) */}
            {currentStepIndex >= 3 && (
              <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Active Offer Details
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {candidate.stage === "OFFER_ACCEPTED" ? "Offer Accepted" : "Offer Extended"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Offered CTC</span>
                    <strong className="text-slate-900 text-xs block mt-0.5">
                      {candidate.offeredCtc ? `₹${(candidate.offeredCtc / 100000).toFixed(1)} LPA` : "18.0 LPA"}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Joining Date</span>
                    <strong className="text-slate-900 text-xs block mt-0.5">
                      {candidate.offeredJoiningDate
                        ? new Date(candidate.offeredJoiningDate).toLocaleDateString()
                        : "Nov 1, 2026"}
                    </strong>
                  </div>
                </div>
              </section>
            )}

            {/* Interview Schedule & Calendar Card */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Interview Schedule</h3>
                </div>
                {activeSubmissionId && (
                  <button
                    type="button"
                    onClick={() => setIsScheduleDrawerOpen(true)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    + Schedule
                  </button>
                )}
              </div>

              {/* Confirmed Slot Banner matching Stitch design */}
              {upcomingInterview ? (
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 border-l-2 border-l-slate-800 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Confirmed Time Slot (IST)
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {upcomingInterview.scheduledAt
                      ? `${new Date(upcomingInterview.scheduledAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })} at ${new Date(upcomingInterview.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}`
                      : "Time TBD"}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Interviewer: {upcomingInterview.interviewerName || (upcomingInterview.panelistNames && upcomingInterview.panelistNames[0]) || "Tech Panel"}</span>
                    {upcomingInterview.meetingLink && (
                      <a
                        href={upcomingInterview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-slate-900 hover:text-slate-700"
                      >
                        Join Link
                      </a>
                    )}
                  </div>
                </div>
              ) : confirmedSlotText ? (
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 border-l-2 border-l-slate-800 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Confirmed Time Slot (IST)
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{confirmedSlotText}</p>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                  No interview scheduled yet.
                </div>
              )}

              {/* Action buttons (Reschedule / Remind) */}
              {activeSubmissionId && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScheduleDrawerOpen(true)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium text-center transition-colors cursor-pointer"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={handleSendSlotInvite}
                    disabled={sendingSlotInvite}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium text-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {sendingSlotInvite ? "Sending..." : "Send Reminder"}
                  </button>
                </div>
              )}
            </section>

            {/* Client Review / Action Alert Card */}
            {(candidate.clientDecision || candidate.submittedToClientAt) && (
              <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Client Review</span>
                  <span>
                    {candidate.clientFeedbackAt
                      ? new Date(candidate.clientFeedbackAt).toLocaleDateString()
                      : "Pending Feedback"}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200 border-l-2 border-l-slate-700 shadow-2xs space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {candidate.clientDecision === "SHORTLISTED_FOR_INTERVIEW"
                          ? "Shortlisted by Client"
                          : candidate.clientDecision === "INFO_REQUESTED"
                          ? "Information Requested by Client"
                          : "Client Review Decision"}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {candidate.clientQuestionText ||
                          candidate.clientFeedbackNotes ||
                          "Client requested breakdown of previous CTC slips and confirmation on notice period buyout."}
                      </p>
                    </div>
                  </div>

                  {replyingToClient ? (
                    <div className="pt-2 space-y-2">
                      <textarea
                        rows={2}
                        value={clientReplyText}
                        onChange={(e) => setClientReplyText(e.target.value)}
                        placeholder="Type reply to client..."
                        className="w-full text-xs p-2 border border-slate-200 rounded bg-slate-50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToClient(false)}
                          className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToClient(false);
                            alert("Reply sent to client portal.");
                          }}
                          className="px-3 py-1 text-xs text-white bg-slate-900 rounded font-semibold"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyingToClient(true)}
                      className="w-full mt-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Respond & Upload Proof
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Resume & Documents Card matching Stitch */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                Resume & Documents
              </h3>
              {candidate.resumeUrl ? (
                <div className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 bg-white rounded-md border border-slate-200 text-rose-500 shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        Candidate Resume (PDF)
                      </span>
                      <span className="text-[10px] text-slate-400">Original Sourced Document</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={candidate.resumeUrl}
                      download
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                  No resume attached.
                </div>
              )}
            </section>
          </aside>
        </main>

        {/* Slide-Over Interview Scheduler Drawer */}
        <ScheduleInterviewModal
          isOpen={isScheduleDrawerOpen}
          onClose={() => setIsScheduleDrawerOpen(false)}
          onBack={() => setIsScheduleDrawerOpen(false)}
          candidate={candidate}
          submissionId={activeSubmissionId}
          mandateTitle={activeMandateTitle}
          clientName={activeMandateClient}
          competencies={matchedSkills.length > 0 ? matchedSkills : candidateSkills}
          onSuccess={(interviewData) => {
            if (interviewData?.interview) {
              setLocalInterviews((prev) => [interviewData.interview, ...prev]);
            }
            setCurrentStage("INTERVIEW_SCHEDULED");
            if (onStatusChange && activeSubmissionId) {
              onStatusChange(activeSubmissionId, "INTERVIEW_SCHEDULED");
            }
            if (onCallLogged) {
              onCallLogged(interviewData);
            }
            setIsScheduleDrawerOpen(false);
          }}
        />
      </div>
    </div>
  );
}

export default CandidateDetailModal;
