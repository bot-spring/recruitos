"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Zap,
  Briefcase,
  Users,
  Bell,
  ChevronDown,
  LogOut,
  Volume2,
  VolumeX,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { UserSandboxToggle } from "@/components/UserSandboxToggle";

export type CockpitTab = "dashboard" | "pipeline" | "mandates" | "candidates";

interface NotificationItem {
  id: string;
  type: "DECISION_SHORTLIST" | "DECISION_REJECT" | "SLOT_CONFIRMED" | "AUDIT" | "INFO";
  title: string;
  message: string;
  timestamp: string;
  scheduledAt?: string;
  read: boolean;
}

interface CockpitHeaderProps {
  activeTab: CockpitTab;
  onTabChange?: (tab: "dashboard" | "pipeline" | "mandates") => void;
  inboundCount?: number;
  pipelineAlertCount?: number;
  isBreachedAlert?: boolean;
}

// Gentle dual-tone Web Audio synthesizer chime (zero MP3 dependencies)
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5) - soft warm chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5) - bell harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.06, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.debug("Audio chime skipped:", err);
  }
}

// Formats notification timestamp with full date context
function formatNotificationDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const timePart = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) {
      return `Today, ${timePart}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timePart}`;
    }

    const datePart = d.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${datePart}, ${timePart}`;
  } catch {
    return isoString;
  }
}

// Formats scheduled interview date/time in user's local timezone
function formatScheduledLocalTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timePart = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${datePart} at ${timePart}`;
  } catch {
    return isoString;
  }
}

