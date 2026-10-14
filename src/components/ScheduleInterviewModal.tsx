"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  X,
  Clock,
  Video,
  Copy,
  Check,
  CheckCircle2,
  Users,
  MessageSquare,
  Mail,
  Smartphone,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
  AlertCircle,
} from "lucide-react";

export interface ScheduleCandidateTarget {
  id?: string;
  candidateId?: string;
  fullName: string;
  email: string;
  phone?: string | null;
  stage?: string | null;
  status?: string | null;
  skills?: string[];
}

export interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  candidate: ScheduleCandidateTarget | null;
  submissionId: string | null;
  mandateTitle?: string;
  clientName?: string;
  competencies?: string[];
  onSuccess?: (interviewData: any) => void;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onBack,
  candidate,
  submissionId,
  mandateTitle,
  clientName,
  competencies = [],
  onSuccess,
}: ScheduleInterviewModalProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "preview">("calendar");
  const [previewChannel, setPreviewChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [interviewType, setInterviewType] = useState("TECHNICAL_ROUND");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [platform, setPlatform] = useState<"meet" | "zoom" | "custom">("meet");
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/xyz-rec-live");
  
  // Date & Time (IST)
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("15:00");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0); // 0 = tomorrow 3pm, 1 = thu 11am, null = custom

  // Panelists
  const [panelistList, setPanelistList] = useState<string[]>([
    "Tech Lead",
    "Engineering Director",
  ]);
  const [newPanelistInput, setNewPanelistInput] = useState("");

  // Multi-Channel Dispatch Toggles
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [instructions, setInstructions] = useState("Please test camera/mic and join 5 minutes prior.");

  // Recommended slots helper
  const getTomorrowSlot = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const dayNum = d.getDate();
    return {
      dateStr: d.toISOString().split("T")[0],
      display: `Tomorrow, ${monthName} ${dayNum} · 03:00 PM - 04:00 PM`,
      timeStr: "15:00",
    };
  };

  const getDayAfterSlot = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const dayNum = d.getDate();
    return {
      dateStr: d.toISOString().split("T")[0],
      display: `${dayName}, ${monthName} ${dayNum} · 11:00 AM - 12:00 PM`,
      timeStr: "11:00",
    };
  };

  const tomorrowSlot = getTomorrowSlot();
  const dayAfterSlot = getDayAfterSlot();

  useEffect(() => {
    if (isOpen && candidate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      setDateValue(dateStr);
      setTimeValue("15:00");
      setSelectedSlotIndex(0);
      setInterviewType("TECHNICAL_ROUND");
      setDurationMinutes(60);
      setPlatform("meet");
      setMeetingLink("https://meet.google.com/xyz-rec-live");
      setPanelistList(["Tech Lead", "Engineering Director"]);
      setSendWhatsApp(true);
      setSendEmail(true);
      setError(null);
      setActiveTab("calendar");
      setPreviewChannel("whatsapp");
    }
  }, [isOpen, candidate]);

  // Keyboard accessibility: ESC closes drawer or goes back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (onBack) {
          onBack();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onBack, onClose]);

  if (!isOpen || !candidate) return null;

  // Platform link switcher
  const handleSelectPlatform = (type: "meet" | "zoom" | "custom") => {
    setPlatform(type);
    if (type === "meet") {
      const randomSuffix = Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6);
      setMeetingLink(`https://meet.google.com/rec-${randomSuffix}`);
    } else if (type === "zoom") {
      setMeetingLink("https://zoom.us/j/9876543210?pwd=recruitoslive");
    } else {
      setMeetingLink("");
    }
  };

  const handleRegenerateLink = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6);
    if (platform === "zoom") {
      setMeetingLink(`https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}?pwd=live`);
    } else {
      setMeetingLink(`https://meet.google.com/rec-${randomSuffix}`);
    }
  };

  const handleCopyLink = () => {
    if (!meetingLink) return;
    navigator.clipboard.writeText(meetingLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(null as any), 2000);
  };

  // Panelist management
  const handleRemovePanelist = (index: number) => {
    setPanelistList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPanelist = () => {
    const trimmed = newPanelistInput.trim();
    if (trimmed && !panelistList.includes(trimmed)) {
      setPanelistList((prev) => [...prev, trimmed]);
      setNewPanelistInput("");
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionId) {
      setError("Cannot schedule interview: candidate has no active mandate submission.");
      return;
    }

    if (!dateValue || !timeValue) {
      setError("Please select a date and start time for the interview.");
      return;
    }

    if (!meetingLink.trim()) {
      setError("Please provide a valid meeting link.");
      return;
    }

    setScheduling(true);
    setError(null);

    try {
      const combinedDateTime = new Date(`${dateValue}T${timeValue}:00`).toISOString();

      const res = await fetch("/api/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          scheduledAt: combinedDateTime,
          durationMinutes,
          interviewType,
          meetingLink: meetingLink.trim(),
          panelistNames: panelistList,
          sendWhatsApp,
          sendEmail,
          instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule interview.");
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule interview.");
    } finally {
      setScheduling(false);
    }
  };

  // Display Round Text Helper
  const getRoundLabel = (val: string) => {
    switch (val) {
      case "TECHNICAL_ROUND":
        return "Round 2 Technical Interview";
      case "LEADERSHIP_SYSTEMS":
        return "Leadership / System Design";
      case "HR_CULTURE_FIT":
        return "Culture Fit & HR Screening";
      case "CLIENT_FINAL_ROUND":
        return "Client Final Round";
      default:
        return "Interview Round";
    }
  };

  // Competency tags to probe
  const probeTags =
    competencies.length > 0
      ? competencies.slice(0, 4)
      : candidate.skills && candidate.skills.length > 0
      ? candidate.skills.slice(0, 4)
      : ["System Architecture", "Technical Problem Solving", "Culture Alignment"];

  return (
    <>
      {/* Dimmed Click-Shield Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onBack || onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer */}
      <div
        aria-labelledby="drawer-title"
        aria-modal={true}
        role="dialog"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-screen animate-in slide-in-from-right duration-200 font-sans text-xs"
      >
      {/* 1. Top Navigation & Context Bar */}
      <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack || onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Candidate Dossier</span>
          </button>
          <span className="text-slate-300">|</span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{candidate.fullName}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{getRoundLabel(interviewType)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            Esc
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Drawer Title & Identity Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="drawer-title" className="text-lg font-bold text-slate-900 tracking-tight">
              Schedule Interview & Dispatch
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Role: <strong className="text-slate-700 font-semibold">{mandateTitle || "Engineering Role"}</strong>
              {clientName && (
                <>
                  {" "}at <span className="text-slate-800 font-medium">{clientName}</span>
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Timezone: IST (UTC+5:30)</span>
            </span>
          </div>
        </div>

        {/* Workflow Navigation Tabs */}
        <div className="mt-4 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`pb-2.5 px-3 border-b-2 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "calendar"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                activeTab === "calendar" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              1
            </span>
            Calendar & Panelist Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`pb-2.5 px-3 border-b-2 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "preview"
                ? "border-slate-900 text-slate-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                activeTab === "preview" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            Multi-Channel Message Preview
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
              WhatsApp + Email
            </span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Drawer Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {activeTab === "calendar" ? (
          <>
            {/* Section 1: Round Configuration & Duration */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interview Stage & Duration *
                </label>
                <span className="text-[11px] text-slate-400">RC-04 Automated Pipeline</span>
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-slate-800 focus:bg-white focus:border-slate-900 focus:ring-0 cursor-pointer"
                  >
                    <option value="TECHNICAL_ROUND">Technical Round (Live Coding & Architecture)</option>
                    <option value="LEADERSHIP_SYSTEMS">Leadership / System Design Evaluation</option>
                    <option value="HR_CULTURE_FIT">Culture Fit & HR Screening</option>
                    <option value="CLIENT_FINAL_ROUND">Client Final Decision Round</option>
                  </select>
                </div>
                <div className="col-span-4 flex items-center gap-1.5">
                  {[45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`flex-1 py-2 text-center text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        durationMinutes === mins
                          ? "border-2 border-slate-900 bg-slate-900 text-white shadow-2xs"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 2: Smart Availability & Slot Picker */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Date & Time Slot Selection *
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Timezone: <strong className="text-slate-800 font-semibold">IST (UTC+5:30)</strong>
                </span>
              </div>

              {/* 3-Option Cohesive Slot Picker */}
              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-500 font-medium">
                  Select a pre-configured quick slot or specify a custom interview time:
                </p>

                <div className="space-y-2">
                  {/* Option 0: Tomorrow Slot */}
                  <label
                    onClick={() => {
                      setSelectedSlotIndex(0);
                      setDateValue(tomorrowSlot.dateStr);
                      setTimeValue(tomorrowSlot.timeStr);
                    }}
                    className={`relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedSlotIndex === 0
                        ? "border-2 border-slate-900 bg-slate-50/90 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="slotOption"
                        checked={selectedSlotIndex === 0}
                        onChange={() => {}}
                        className="text-slate-900 focus:ring-0 border-slate-400"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{tomorrowSlot.display}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Standard 60-min afternoon slot</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Quick Slot
                    </span>
                  </label>

                  {/* Option 1: Day After Slot */}
                  <label
                    onClick={() => {
                      setSelectedSlotIndex(1);
                      setDateValue(dayAfterSlot.dateStr);
                      setTimeValue(dayAfterSlot.timeStr);
                    }}
                    className={`relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedSlotIndex === 1
                        ? "border-2 border-slate-900 bg-slate-50/90 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="slotOption"
                        checked={selectedSlotIndex === 1}
                        onChange={() => {}}
                        className="text-slate-900 focus:ring-0 border-slate-300"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{dayAfterSlot.display}</span>
                        <span className="text-[11px] text-slate-500 font-medium">Standard 60-min morning slot</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Quick Slot
                    </span>
                  </label>

                  {/* Option 2: Custom Date & Time Slot */}
                  <div
                    onClick={() => {
                      if (selectedSlotIndex !== 2) {
                        setSelectedSlotIndex(2);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedSlotIndex === 2
                        ? "border-2 border-slate-900 bg-slate-50/60 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer mb-2.5">
                      <input
                        type="radio"
                        name="slotOption"
                        checked={selectedSlotIndex === 2}
                        onChange={() => setSelectedSlotIndex(2)}
                        className="text-slate-900 focus:ring-0 border-slate-400"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900">Custom Date & Time</span>
                        <span className="text-[11px] text-slate-500 block">Pick any specific date and start time in IST</span>
                      </div>
                    </label>

                    <div className="grid grid-cols-3 gap-2.5 pl-6 pt-1">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Date</span>
                        <input
                          type="date"
                          required
                          value={dateValue}
                          onFocus={() => setSelectedSlotIndex(2)}
                          onChange={(e) => {
                            setDateValue(e.target.value);
                            setSelectedSlotIndex(2);
                          }}
                          className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-slate-900 focus:ring-0"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Start Time (IST)</span>
                        <input
                          type="time"
                          required
                          value={timeValue}
                          onFocus={() => setSelectedSlotIndex(2)}
                          onChange={(e) => {
                            setTimeValue(e.target.value);
                            setSelectedSlotIndex(2);
                          }}
                          className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-slate-900 focus:ring-0"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Duration</span>
                        <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700">
                          {durationMinutes} Minutes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Video Meeting Platform */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Video Meeting Platform *
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Instant Room Generator
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPlatform("meet")}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        platform === "meet" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Google Meet
                    </button>
                    <span className="text-slate-300">/</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPlatform("zoom")}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        platform === "zoom" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Zoom
                    </button>
                    <span className="text-slate-300">/</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPlatform("custom")}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        platform === "custom" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Custom Link
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateLink}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
                  >
                    Regenerate Link
                  </button>
                </div>
                <div className="mt-2.5 flex items-center justify-between bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-800 flex-1 truncate mr-2">
                    <Video className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    {platform === "custom" ? (
                      <input
                        type="url"
                        required
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white border border-slate-300 px-2 py-0.5 rounded text-xs font-mono text-slate-900"
                      />
                    ) : (
                      <span className="truncate">{meetingLink}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Section 4: Interviewers / Panelists Chips */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interviewers / Panelists ({panelistList.length} Listed) *
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  For Candidate Prep Brief
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Panelist names and roles are included in the candidate's WhatsApp prep brief and email invite.
              </p>
              <div className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {panelistList.map((panelist, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-800 font-medium"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center">
                        {panelist.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{panelist}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePanelist(idx)}
                        className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                        title="Remove panelist"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {/* Add panelist input */}
                  <div className="flex items-center gap-1 min-w-[180px]">
                    <input
                      type="text"
                      value={newPanelistInput}
                      onChange={(e) => setNewPanelistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPanelist();
                        }
                      }}
                      placeholder="+ Add Panelist name/role..."
                      className="w-full text-xs border-0 p-1 text-slate-800 placeholder-slate-400 focus:ring-0 bg-transparent"
                    />
                    {newPanelistInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddPanelist}
                        className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded cursor-pointer"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Focus Competencies To Probe */}
            <section className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Scorecard Reminder: Probe Areas Tagged for {getRoundLabel(interviewType)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Attached to Panelist Brief
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {probeTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded flex items-center gap-1 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Section 6: Candidate Automated Dispatch Logistics */}
            <section className="space-y-3.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Candidate Automated Dispatch Logistics
                </label>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {[sendWhatsApp, sendEmail].filter(Boolean).length} Channels Active
                </span>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {/* WhatsApp toggle */}
                <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="rounded text-slate-900 border-slate-300 focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp Candidate Briefing & Guidance
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Instant prep sent to: <strong className="font-mono text-slate-700">{candidate.phone || "Candidate Phone"}</strong>
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    High Response
                  </span>
                </label>

                {/* Calendar Email toggle */}
                <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="rounded text-slate-900 border-slate-300 focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        Candidate Calendar Email Invite (.ics attachment)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Delivered directly to: <strong className="font-mono text-slate-700">{candidate.email}</strong>
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </label>
              </div>
            </section>
          </>
        ) : (
          /* Multi-Channel Preview Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Dispatch Preview
              </span>
              <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewChannel("whatsapp")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                    previewChannel === "whatsapp"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  WhatsApp Bubble
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel("email")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                    previewChannel === "email"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Calendar Email
                </button>
              </div>
            </div>

            {previewChannel === "whatsapp" ? (
              /* Realistic WhatsApp Chat Preview Card */
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                <div className="max-w-md bg-white rounded-xl p-4 shadow-xs border border-slate-200/90 relative space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {clientName || "RecruitOS Hiring Desk"} (WhatsApp Official)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">14:02</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    👋 Hi <strong>{candidate.fullName}</strong>, your <strong>{getRoundLabel(interviewType)}</strong> for{" "}
                    <strong>{mandateTitle || "Engineering Position"}</strong> has been scheduled for{" "}
                    <strong>
                      {dateValue ? new Date(`${dateValue}T${timeValue}`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Upcoming Date"}{" "}
                      at {timeValue || "03:00 PM"} IST
                    </strong>.
                  </p>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Meeting Link</span>
                    <span className="text-slate-900 underline font-mono text-[11px] block truncate">
                      {meetingLink}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Panelists: {panelistList.join(", ") || "Tech Panel"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Prep Guidance: {instructions}
                  </p>
                  <div className="mt-2 flex gap-1.5 pt-1">
                    <div className="flex-1 py-1.5 text-center bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-md">
                      ✓ Confirm Attendance
                    </div>
                    <div className="py-1.5 px-3 text-center bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium rounded-md">
                      Request Alternate Slot
                    </div>
                  </div>
                  <div className="text-right pt-1">
                    <span className="text-[9px] text-slate-400">
                      Sent via Automated Dispatch • Verified Delivery
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Calendar Email Preview */
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 pb-2.5">
                    <div className="text-[11px] text-slate-500">
                      To: <strong className="text-slate-800">{candidate.email}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Subject:{" "}
                      <strong className="text-slate-900">
                        Interview Invitation: {getRoundLabel(interviewType)} — {mandateTitle || "Role"}
                      </strong>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <p>Dear {candidate.fullName},</p>
                    <p>
                      You are invited to the {getRoundLabel(interviewType)} for {mandateTitle} at {clientName || "the client org"}.
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div><strong>Date & Time:</strong> {dateValue} at {timeValue} IST ({durationMinutes} mins)</div>
                      <div><strong>Meeting Link:</strong> <span className="font-mono text-slate-900 underline">{meetingLink}</span></div>
                      <div><strong>Panelists:</strong> {panelistList.join(", ")}</div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Calendar invite (.ics) has been attached to automatically sync with your Google / Outlook calendar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Sticky Drawer Footer */}
        <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack || onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            {activeTab === "calendar" ? (
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Preview Dispatch
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("calendar")}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Edit Setup
              </button>
            )}

            <button
              type="submit"
              disabled={scheduling}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {scheduling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  <span>Locking Slot & Dispatching...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-slate-300" />
                  <span>Send Invites & Confirm Schedule</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
    </>
  );
}

export default ScheduleInterviewModal;
