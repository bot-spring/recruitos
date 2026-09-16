"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Loader2 } from "lucide-react";

export interface ScheduleCandidateTarget {
  id?: string;
  candidateId?: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: ScheduleCandidateTarget | null;
  submissionId: string | null;
  mandateTitle: string;
  onSuccess?: (interviewData: any) => void;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  candidate,
  submissionId,
  mandateTitle,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: "",
    durationMinutes: 60,
    interviewType: "TECHNICAL_ROUND",
    meetingLink: "https://meet.google.com/xyz-rec-live",
    panelistNames: "Tech Lead, Engineering Director",
    sendWhatsApp: true,
    sendEmail: true,
    instructions: "Please test camera/mic and join 5 minutes prior.",
  });

  useEffect(() => {
    if (isOpen && candidate) {
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
      setError(null);
    }
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionId) {
      setError("Cannot schedule interview: candidate has no active mandate submission.");
      return;
    }

    setScheduling(true);
    setError(null);

    try {
      const res = await fetch("/api/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          scheduledAt: scheduleForm.scheduledAt,
          durationMinutes: scheduleForm.durationMinutes,
          interviewType: scheduleForm.interviewType,
          meetingLink: scheduleForm.meetingLink,
          panelistNames: scheduleForm.panelistNames
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          sendWhatsApp: scheduleForm.sendWhatsApp,
          sendEmail: scheduleForm.sendEmail,
          instructions: scheduleForm.instructions,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-700" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Schedule Interview & Multi-Channel Dispatch (RC-04)
              </h3>
              <p className="text-[10px] text-purple-800">
                Candidate: <strong>{candidate.fullName}</strong> • {mandateTitle || "Mandate Interview"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(e.target.value, 10) || 60 })
                }
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
                📱 <strong>WhatsApp Candidate Briefing</strong> to {candidate.phone || "Candidate Phone"} (Instant Prep Guidance)
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
                ✉️ <strong>Calendar Email Invite</strong> to {candidate.email}
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduling}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            >
              {scheduling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Locking Slot & Dispatching...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>Confirm & Dispatch Logistics</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScheduleInterviewModal;