export function CockpitHeader({
  activeTab,
  onTabChange,
  inboundCount = 0,
  pipelineAlertCount = 0,
  isBreachedAlert = false,
}: CockpitHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedBefore, setClearedBefore] = useState<number>(0);

  const prevUnreadRef = useRef<number>(0);
  const isInitialFetchRef = useRef<boolean>(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMuted = localStorage.getItem("recruitos_notif_muted") === "true";
      setIsMuted(savedMuted);

      try {
        const savedRead = JSON.parse(localStorage.getItem("recruitos_read_notifications") || "[]");
        if (Array.isArray(savedRead)) setReadIds(savedRead);
      } catch (e) {}

      const savedCleared = parseInt(localStorage.getItem("recruitos_notif_cleared_at") || "0", 10);
      if (savedCleared) setClearedBefore(savedCleared);
    }
  }, []);

  // Fetch and reconcile notifications with local read/cleared state
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const rawList: NotificationItem[] = data.notifications || [];

        // Read latest stored cleared timestamp
        const currentCleared = typeof window !== "undefined"
          ? parseInt(localStorage.getItem("recruitos_notif_cleared_at") || "0", 10)
          : 0;

        // Read latest stored read IDs
        const currentReadIds: string[] = typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("recruitos_read_notifications") || "[]")
          : [];

        // Filter out cleared items
        const visible = rawList.filter((n) => {
          const itemTime = new Date(n.timestamp).getTime();
          return itemTime > currentCleared;
        });

        // Reconcile read state
        const reconciled = visible.map((n) => ({
          ...n,
          read: n.read || currentReadIds.includes(n.id),
        }));

        const unread = reconciled.filter((n) => !n.read).length;

        // Chime trigger on new unread notifications arriving
        if (!isInitialFetchRef.current && unread > prevUnreadRef.current) {
          const currentMuted = typeof window !== "undefined" && localStorage.getItem("recruitos_notif_muted") === "true";
          if (!currentMuted) {
            playNotificationChime();
          }
        }

        isInitialFetchRef.current = false;
        prevUnreadRef.current = unread;
        setNotifications(reconciled);
        setUnreadNotifCount(unread);
      }
    } catch (err) {
      console.error("Failed to load header notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (typeof window !== "undefined") {
      localStorage.setItem("recruitos_notif_muted", String(nextMuted));
    }
    if (!nextMuted) {
      playNotificationChime();
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("recruitos_read_notifications", JSON.stringify(updated));
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifCount(0);
    prevUnreadRef.current = 0;
  };

  const handleClearAll = () => {
    const now = Date.now();
    setClearedBefore(now);
    if (typeof window !== "undefined") {
      localStorage.setItem("recruitos_notif_cleared_at", String(now));
    }
    setNotifications([]);
    setUnreadNotifCount(0);
    prevUnreadRef.current = 0;
  };

  const handleItemClick = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("recruitos_read_notifications", JSON.stringify(updated));
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
    }
  };

  const handleTabClick = (tab: "dashboard" | "pipeline" | "mandates") => {
    if (onTabChange) {
      onTabChange(tab);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState({}, "", url.toString());
      }
    } else {
      router.push(`/cockpit?tab=${tab}`);
    }
  };

  const initials = (session?.user?.name || "AS")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link href="/cockpit" className="flex items-center space-x-3 cursor-pointer">
              <div className="h-9 w-9 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-extrabold text-slate-800 text-base shadow-sm">
                R
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight">RecruitOS</span>
                  <span className="bg-brand-surfaceLight text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-brand-surface uppercase tracking-wide">
                    {session?.user?.agencyName || "Agency Cockpit"}
                  </span>
                </div>
              </div>
            </Link>

            {/* SOLO OWNER MICRO-NAV NAVIGATION */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleTabClick("dashboard")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-white text-slate-900 shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Macro Conversion Radar & Drop-off Diagnostics"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-slate-700" />
                <span>📊 Radar</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("pipeline")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer relative ${
                  activeTab === "pipeline"
                    ? "bg-white text-slate-900 shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Daily Lineup & 3-Column Tactical SLA Kanban"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>⚡ Pipeline</span>
                {pipelineAlertCount > 0 && (
                  <span
                    className={`ml-1 text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      isBreachedAlert ? "bg-rose-500 text-white" : "bg-[#fce17c] text-slate-900"
                    }`}
                  >
                    {isBreachedAlert ? `!${pipelineAlertCount}` : pipelineAlertCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("mandates")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "mandates"
                    ? "bg-white text-slate-900 shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Mandates & SLA Radar"
              >
                <Briefcase className="h-3.5 w-3.5 text-slate-700" />
                <span>💼 Mandates</span>
                {inboundCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    {inboundCount}
                  </span>
                )}
              </button>

              <Link
                href="/cockpit/candidates"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "candidates"
                    ? "bg-white text-slate-900 shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
                title="Candidate Bank & Talent Pool"
              >
                <Users className="h-3.5 w-3.5 text-slate-700" />
                <span>👥 Talent Bank</span>
              </Link>
            </nav>
          </div>

          {/* Right-Side Tools & Profile */}
          <div className="flex items-center space-x-3">
            <UserSandboxToggle />

            {/* Activity Bell Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Recruiter Activity & Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-slate-700" />
                      <span className="text-xs font-black text-slate-900">Activity & Alerts</span>
                      {unreadNotifCount > 0 && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-rose-200">
                          {unreadNotifCount} new
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Audio Mute/Chime Toggle */}
                      <button
                        type="button"
                        onClick={toggleSound}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer text-[10px] font-bold flex items-center space-x-1 ${
                          isMuted
                            ? "text-slate-500 hover:text-slate-700 bg-slate-200/60"
                            : "text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200"
                        }`}
                        title={isMuted ? "Audio alerts are muted (Click to enable chime)" : "Audio alerts enabled (Click to mute)"}
                      >
                        {isMuted ? <VolumeX className="h-3 w-3 text-slate-500" /> : <Volume2 className="h-3 w-3 text-emerald-600" />}
                        <span>{isMuted ? "Muted" : "Chime"}</span>
                      </button>

                      {/* Mark all as read */}
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-1.5 py-0.5 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                          title="Mark all notifications as read"
                        >
                          <CheckCheck className="h-3 w-3 text-slate-500" />
                          <span>Read</span>
                        </button>
                      )}

                      {/* Clear All */}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 px-1.5 py-0.5 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          title="Clear all visible notifications"
                        >
                          <Trash2 className="h-3 w-3 text-rose-500" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-84 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                        <Bell className="h-6 w-6 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">No active notifications</p>
                        <p className="text-[11px] text-slate-400">Activity and candidate updates will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleItemClick(n.id)}
                          className={`p-3 transition-colors cursor-pointer ${
                            n.read
                              ? "bg-white hover:bg-slate-50 opacity-80"
                              : "bg-blue-50/40 hover:bg-blue-50/70 border-l-2 border-blue-500"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-1.5">
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" title="Unread" />
                              )}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  n.type === "DECISION_SHORTLIST"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : n.type === "DECISION_REJECT"
                                    ? "bg-rose-100 text-rose-800"
                                    : n.type === "SLOT_CONFIRMED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {n.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 shrink-0">
                              {formatNotificationDate(n.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1.5 font-medium leading-snug">
                            {n.scheduledAt
                              ? `${n.message.replace(/scheduled for.*$/i, "scheduled for")} ${formatScheduledLocalTime(n.scheduledAt)}.`
                              : n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center space-x-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Account Profile"
              >
                <div className="h-8 w-8 rounded-full bg-slate-900 text-brand-surface font-black text-xs flex items-center justify-center border border-slate-700 shadow-xs">
                  {initials}
                </div>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{session?.user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{session?.user?.email}</p>
                    <div className="mt-1.5 flex items-center space-x-1">
                      <span className="text-[9px] bg-brand-surfaceLight text-slate-800 font-extrabold px-1.5 py-0.2 rounded border border-brand-surface uppercase">
                        {userRole}
                      </span>
                      <span className="text-[9px] text-slate-400 truncate">
                        {session?.user?.agencyName || "RecruitOS"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center space-x-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CockpitHeader;
