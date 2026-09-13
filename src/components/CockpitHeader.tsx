"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { UserSandboxToggle } from "@/components/UserSandboxToggle";

export type CockpitTab = "dashboard" | "pipeline" | "mandates" | "candidates";

interface NotificationItem {
  id: string;
  type: "DECISION_SHORTLIST" | "DECISION_REJECT" | "SLOT_CONFIRMED" | "AUDIT" | "INFO";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface CockpitHeaderProps {
  activeTab: CockpitTab;
  onTabChange?: (tab: "dashboard" | "pipeline" | "mandates") => void;
  inboundCount?: number;
  pipelineAlertCount?: number;
  isBreachedAlert?: boolean;
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

  // Fetch real-time recruiter notifications feed
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load header notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
                  if (!isNotifOpen) setUnreadNotifCount(0);
                }}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Recruiter Activity & Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-slate-700" />
                      <span className="text-xs font-black text-slate-900">Activity & Alerts</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Real-time Feed</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No recent activity or notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between">
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
                            <span className="text-[9px] text-slate-400">
                              {new Date(n.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 font-medium leading-snug">
                            {n.message}
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
