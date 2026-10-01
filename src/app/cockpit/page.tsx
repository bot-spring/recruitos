"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  LogOut,
  Sparkles,
  Inbox,
  Flame,
  Search,
  Check,
  UserCheck,
  DollarSign,
  Send,
  SlidersHorizontal,
  Share2,
  Globe2,
  Copy,
  ExternalLink,
  Radio,
  Zap,
  Award,
  BarChart3,
  LayoutDashboard,
  Filter,
  Eye,
  X,
  Calendar,
  ChevronRight,
  Shield,
  FileText,
  Mail,
  Phone,
  UserPlus,
  TrendingUp,
  Upload,
  Loader2,
  Target,
  Bell,
  AlertTriangle,
  Video,
  ChevronDown,
  MapPin,
  MoreVertical,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { UserSandboxToggle, UserSandboxBanner } from "@/components/UserSandboxToggle";
import { CockpitHeader } from "@/components/CockpitHeader";

interface InboundMandate {
  id: string;
  title: string;
  department: string | null;
  openings: number;
  minExp: number;
  maxExp: number;
  minCtc: number | null;
  maxCtc: number | null;
  currency: string;
  location: string | null;
  workMode: string;
  skills: string[];
  description: string | null;
  priority: string;
  maxNoticeDays: number | null;
  feePercentage: number;
  guaranteeDays: number;
  createdAt: string;
  client: {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
    status: string;
  };
  contact: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    designation: string | null;
  } | null;
}

interface ActiveMandate {
  id: string;
  title: string;
  department: string | null;
  openings: number;
  minExp: number;
  maxExp: number;
  minCtc: number | null;
  maxCtc: number | null;
  currency: string;
  location: string | null;
  workMode: string;
  skills: string[];
  description: string | null;
  specialInstructions: string | null;
  priority: string;
  feePercentage: number;
  guaranteeDays: number;
  status: string;
  slaTargetHours: number;
  hoursInStage: number;
  calculatedSlaStatus: "HEALTHY" | "WARNING" | "BREACHED";
  slaStageType?: "SOURCING" | "CLIENT_REVIEW";
  hasShortlistSubmitted?: boolean;
  createdAt: string;
  client: {
    id: string;
    name: string;
    website?: string | null;
    industry: string | null;
    status: string;
  };
  contact?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    designation: string | null;
  } | null;
  assignedRecruiter: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    submissions: number;
  };
}

interface RecruiterUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MatchingSilverCandidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentCompany: string | null;
  currentTitle: string | null;
  totalExpYears: number;
  noticePeriodDays: number;
  expectedCtc: number | null;
  currency: string;
  skills: string[];
  silverMedalistReason: string | null;
  matchedSkills: string[];
  matchScore: number;
}

interface PipelineInterview {
  id: string;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    currentTitle: string | null;
    currentCompany: string | null;
  };
  mandate: {
    id: string;
    title: string;
    client: { id: string; name: string };
  };
  submission: {
    id: string;
    stage: string;
    clientDecision: string;
  };
  scheduledAt: string;
  durationMinutes: number;
  interviewType: string;
  status: string;
  meetingLink: string | null;
  location: string | null;
  panelistNames: string[];
}

interface PipelineCandidate {
  id: string;
  stage: string;
  createdAt: string;
  submittedToClientAt?: string | null;
  clientDecision?: string;
  hoursWaiting?: number;
  slaStatus?: "HEALTHY" | "WARNING" | "BREACHED";
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    currentTitle: string | null;
    currentCompany: string | null;
    totalExpYears: number;
    expectedCtc: number | null;
    currency: string;
    noticePeriodDays: number;
    skills: string[];
  };
  mandate: {
    id: string;
    title: string;
    client: { id: string; name: string };
  };
  interviews?: Array<{
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    interviewType: string;
    status: string;
    meetingLink: string | null;
  }>;
}

interface NotificationItem {
  id: string;
  type: "DECISION_SHORTLIST" | "DECISION_REJECT" | "SLOT_CONFIRMED" | "AUDIT" | "INFO";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface FunnelMetrics {
  ingested: number;
  shortlisted: number;
  sharedWithCompany: number;
  selectedForInterview: number;
  interviewsDone: number;
  selected: number;
  offered: number;
  joined: number;
  conversionRate: number;
}

interface MandateFunnelRecord {
  id: string;
  title: string;
  department: string | null;
  openings: number;
  minExp: number;
  maxExp: number;
  minCtc: number | null;
  maxCtc: number | null;
  currency: string;
  location: string | null;
  workMode: string;
  skills: string[];
  description: string | null;
  specialInstructions: string | null;
  priority: string;
  feePercentage: number;
  guaranteeDays: number;
  status: string;
  slaTargetHours: number;
  slaStartedAt: string | null;
  slaStatus: "HEALTHY" | "WARNING" | "BREACHED";
  createdAt: string;
  client: {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
    location: string | null;
  };
  contact: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    designation: string | null;
  } | null;
  assignedRecruiter: {
    id: string;
    name: string;
    email: string;
  } | null;
  funnel: FunnelMetrics;
  candidates: Array<{
    submissionId: string;
    candidateId: string;
    fullName: string;
    email: string;
    phone: string;
    currentCompany: string | null;
    currentTitle: string | null;
    totalExpYears: number;
    expectedCtc: number | null;
    noticePeriodDays: number;
    stage: string;
    clientDecision: string | null;
    offeredCtc: number | null;
    actualJoiningDate: string | null;
    counterOfferRiskLevel: string | null;
    isSilverMedalist: boolean;
    createdAt: string;
  }>;
}

interface NoticePeriodCandidate {
  id: string;
  stage: string;
  updatedAt: string;
  daysInNotice: number;
  daysSinceAccepted: number;
  daysRemaining: number;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    currentTitle: string | null;
    currentCompany: string | null;
    expectedCtc: number | null;
    currency: string;
    noticePeriodDays: number;
  };
  mandate: {
    id: string;
    title: string;
    client: { id: string; name: string };
  };
}

function getInitials(name: string) {
  if (!name) return "CA";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRelativeTime(dateString: string) {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - d.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  } catch {
    return "";
  }
}

export default function CockpitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isManagement = userRole === "AGENCY_OWNER" || userRole === "TEAM_LEAD";

  // Active Mandate Kebab Menu State
  const [activeMenuMandateId, setActiveMenuMandateId] = useState<string | null>(null);

  useEffect(() => {
    const handleDocClick = () => setActiveMenuMandateId(null);
    if (activeMenuMandateId) {
      document.addEventListener("click", handleDocClick);
      return () => document.removeEventListener("click", handleDocClick);
    }
  }, [activeMenuMandateId]);

  // Navigation State (Solo Owner Micro-Nav Architecture)
  const [currentTab, setCurrentTab] = useState<"dashboard" | "pipeline" | "mandates">("dashboard");

  // Command Center 3-Day Interview Window Filter: 'today' | 'tomorrow' | 'yesterday'
  const [interviewWindow, setInterviewWindow] = useState<"today" | "tomorrow" | "yesterday">("today");

  // Pipeline State (⚡ Command Center)
  const [pipelineData, setPipelineData] = useState<{
    interviewsToday: PipelineInterview[];
    interviewsYesterday?: PipelineInterview[];
    interviewsTomorrow?: PipelineInterview[];
    chasesDue?: PipelineCandidate[];
    noticePeriodWatch?: NoticePeriodCandidate[];
    columns: {
      screened: PipelineCandidate[];
      submitted: PipelineCandidate[];
      interviewing: PipelineCandidate[];
    };
    stats: {
      totalScreened: number;
      totalSubmitted: number;
      totalInterviewing: number;
      totalInterviewsToday: number;
      totalInterviewsYesterday?: number;
      totalInterviewsTomorrow?: number;
      slaComplianceRate: number;
      breachedCount: number;
      warningCount: number;
      noticePeriodCount?: number;
    };
  } | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [selectedPipelineMandateId, setSelectedPipelineMandateId] = useState<string>("all");
  const [copiedInterviewId, setCopiedInterviewId] = useState<string | null>(null);

  // Meeting Link Modal State (Scenario B)
  const [meetingLinkModal, setMeetingLinkModal] = useState<{
    isOpen: boolean;
    interviewId: string;
    candidateName: string;
    mandateTitle: string;
    currentLink: string;
  }>({
    isOpen: false,
    interviewId: "",
    candidateName: "",
    mandateTitle: "",
    currentLink: "",
  });
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [savingMeetingLink, setSavingMeetingLink] = useState(false);

  // Notifications State (Activity Bell)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 1-Click Chase Client State
  const [chasingMandateId, setChasingMandateId] = useState<string | null>(null);
  const [chaseSuccessMessage, setChaseSuccessMessage] = useState<string | null>(null);

  // Funnel Analytics State (Tab 1: Dashboard)
  const [macroFunnel, setMacroFunnel] = useState<FunnelMetrics | null>(null);
  const [mandateFunnels, setMandateFunnels] = useState<MandateFunnelRecord[]>([]);
  const [loadingFunnel, setLoadingFunnel] = useState(true);
  const [funnelSearchQuery, setFunnelSearchQuery] = useState("");

  // Mandates List State (Tab 2: Mandates & SLA Radar)
  const [activeMandates, setActiveMandates] = useState<ActiveMandate[]>([]);
  const [closedMandates, setClosedMandates] = useState<ActiveMandate[]>([]);
  const [mandateViewMode, setMandateViewMode] = useState<"active" | "closed">("active");
  const [inboundMandates, setInboundMandates] = useState<InboundMandate[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mandate Lifecycle Actions (Close & Delete Modals)
  const [mandateToClose, setMandateToClose] = useState<ActiveMandate | null>(null);
  const [closeMandateStatus, setCloseMandateStatus] = useState<"CLOSED_FULFILLED" | "CLOSED_CANCELLED" | "CLOSED_ON_HOLD">("CLOSED_FULFILLED");
  const [closeMandateReason, setCloseMandateReason] = useState("");
  const [recycleFinalists, setRecycleFinalists] = useState(true);
  const [closingMandate, setClosingMandate] = useState(false);
  const [mandateToDelete, setMandateToDelete] = useState<ActiveMandate | null>(null);
  const [deletingMandate, setDeletingMandate] = useState(false);

  // Command Center Dismissals
  const [dismissedChaseIds, setDismissedChaseIds] = useState<string[]>([]);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);

  // Approval Modal State
  const [selectedInbound, setSelectedInbound] = useState<InboundMandate | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    assignedRecruiterId: "",
    feePercentage: 8.33,
    guaranteeDays: 90,
    slaTargetHours: 72,
  });

  // Offline BD Mandate Creation Modal State
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [creatingOffline, setCreatingOffline] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [offlineForm, setOfflineForm] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    title: "",
    department: "",
    openings: 1,
    minExp: 2,
    maxExp: 6,
    minCtc: "",
    maxCtc: "",
    currency: "INR",
    location: "",
    workMode: "HYBRID",
    skills: "",
    description: "",
    priority: "MEDIUM",
    feePercentage: 8.33,
    guaranteeDays: 90,
    slaTargetHours: 72,
    assignedRecruiterId: "",
  });

  // AI JD Auto-Fill State
  const [jdRawInput, setJdRawInput] = useState("");
  const [isParsingJd, setIsParsingJd] = useState(false);
  const [jdParseSuccess, setJdParseSuccess] = useState<string | null>(null);
  const [jdParseError, setJdParseError] = useState<string | null>(null);

  // Broadcast & Partner Share Modal State (RC-08, PO-01)
  const [distributionMandate, setDistributionMandate] = useState<ActiveMandate | MandateFunnelRecord | null>(null);
  const [activeDistTab, setActiveDistTab] = useState<"BROADCAST" | "PARTNER">("BROADCAST");
  const [broadcasts, setBroadcasts] = useState<Record<string, string>>({});
  const [partnerForm, setPartnerForm] = useState({
    maskedClientTitle: "",
    splitFeePercentage: 50,
    shareToken: "",
    isActive: true,
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [updatingPartner, setUpdatingPartner] = useState(false);

  // Client Presenter Submission Modal State (CL-01, CL-02)
  const [clientSubmitMandate, setClientSubmitMandate] = useState<ActiveMandate | MandateFunnelRecord | null>(null);
  const [agencyCandidates, setAgencyCandidates] = useState<any[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [generatedPortalUrl, setGeneratedPortalUrl] = useState<string | null>(null);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);

  // Silver Medalist Matching Drawer State (RC-07)
  const [silverMatchMandate, setSilverMatchMandate] = useState<ActiveMandate | MandateFunnelRecord | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<MatchingSilverCandidate[]>([]);
  const [loadingSilverMatches, setLoadingSilverMatches] = useState(false);
  const [redeployingId, setRedeployingId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch Funnel Analytics (Tab 1)
  const fetchFunnelData = async () => {
    try {
      setLoadingFunnel(true);
      const res = await fetch("/api/dashboard/funnel");
      if (res.ok) {
        const data = await res.json();
        setMacroFunnel(data.macroFunnel);
        setMandateFunnels(data.mandateFunnels || []);
      }
    } catch (err) {
      console.error("Failed to load funnel analytics:", err);
    } finally {
      setLoadingFunnel(false);
    }
  };

  // Fetch Mandates & SLA Radar (Tab 2)
  const fetchMandatesData = async () => {
    try {
      setLoading(true);
      const [mandatesRes, closedRes] = await Promise.all([
        fetch(`/api/mandates?scope=${scopeFilter}&status=active`),
        fetch(`/api/mandates?scope=${scopeFilter}&status=closed`),
      ]);

      if (mandatesRes.ok) {
        const data = await mandatesRes.json();
        setActiveMandates(data.mandates || []);
      }
      if (closedRes.ok) {
        const closedData = await closedRes.json();
        setClosedMandates(closedData.mandates || []);
      }

      if (isManagement) {
        const inboundRes = await fetch("/api/mandates/inbound");
        if (inboundRes.ok) {
          const inData = await inboundRes.json();
          setInboundMandates(inData.inboundMandates || []);
        }

        const teamRes = await fetch("/api/team/recruiters");
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setRecruiters(teamData.recruiters || []);
          if (teamData.recruiters?.length > 0 && !approvalForm.assignedRecruiterId) {
            setApprovalForm((prev) => ({ ...prev, assignedRecruiterId: teamData.recruiters[0].id }));
            setOfflineForm((prev) => ({ ...prev, assignedRecruiterId: teamData.recruiters[0].id }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load cockpit data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pipeline Data (⚡ Pipeline)
  const fetchPipelineData = async (mandateId?: string) => {
    setPipelineLoading(true);
    try {
      const url = mandateId && mandateId !== "all"
        ? `/api/pipeline?mandateId=${mandateId}`
        : "/api/pipeline";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPipelineData(data);
      }
    } catch (err) {
      console.error("Failed to load pipeline data:", err);
    } finally {
      setPipelineLoading(false);
    }
  };

  // Fetch Activity Notifications (Activity Bell)
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // 1-Click Client Chase (SLA Breach / 48h Reminder)
  const handleChaseClient = async (mandateId: string, candidateName?: string) => {
    setChasingMandateId(mandateId);
    try {
      const res = await fetch(`/api/mandates/${mandateId}/chase-client`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setChaseSuccessMessage(`1-Click SLA reminder sent to client${candidateName ? ` regarding ${candidateName}` : ""}!`);
        setTimeout(() => setChaseSuccessMessage(null), 5000);

        // Find matching submission IDs to persist dismissal to localStorage
        const chasedSubs = (pipelineData?.chasesDue || []).filter((c: any) => {
          if (c.mandate?.id === mandateId) {
            if (candidateName) return c.candidate?.fullName === candidateName;
            return true;
          }
          return false;
        });
        chasedSubs.forEach((s: any) => handleDismissChase(s.id));

        fetchPipelineData(selectedPipelineMandateId);
      } else {
        alert(data.error || "Failed to dispatch client reminder.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to dispatch client reminder.");
    } finally {
      setChasingMandateId(null);
    }
  };

  // Dismiss cards from Command Center (persisted across page reloads)
  const handleDismissChase = (submissionId: string) => {
    setDismissedChaseIds((prev) => {
      const next = Array.from(new Set([...prev, submissionId]));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("recruitos_dismissed_chases", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const handleDismissNotice = (submissionId: string) => {
    setDismissedNoticeIds((prev) => {
      const next = Array.from(new Set([...prev, submissionId]));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("recruitos_dismissed_notices", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Close / Retire Mandate
  const handleExecuteCloseMandate = async () => {
    if (!mandateToClose) return;
    setClosingMandate(true);
    try {
      const res = await fetch(`/api/mandates/${mandateToClose.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: closeMandateStatus,
          closeReason: closeMandateReason,
          recycleCandidates: recycleFinalists,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close mandate.");

      setSuccessMessage(data.message || "Mandate archived successfully.");
      setMandateToClose(null);
      fetchMandatesData();
    } catch (err: any) {
      alert(err.message || "Failed to close mandate.");
    } finally {
      setClosingMandate(false);
    }
  };

  // Re-open Mandate
  const handleReopenMandate = async (id: string) => {
    try {
      const res = await fetch(`/api/mandates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE_ASSIGNED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to re-open mandate.");

      setSuccessMessage("Mandate re-opened to Active Searches.");
      fetchMandatesData();
    } catch (err: any) {
      alert(err.message || "Failed to re-open mandate.");
    }
  };

  // Delete Mandate to MandateTrashBin
  const handleExecuteDeleteMandate = async () => {
    if (!mandateToDelete) return;
    setDeletingMandate(true);
    try {
      const res = await fetch(`/api/mandates/${mandateToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User deleted mandate from Cockpit Mandates tab" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete mandate.");

      setSuccessMessage("Mandate moved to Trash Bin.");
      setMandateToDelete(null);
      fetchMandatesData();
    } catch (err: any) {
      alert(err.message || "Failed to delete mandate.");
    } finally {
      setDeletingMandate(false);
    }
  };

  // Save Custom Meeting Link (Scenario B)
  const handleSaveMeetingLink = async () => {
    if (!meetingLinkModal.interviewId) return;
    setSavingMeetingLink(true);
    try {
      const res = await fetch(`/api/interviews/${meetingLinkModal.interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink: meetingLinkInput }),
      });
      if (res.ok) {
        setMeetingLinkModal({ isOpen: false, interviewId: "", candidateName: "", mandateTitle: "", currentLink: "" });
        setMeetingLinkInput("");
        fetchPipelineData(selectedPipelineMandateId);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save meeting link.");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to save meeting link.");
    } finally {
      setSavingMeetingLink(false);
    }
  };

  useEffect(() => {
    fetchFunnelData();
    fetchMandatesData();
    fetchNotifications();
    fetchPipelineData();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "pipeline" || tab === "mandates" || tab === "dashboard") {
        setCurrentTab(tab);
      }

      try {
        const savedChases = JSON.parse(localStorage.getItem("recruitos_dismissed_chases") || "[]");
        const savedNotices = JSON.parse(localStorage.getItem("recruitos_dismissed_notices") || "[]");
        if (Array.isArray(savedChases)) setDismissedChaseIds(savedChases);
        if (Array.isArray(savedNotices)) setDismissedNoticeIds(savedNotices);
      } catch (e) {
        console.error("Failed to load dismissed items from localStorage", e);
      }
    }
  }, [scopeFilter]);

  useEffect(() => {
    if (currentTab === "pipeline") {
      fetchPipelineData(selectedPipelineMandateId);
    }
  }, [currentTab, selectedPipelineMandateId]);

  // Handle Approve Mandate
  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInbound) return;
    setApproving(true);
    setApprovalError(null);

    try {
      const res = await fetch(`/api/mandates/${selectedInbound.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve mandate");
      }

      setSuccessMessage(
        `Search Mandate '${selectedInbound.title}' approved! 72h SLA Radar started.`
      );
      setSelectedInbound(null);
      fetchMandatesData();
      fetchFunnelData();
    } catch (err: any) {
      setApprovalError(err.message || "Approval failed");
    } finally {
      setApproving(false);
    }
  };

  // AI Job Description Auto-Parsing Handler
  const handleParseJd = async (textToParse?: string, fileToParse?: File) => {
    const text = textToParse !== undefined ? textToParse : jdRawInput;
    if (!fileToParse && (!text || text.trim().length < 15)) {
      setJdParseError("Please provide job description text (at least 15 characters) or select a document.");
      return;
    }

    setIsParsingJd(true);
    setJdParseError(null);
    setJdParseSuccess(null);

    try {
      let res: Response;
      if (fileToParse) {
        const fd = new FormData();
        fd.append("file", fileToParse);
        res = await fetch("/api/mandates/parse-jd", {
          method: "POST",
          body: fd,
        });
      } else {
        res = await fetch("/api/mandates/parse-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to parse Job Description.");
      }

      const parsed = data.data;
      setOfflineForm((prev) => ({
        ...prev,
        title: parsed.title || prev.title,
        companyName: parsed.companyName || prev.companyName,
        department: parsed.department || prev.department,
        minExp: parsed.minExp !== undefined ? parsed.minExp : prev.minExp,
        maxExp: parsed.maxExp !== undefined ? parsed.maxExp : prev.maxExp,
        minCtc: parsed.minCtc ? String(parsed.minCtc) : prev.minCtc,
        maxCtc: parsed.maxCtc ? String(parsed.maxCtc) : prev.maxCtc,
        currency: parsed.currency || prev.currency,
        location: parsed.location || prev.location,
        workMode: parsed.workMode || prev.workMode,
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills.join(", ") : prev.skills,
        description: parsed.description || prev.description || text,
      }));

      setJdParseSuccess("✨ Job Description parsed! All mandate fields have been auto-populated.");
    } catch (err: any) {
      setJdParseError(err.message || "Failed to parse Job Description.");
    } finally {
      setIsParsingJd(false);
    }
  };

  // Handle Offline Mandate Creation
  const handleOfflineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOffline(true);
    setOfflineError(null);

    try {
      const res = await fetch("/api/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...offlineForm,
          source: "OFFLINE_BD",
          openings: parseInt(String(offlineForm.openings), 10) || 1,
          minExp: parseInt(String(offlineForm.minExp), 10) || 0,
          maxExp: parseInt(String(offlineForm.maxExp), 10) || 0,
          minCtc: offlineForm.minCtc ? parseFloat(offlineForm.minCtc) : null,
          maxCtc: offlineForm.maxCtc ? parseFloat(offlineForm.maxCtc) : null,
          feePercentage: parseFloat(String(offlineForm.feePercentage)) || 8.33,
          guaranteeDays: parseInt(String(offlineForm.guaranteeDays), 10) || 90,
          slaTargetHours: parseInt(String(offlineForm.slaTargetHours), 10) || 72,
          skills: offlineForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create mandate");
      }

      setSuccessMessage(`Mandate '${offlineForm.title}' created and launched on SLA radar!`);
      setIsOfflineModalOpen(false);
      setJdRawInput("");
      setJdParseSuccess(null);
      setJdParseError(null);
      fetchMandatesData();
      fetchFunnelData();
    } catch (err: any) {
      setOfflineError(err.message || "Mandate creation failed");
    } finally {
      setCreatingOffline(false);
    }
  };

  // Handle Open Distribution Modal (Broadcast / Partner)
  const handleOpenDistribution = async (mandate: ActiveMandate | MandateFunnelRecord) => {
    setDistributionMandate(mandate);
    setActiveDistTab("BROADCAST");
    setCopiedLink(false);

    try {
      const bRes = await fetch(`/api/mandates/${mandate.id}/broadcast`);
      if (bRes.ok) {
        const bData = await bRes.json();
        const bMap: Record<string, string> = {};
        (bData.broadcasts || []).forEach((item: any) => {
          bMap[item.platform] = item.status;
        });
        setBroadcasts(bMap);
      }

      const pRes = await fetch(`/api/mandates/${mandate.id}/partner-share`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.partnerShare) {
          setPartnerForm({
            maskedClientTitle: pData.partnerShare.maskedClientTitle,
            splitFeePercentage: pData.partnerShare.splitFeePercentage,
            shareToken: pData.partnerShare.shareToken,
            isActive: pData.partnerShare.isActive,
          });
        } else {
          setPartnerForm({
            maskedClientTitle: `${mandate.title} (Pre-IPO Tech Enterprise)`,
            splitFeePercentage: 50,
            shareToken: "",
            isActive: true,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching distribution settings:", err);
    }
  };

  // Toggle Broadcast Platform
  const handleToggleBroadcast = async (platform: string) => {
    if (!distributionMandate) return;
    const currentStatus = broadcasts[platform];
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

    try {
      const res = await fetch(`/api/mandates/${distributionMandate.id}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, status: newStatus }),
      });

      if (res.ok) {
        setBroadcasts((prev) => ({ ...prev, [platform]: newStatus }));
      }
    } catch (err) {
      console.error("Error toggling broadcast:", err);
    }
  };

  // Save Partner Share Settings
  const handleSavePartnerShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributionMandate) return;
    setUpdatingPartner(true);

    try {
      const res = await fetch(`/api/mandates/${distributionMandate.id}/partner-share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm),
      });

      const data = await res.json();
      if (res.ok && data.partnerShare) {
        setPartnerForm({
          maskedClientTitle: data.partnerShare.maskedClientTitle,
          splitFeePercentage: data.partnerShare.splitFeePercentage,
          shareToken: data.partnerShare.shareToken,
          isActive: data.partnerShare.isActive,
        });
        setSuccessMessage("Partner Sourcer split network link updated successfully!");
      }
    } catch (err) {
      console.error("Error updating partner share:", err);
    } finally {
      setUpdatingPartner(false);
    }
  };

  // Open Client Portal Submissions Modal
  const handleOpenClientSubmit = async (mandate: ActiveMandate | MandateFunnelRecord) => {
    setClientSubmitMandate(mandate);
    setGeneratedPortalUrl(null);
    setCopiedPortalUrl(false);
    setSelectedCandidateIds([]);

    try {
      const res = await fetch("/api/candidates");
      if (res.ok) {
        const data = await res.json();
        setAgencyCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Error loading candidates for client portal submit:", err);
    }
  };

  // Generate Zero-Login Client Link
  const handleGenerateClientPortal = async () => {
    if (!clientSubmitMandate || selectedCandidateIds.length === 0) return;
    setGeneratingPortal(true);

    try {
      const res = await fetch(`/api/mandates/${clientSubmitMandate.id}/submit-to-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIds: selectedCandidateIds,
          feedbackSlaHours: 48,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate client presentation portal.");
      }

      setGeneratedPortalUrl(data.portalShare.shareableUrl);
      setSuccessMessage(
        `Shortlist of ${selectedCandidateIds.length} candidate(s) created! 48-Hour Feedback SLA timer initiated.`
      );
      fetchMandatesData();
      fetchFunnelData();
    } catch (err: any) {
      alert(err.message || "Failed to generate client portal.");
    } finally {
      setGeneratingPortal(false);
    }
  };

  // Open Silver Medalist Matching Drawer
  const handleOpenSilverMatches = async (mandate: ActiveMandate | MandateFunnelRecord) => {
    setSilverMatchMandate(mandate);
    setLoadingSilverMatches(true);
    setMatchingCandidates([]);

    try {
      const res = await fetch(`/api/mandates/${mandate.id}/matching-silver-medalists`);
      if (res.ok) {
        const data = await res.json();
        setMatchingCandidates(data.matches || []);
      }
    } catch (err) {
      console.error("Error loading matching silver medalists:", err);
    } finally {
      setLoadingSilverMatches(false);
    }
  };

  // 1-Click Instant Redeploy from Matching Drawer
  const handleInstantRedeploy = async (candidateId: string) => {
    if (!silverMatchMandate) return;
    setRedeployingId(candidateId);

    try {
      const res = await fetch(`/api/candidates/${candidateId}/redeploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMandateId: silverMatchMandate.id,
          recruiterNotes: `Instantly redeployed from Silver Medalist Talent Vault for '${silverMatchMandate.title}'.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Redeployment failed.");
      }

      setSuccessMessage(`⚡ Candidate instantly redeployed to '${silverMatchMandate.title}' in SCREENED QUALIFIED stage!`);
      setMatchingCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      fetchMandatesData();
      fetchFunnelData();
    } catch (err: any) {
      alert(err.message || "Failed to redeploy candidate.");
    } finally {
      setRedeployingId(null);
    }
  };

  // Filtered lists
  const filteredMandateFunnels = mandateFunnels.filter((m) => {
    const q = funnelSearchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.client.name.toLowerCase().includes(q) ||
      (m.location && m.location.toLowerCase().includes(q))
    );
  });

  const currentMandatesList = mandateViewMode === "active" ? activeMandates : closedMandates;
  const filteredActiveMandates = currentMandatesList.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.client.name.toLowerCase().includes(q) ||
      (m.location && m.location.toLowerCase().includes(q)) ||
      (m.skills && m.skills.some((s) => s.toLowerCase().includes(q))) ||
      (m.assignedRecruiter?.name && m.assignedRecruiter.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <UserSandboxBanner />
      {/* Cockpit Unified Navigation Bar */}
      <CockpitHeader
        activeTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        inboundCount={inboundMandates.length}
        pipelineAlertCount={
          (pipelineData?.stats?.breachedCount || 0) > 0
            ? pipelineData!.stats.breachedCount
            : (pipelineData?.stats?.totalInterviewsToday || 0)
        }
        isBreachedAlert={(pipelineData?.stats?.breachedCount || 0) > 0}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: ⚡ COMMAND CENTER (UNIFIED RADAR, 3-DAY INTERVIEWS, SLA CHASE & NOTICE WATCH) */}
        {/* ========================================================================= */}
        {(currentTab === "dashboard" || currentTab === "pipeline") && (
          <div className="space-y-6">
            {/* 1-Click Chase Notification Alert */}
            {chaseSuccessMessage && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center space-x-2.5">
                  <Zap className="h-5 w-5 text-amber-600 flex-shrink-0 animate-bounce" />
                  <span className="text-xs sm:text-sm font-bold">{chaseSuccessMessage}</span>
                </div>
                <button
                  onClick={() => setChaseSuccessMessage(null)}
                  className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Command Center Header Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="h-10 w-10 rounded-xl bg-[#fce17c] border border-[#f5d762] flex items-center justify-center text-slate-900 shadow-xs flex-shrink-0">
                  <Zap className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base font-black text-slate-900 tracking-tight">Recruiter Command Center</h1>
                    <span className="bg-[#fce17c]/40 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded border border-[#f5d762] uppercase tracking-wide">
                      Live Velocity
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily execution lineup, client review SLA bottlenecks, and post-offer drop-off radar.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Mandate Filter */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={selectedPipelineMandateId}
                    onChange={(e) => setSelectedPipelineMandateId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 border-none outline-none cursor-pointer pr-2"
                  >
                    <option value="all">All Mandates ({activeMandates.length})</option>
                    {activeMandates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.client.name})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsOfflineModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#fce17c] hover:bg-[#ebd066] border border-[#f5d762] text-slate-900 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-slate-900" />
                  <span>+ New Mandate</span>
                </button>
              </div>
            </div>

            {/* 1. HIGH-SIGNAL PULSE STRIP (4 METRICS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Interviews Schedule */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Interviews Lineup</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {pipelineLoading ? "..." : (pipelineData?.stats?.totalInterviewsToday || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center space-x-2">
                    <span>Yest: <strong>{pipelineData?.stats?.totalInterviewsYesterday || 0}</strong></span>
                    <span>•</span>
                    <span>Today: <strong className="text-blue-600">{pipelineData?.stats?.totalInterviewsToday || 0}</strong></span>
                    <span>•</span>
                    <span>Tmrw: <strong>{pipelineData?.stats?.totalInterviewsTomorrow || 0}</strong></span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>

              {/* Metric 2: Client SLA Chases Due */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Chases Due (&gt;48h)</span>
                  <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline space-x-2">
                    <span>{pipelineLoading ? "..." : ((pipelineData?.stats?.breachedCount || 0) + (pipelineData?.stats?.warningCount || 0))}</span>
                    {(pipelineData?.stats?.breachedCount || 0) > 0 && (
                      <span className="text-xs font-bold text-rose-600">({pipelineData?.stats?.breachedCount} breached)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Clients awaiting response</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
              </div>

              {/* Metric 3: Notice Period Watch (RC-05) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Notice Period Watch</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {pipelineLoading ? "..." : (pipelineData?.stats?.noticePeriodCount || 0)}
                  </div>
                  <span className="text-[10px] text-purple-600 font-bold">Offer locked • 30-90d retain</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              {/* Metric 4: Active Mandates Velocity */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Active Mandates</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {activeMandates.length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-extrabold">
                    {pipelineData?.stats?.slaComplianceRate ?? 100}% SLA Healthy
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* 2. 3-DAY INTERVIEWS COMMAND (YESTERDAY, TODAY, TOMORROW) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-100 gap-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-700" />
                  <h2 className="text-sm font-black text-slate-900">Interviews Command</h2>
                  <span className="text-xs text-slate-400 font-medium ml-1">3-day rolling window</span>
                </div>

                {/* Sub-tabs: Today, Tomorrow, Yesterday */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-fit">
                  <button
                    type="button"
                    onClick={() => setInterviewWindow("today")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      interviewWindow === "today"
                        ? "bg-white text-slate-900 shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Today ({pipelineData?.stats?.totalInterviewsToday || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewWindow("tomorrow")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      interviewWindow === "tomorrow"
                        ? "bg-white text-slate-900 shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tomorrow ({pipelineData?.stats?.totalInterviewsTomorrow || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewWindow("yesterday")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      interviewWindow === "yesterday"
                        ? "bg-white text-slate-900 shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Yesterday ({pipelineData?.stats?.totalInterviewsYesterday || 0})
                  </button>
                </div>
              </div>

              {/* Render Interview Cards based on selected window */}
              {pipelineLoading ? (
                <div className="py-8 flex items-center justify-center space-x-2 text-slate-400 text-xs font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  <span>Loading interview schedule...</span>
                </div>
              ) : (() => {
                const currentList =
                  interviewWindow === "today"
                    ? pipelineData?.interviewsToday || []
                    : interviewWindow === "tomorrow"
                    ? pipelineData?.interviewsTomorrow || []
                    : pipelineData?.interviewsYesterday || [];

                if (currentList.length === 0) {
                  return (
                    <div className="py-8 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
                      <Calendar className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-600">
                        {interviewWindow === "today"
                          ? "No interviews scheduled for today"
                          : interviewWindow === "tomorrow"
                          ? "No interviews scheduled for tomorrow"
                          : "No interviews took place yesterday"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Interviews synced via WhatsApp candidate slots appear here.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentList.map((iv) => {
                      const timeStr = new Date(iv.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const hasLink = !!iv.meetingLink;
                      return (
                        <div
                          key={iv.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900">{timeStr}</span>
                              <span className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                                {iv.durationMinutes} mins
                              </span>
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-900 mt-1">{iv.candidate.fullName}</h3>
                            <p className="text-xs text-slate-600 font-medium">{iv.candidate.currentTitle || "Candidate"}</p>
                            <div className="mt-1 flex items-center space-x-1 text-[11px] text-slate-500">
                              <Briefcase className="h-3 w-3 text-slate-400" />
                              <span className="font-semibold text-slate-700">{iv.mandate.title}</span>
                              <span>• {iv.mandate.client.name}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                            {hasLink ? (
                              <div className="flex items-center space-x-1.5">
                                <a
                                  href={iv.meetingLink!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <Video className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Join</span>
                                  <ExternalLink className="h-2.5 w-2.5 ml-0.5 text-emerald-500" />
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(iv.meetingLink!);
                                    setCopiedInterviewId(iv.id);
                                    setTimeout(() => setCopiedInterviewId(null), 2000);
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                                  title="Copy Meeting Link"
                                >
                                  {copiedInterviewId === iv.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                <span>Link Needed</span>
                              </span>
                            )}

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setMeetingLinkModal({
                                    isOpen: true,
                                    interviewId: iv.id,
                                    candidateName: iv.candidate.fullName,
                                    mandateTitle: iv.mandate.title,
                                    currentLink: iv.meetingLink || "",
                                  });
                                  setMeetingLinkInput(iv.meetingLink || "");
                                }}
                                className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                {hasLink ? "Edit Link" : "+ Link"}
                              </button>
                              <button
                                onClick={() => router.push(`/cockpit/mandates/${iv.mandate.id}`)}
                                className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                title="View Mandate Workspace"
                              >
                                Debrief
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 3. TWO-COLUMN ACTION RADARS: RC-03 CLIENT CHASE QUEUE & RC-05 NOTICE PERIOD WATCH */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: RC-03 Client SLA Chase Queue */}
              {(() => {
                const displayedChases = (pipelineData?.chasesDue || []).filter((c) => !dismissedChaseIds.includes(c.id));
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <div>
                          <h2 className="text-sm font-black text-slate-900">Client Feedback Chase Queue</h2>
                          <p className="text-[11px] text-slate-400 font-medium">Submissions awaiting client review (&gt;48h SLA)</p>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {displayedChases.length} Pending
                      </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
                      {displayedChases.length === 0 ? (
                        <div className="py-10 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
                          <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto mb-1.5" />
                          <p className="text-xs font-bold text-slate-700">All Client SLAs are Healthy!</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">No submissions waiting on client review over 48 hours.</p>
                        </div>
                      ) : (
                        displayedChases.map((c) => {
                          const isBreached = c.slaStatus === "BREACHED";
                          const isWarning = c.slaStatus === "WARNING";
                          return (
                            <div
                              key={c.id}
                              className={`p-3.5 bg-white rounded-xl border transition-all shadow-2xs hover:shadow-sm space-y-2.5 ${
                                isBreached
                                  ? "border-l-4 border-l-rose-500 border-slate-200"
                                  : isWarning
                                  ? "border-l-4 border-l-amber-500 border-slate-200"
                                  : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-black text-xs flex-shrink-0 border border-slate-200">
                                    {getInitials(c.candidate.fullName)}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                                      {c.candidate.fullName}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 truncate">
                                      {c.mandate.client.name} • {c.mandate.title}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      isBreached
                                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                                        : isWarning
                                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {c.hoursWaiting}h waiting
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDismissChase(c.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Dismiss from Chase Queue"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                                <span className="text-[10px] text-slate-400">
                                  Notice: <strong>{c.candidate.noticePeriodDays}d</strong> • Exp: <strong>{c.candidate.totalExpYears}y</strong>
                                </span>

                                <button
                                  onClick={() => handleChaseClient(c.mandate.id, c.candidate.fullName)}
                                  disabled={chasingMandateId === c.mandate.id}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {chasingMandateId === c.mandate.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-amber-700" />
                                  ) : (
                                    <Zap className="h-3 w-3 text-amber-600" />
                                  )}
                                  <span>1-Click Chase</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Right Column: RC-05 Notice Period Watch (Drop-off Radar) */}
              {(() => {
                const displayedNoticeWatch = (pipelineData?.noticePeriodWatch || []).filter((c) => !dismissedNoticeIds.includes(c.id));
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                        <div>
                          <h2 className="text-sm font-black text-slate-900">Notice Period & Retention Radar</h2>
                          <p className="text-[11px] text-slate-400 font-medium">Pre-joined offer holders (RC-05 Drop-off mitigation)</p>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                        {displayedNoticeWatch.length} In Notice
                      </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
                      {displayedNoticeWatch.length === 0 ? (
                        <div className="py-10 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
                          <ShieldCheck className="h-7 w-7 text-purple-300 mx-auto mb-1.5" />
                          <p className="text-xs font-bold text-slate-700">No Candidates Currently Serving Notice</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Candidates who accept offers and enter notice periods appear here for active check-ins.
                          </p>
                        </div>
                      ) : (
                        displayedNoticeWatch.map((c) => {
                          const phoneClean = c.candidate.phone ? c.candidate.phone.replace(/[^0-9]/g, "") : "";
                          const whatsappText = encodeURIComponent(
                            `Hi ${c.candidate.fullName}, hope you're having a great week! Just wanted to check in on how your notice period is going. Let me know if you need anything from our end.`
                          );
                          const whatsappUrl = phoneClean
                            ? `https://wa.me/${phoneClean}?text=${whatsappText}`
                            : null;

                          return (
                            <div
                              key={c.id}
                              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-purple-200 shadow-2xs hover:shadow-sm transition-all space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-900 flex items-center justify-center font-black text-xs flex-shrink-0 border border-purple-200">
                                    {getInitials(c.candidate.fullName)}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                                      {c.candidate.fullName}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 truncate">
                                      Joining {c.mandate.client.name} • {c.mandate.title}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                                    {c.daysRemaining} days left
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDismissNotice(c.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Dismiss from Command Center"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                                <span className="text-[10px] text-slate-400">
                                  Notice: <strong>{c.daysInNotice}d</strong> • Accepted <strong>{c.daysSinceAccepted}d ago</strong>
                                </span>

                                {whatsappUrl ? (
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                  >
                                    <span>💬 WhatsApp Pulse</span>
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => router.push(`/cockpit/mandates/${c.mandate.id}`)}
                                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                                  >
                                    View Profile
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 4. ACTIVE SEARCH MANDATES VELOCITY DECK (STREAMLINED EXECUTIVE LIST) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-slate-700" />
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Active Search Mandates Velocity Deck
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pipeline momentum, candidate volume, and quick access to active search workspaces.
                  </p>
                </div>

                <div className="relative rounded-xl shadow-2xs w-full sm:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={funnelSearchQuery}
                    onChange={(e) => setFunnelSearchQuery(e.target.value)}
                    placeholder="Filter by mandate or client..."
                    className="block w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#fce17c] focus:border-[#f5d762]"
                  />
                  {funnelSearchQuery && (
                    <button
                      onClick={() => setFunnelSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="text-xs font-bold">✕</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingFunnel ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading mandates velocity...</div>
              ) : filteredMandateFunnels.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {funnelSearchQuery ? "No mandates match your filter criteria." : "No active search mandates found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-black text-slate-600 uppercase tracking-wider">Search Mandate / Client</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">Pipeline Depth</th>
                        <th className="px-3 py-3 text-center font-bold text-blue-700 uppercase tracking-wider">In Review</th>
                        <th className="px-3 py-3 text-center font-bold text-purple-700 uppercase tracking-wider">Interviews</th>
                        <th className="px-3 py-3 text-center font-bold text-emerald-800 uppercase tracking-wider">Joined</th>
                        <th className="px-4 py-3 text-right font-bold text-slate-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredMandateFunnels.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center space-x-1.5">
                              <span>{m.title}</span>
                              <ChevronRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {m.client.name} • {m.location || "Hybrid"}
                            </div>
                          </td>

                          {/* Pipeline Depth */}
                          <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black text-xs">
                              {m.funnel.ingested} candidates
                            </span>
                          </td>

                          {/* In Review */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.sharedWithCompany > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                                {m.funnel.sharedWithCompany}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* Interviews */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.interviewsDone + m.funnel.selectedForInterview > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                                {m.funnel.interviewsDone + m.funnel.selectedForInterview}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* Joined */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.joined > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {m.funnel.joined}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#fce17c] hover:border-[#f5d762] border border-slate-200 text-slate-800 hover:text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                            >
                              <Briefcase className="h-3.5 w-3.5 text-slate-700" />
                              <span>Open Workspace</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

                {/* ========================================================================= */}
        {/* TAB 2: MANDATES & SLA RADAR (INBOUND APPROVALS & VELOCITY TRACKING)      */}
        {/* ========================================================================= */}
        {currentTab === "mandates" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-slate-800" />
                  <h1 className="text-base font-extrabold text-slate-900">Search Mandates & SLA Radar</h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify inbound client requests, enforce 72-hour shortlist SLAs, and inspect complete JDs.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsOfflineModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ New Search Mandate</span>
                </button>
              </div>
            </div>

            {/* Inbound Search Intake Requests (Pending Owner Review) */}
            {isManagement && inboundMandates.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-300 shadow-sm overflow-hidden animate-in fade-in">
                <div className="bg-amber-50/70 px-6 py-3.5 border-b border-amber-200 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Inbox className="h-4 w-4 text-amber-700" />
                    <h2 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Inbound Client Search Requests Pending Review ({inboundMandates.length})
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                    Action Required (AS-02)
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {inboundMandates.map((inbound) => (
                    <div
                      key={inbound.id}
                      className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-slate-900 text-sm">{inbound.title}</h3>
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                            {inbound.client.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                          <span>{inbound.location || "Location Flexible"}</span>
                          <span>•</span>
                          <span>
                            CTC: {inbound.minCtc ? `${(inbound.minCtc / 100000).toFixed(1)}L` : "Open"} -{" "}
                            {inbound.maxCtc ? `${(inbound.maxCtc / 100000).toFixed(1)}L ${inbound.currency}` : "Negotiable"}
                          </span>
                          <span>•</span>
                          <span>Exp: {inbound.minExp}-{inbound.maxExp} Yrs</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedInbound(inbound)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Review & Set 72h SLA
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active / Closed Mandates List with 72h SLA Radar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  {/* Segmented Pill Toggle: Active Searches vs Closed & Archived */}
                  <div className="inline-flex p-1 bg-slate-200/70 rounded-xl text-xs font-bold shrink-0">
                    <button
                      type="button"
                      onClick={() => setMandateViewMode("active")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        mandateViewMode === "active"
                          ? "bg-white text-slate-900 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Active Searches ({activeMandates.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMandateViewMode("closed")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        mandateViewMode === "closed"
                          ? "bg-white text-slate-900 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Closed & Archived ({closedMandates.length})
                    </button>
                  </div>

                  <div className="relative rounded-lg shadow-sm flex-1 max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={mandateViewMode === "active" ? "Search active mandates, clients, skills..." : "Search closed mandates, clients..."}
                      className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing <strong>{filteredActiveMandates.length}</strong> {mandateViewMode === "active" ? "active" : "closed"} searches
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading mandates...</div>
              ) : filteredActiveMandates.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  {mandateViewMode === "active" ? "No active search mandates found." : "No closed or archived search mandates found."}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredActiveMandates.map((m) => {
                    const initials = m.client.name
                      ? m.client.name
                          .split(" ")
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "CO";

                    const expText =
                      m.minExp && m.maxExp
                        ? `${m.minExp}-${m.maxExp} Yrs`
                        : m.minExp
                        ? `${m.minExp}+ Yrs`
                        : "Any Exp";

                    const ctcText =
                      m.minCtc || m.maxCtc
                        ? `${m.minCtc ? (m.minCtc / 100000).toFixed(0) : "0"} - ${m.maxCtc ? (m.maxCtc / 100000).toFixed(0) : "Open"} Lacs PA`
                        : "CTC Negotiable";

                    const cleanDescription = m.description
                      ? m.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
                      : "";

                    return (
                      <div
                        key={m.id}
                        onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                        className="p-5 hover:bg-slate-50/70 transition-all cursor-pointer group relative"
                      >
                        {/* Top Row: Title + Client + Relative Time + SLA badge on left; Client Monogram Box on right */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors leading-snug">
                                {m.title}
                              </h3>
                            </div>

                            <div className="mt-1 flex items-center flex-wrap gap-2 text-xs">
                              <span className="font-semibold text-slate-700">{m.client.name}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 font-normal">{formatRelativeTime(m.createdAt)}</span>
                              <span className="text-slate-300">•</span>
                              {m.calculatedSlaStatus === "BREACHED" ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                  <span>
                                    {m.hasShortlistSubmitted ? "Client review SLA breached" : "Sourcing SLA breached"} ({m.hoursInStage}h / {m.slaTargetHours}h)
                                  </span>
                                </span>
                              ) : m.calculatedSlaStatus === "WARNING" ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                  <span>
                                    {m.hasShortlistSubmitted ? "Client review pending" : "Sourcing pending"} ({m.hoursInStage}h / {m.slaTargetHours}h)
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span>
                                    {m.hasShortlistSubmitted ? "Client review on track" : "Sourcing on track"}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Client Monogram / Logo Box (Naukri style) */}
                          <div
                            className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center font-black text-slate-600 text-xs shrink-0 shadow-2xs group-hover:border-slate-300 group-hover:bg-white transition-colors"
                            title={m.client.name}
                          >
                            {initials}
                          </div>
                        </div>

                        {/* Metrics Line (Naukri Quadruple: Exp, CTC, Location, Commercials) */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-y-1.5 text-xs text-slate-600">
                          {/* Experience */}
                          <div className="flex items-center space-x-1.5 pr-3">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{expText}</span>
                          </div>

                          <span className="text-slate-300 pr-3">•</span>

                          {/* CTC */}
                          <div className="flex items-center space-x-1 pr-3">
                            <span className="font-semibold text-slate-500 text-xs">₹</span>
                            <span>{ctcText}</span>
                          </div>

                          <span className="text-slate-300 pr-3">•</span>

                          {/* Location & Mode */}
                          <div className="flex items-center space-x-1.5 pr-3">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>
                              {m.location || "Hybrid"} {m.workMode ? `(${m.workMode})` : ""}
                            </span>
                          </div>

                          <span className="text-slate-300 pr-3">•</span>

                          {/* Commercials */}
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>
                              {m.feePercentage}% Fee &bull; {m.guaranteeDays}d Guarantee
                            </span>
                          </div>
                        </div>

                        {/* Description Snippet (Naukri style) */}
                        {cleanDescription && (
                          <div className="mt-2 flex items-center space-x-1.5 text-xs text-slate-500">
                            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <p className="line-clamp-1 truncate">{cleanDescription}</p>
                          </div>
                        )}

                        {/* Skills Line (Naukri dot-separated typography) */}
                        {m.skills && m.skills.length > 0 && (
                          <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                            {m.skills.slice(0, 6).map((skill, idx) => (
                              <React.Fragment key={idx}>
                                <span className="hover:text-slate-800 transition-colors font-medium">
                                  {skill}
                                </span>
                                {idx < Math.min(m.skills.length, 6) - 1 && (
                                  <span className="text-slate-300 font-bold">&bull;</span>
                                )}
                              </React.Fragment>
                            ))}
                            {m.skills.length > 6 && (
                              <span className="text-[11px] text-slate-400 font-medium ml-0.5">
                                +{m.skills.length - 6} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bottom Utility Bar */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Pipeline info & desk lead */}
                          <div className="flex items-center space-x-2 text-xs text-slate-500 flex-wrap gap-y-1">
                            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>
                              <strong className="text-slate-800">{m._count?.submissions || 0}</strong> in pipeline
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>
                              Lead: <strong className="text-slate-700">{m.assignedRecruiter?.name || "Solo Owner"}</strong>
                            </span>
                            {m.openings > 1 && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>
                                  <strong className="text-slate-700">{m.openings}</strong> openings
                                </span>
                              </>
                            )}
                          </div>

                          {/* Kebab menu for tools */}
                          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuMandateId(activeMenuMandateId === m.id ? null : m.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
                              title="More Options"
                              aria-label="More mandate actions"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>

                            {activeMenuMandateId === m.id && (
                              <div className="absolute right-0 bottom-full mb-1.5 z-30 min-w-[210px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuMandateId(null);
                                    handleOpenSilverMatches(m);
                                  }}
                                  className="w-full text-left px-3 py-2 text-amber-900 hover:bg-amber-50 font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                                >
                                  <Zap className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Matching Silver Medalists</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuMandateId(null);
                                    handleOpenDistribution(m);
                                  }}
                                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                                >
                                  <Share2 className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Distribution &amp; Partner Split</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuMandateId(null);
                                    handleOpenClientSubmit(m);
                                  }}
                                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                                >
                                  <Send className="h-3.5 w-3.5 text-slate-500" />
                                  <span>{m.hasShortlistSubmitted ? "Shared with Client" : "Submit to Client"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuMandateId(null);
                                    if (typeof window !== "undefined") {
                                      navigator.clipboard.writeText(`${window.location.origin}/storefront/mandate/${m.id}`);
                                      alert("Public mandate link copied to clipboard!");
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Copy Public Link</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                {mandateViewMode === "active" ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuMandateId(null);
                                      setMandateToClose(m);
                                    }}
                                    className="w-full text-left px-3 py-2 text-amber-800 hover:bg-amber-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                                  >
                                    <Archive className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Close / Retire Mandate</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuMandateId(null);
                                      handleReopenMandate(m.id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-emerald-800 hover:bg-emerald-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Re-open Mandate</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuMandateId(null);
                                    setMandateToDelete(m);
                                  }}
                                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium flex items-center space-x-2 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Delete to Trash Bin</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: REVIEW & APPROVE INBOUND MANDATE (AS-02, RC-03) */}
      {selectedInbound && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 text-sm">Review & Approve Search Mandate (AS-02)</h3>
              </div>
              <button
                onClick={() => setSelectedInbound(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              {approvalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{approvalError}</span>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 text-sm block">{selectedInbound.title}</span>
                <div className="text-[11px] text-slate-500">
                  {selectedInbound.client.name} • {selectedInbound.location || "Hybrid"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Assign Desk Lead / Recruiter *</label>
                  <select
                    required
                    value={approvalForm.assignedRecruiterId}
                    onChange={(e) => setApprovalForm({ ...approvalForm, assignedRecruiterId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    {recruiters.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee Percentage (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={approvalForm.feePercentage}
                    onChange={(e) => setApprovalForm({ ...approvalForm, feePercentage: parseFloat(e.target.value) || 8.33 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shortlist SLA (Hours) *</label>
                  <input
                    type="number"
                    required
                    value={approvalForm.slaTargetHours}
                    onChange={(e) => setApprovalForm({ ...approvalForm, slaTargetHours: parseInt(e.target.value, 10) || 72 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInbound(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approving}
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {approving ? "Approving..." : "Approve Mandate & Start 72h SLA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: OFFLINE BD SEARCH MANDATE CREATION */}
      {isOfflineModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 text-sm">Create New Search Mandate</h3>
              </div>
              <button
                onClick={() => setIsOfflineModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleOfflineSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {offlineError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{offlineError}</span>
                </div>
              )}

              {/* AI Auto-Fill Toolbar */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span className="font-extrabold text-slate-900 text-xs">✨ AI Auto-Fill from Job Description</span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300/60">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Paste raw JD text or upload a JD file (.pdf, .docx, .txt). Gemini AI will parse requirements and pre-fill Role Title, Experience Range, Skills, CTC, and Work Mode automatically!
                </p>

                {jdParseError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start space-x-1.5">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{jdParseError}</span>
                  </div>
                )}
                {jdParseSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start space-x-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-600" />
                    <span>{jdParseSuccess}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={jdRawInput}
                    onChange={(e) => setJdRawInput(e.target.value)}
                    placeholder="Paste full Job Description text here..."
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-amber-100/50 border border-amber-300 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5 text-amber-600" />
                      <span>Upload JD File (PDF / Word)</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleParseJd(undefined, file);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      disabled={isParsingJd || !jdRawInput.trim()}
                      onClick={() => handleParseJd(jdRawInput)}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                    >
                      {isParsingJd ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Parsing with AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>✨ Parse & Auto-Populate Form</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">Target Role Title *</label>
                  <input
                    type="text"
                    required
                    value={offlineForm.title}
                    onChange={(e) => setOfflineForm({ ...offlineForm, title: e.target.value })}
                    placeholder="e.g. VP of Autonomous Robotics"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Company Name *</label>
                  <input
                    type="text"
                    required
                    value={offlineForm.companyName}
                    onChange={(e) => setOfflineForm({ ...offlineForm, companyName: e.target.value })}
                    placeholder="Nova Dynamics AI"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={offlineForm.contactEmail}
                    onChange={(e) => setOfflineForm({ ...offlineForm, contactEmail: e.target.value })}
                    placeholder="hiring@novadynamics.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
                  <select
                    value={offlineForm.workMode}
                    onChange={(e) => setOfflineForm({ ...offlineForm, workMode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={offlineForm.location}
                    onChange={(e) => setOfflineForm({ ...offlineForm, location: e.target.value })}
                    placeholder="Bengaluru, India"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={offlineForm.minExp}
                    onChange={(e) => setOfflineForm({ ...offlineForm, minExp: parseInt(e.target.value, 10) || 0 })}
                    placeholder="2"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={offlineForm.maxExp}
                    onChange={(e) => setOfflineForm({ ...offlineForm, maxExp: parseInt(e.target.value, 10) || 0 })}
                    placeholder="6"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Target CTC (INR)</label>
                  <input
                    type="number"
                    value={offlineForm.minCtc}
                    onChange={(e) => setOfflineForm({ ...offlineForm, minCtc: e.target.value })}
                    placeholder="4000000"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Target CTC (INR)</label>
                  <input
                    type="number"
                    value={offlineForm.maxCtc}
                    onChange={(e) => setOfflineForm({ ...offlineForm, maxCtc: e.target.value })}
                    placeholder="6000000"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Key Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={offlineForm.skills}
                    onChange={(e) => setOfflineForm({ ...offlineForm, skills: e.target.value })}
                    placeholder="C++, ROS2, LiDAR, SLAM"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Job Description Text</label>
                    {offlineForm.description && offlineForm.description.trim().length > 20 && (
                      <button
                        type="button"
                        onClick={() => handleParseJd(offlineForm.description)}
                        disabled={isParsingJd}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>✨ Re-extract fields from this text</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={offlineForm.description}
                    onChange={(e) => setOfflineForm({ ...offlineForm, description: e.target.value })}
                    placeholder="Paste full job description requirements here..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOfflineModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOffline}
                  className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {creatingOffline ? "Creating..." : "Launch Search Mandate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ZERO-LOGIN CLIENT PORTAL SUBMIT (CL-01, CL-02) */}
      {clientSubmitMandate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-blue-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Submit Candidates to Client Portal</h3>
                  <p className="text-[10px] text-blue-800">Role: {clientSubmitMandate.title}</p>
                </div>
              </div>
              <button
                onClick={() => setClientSubmitMandate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="font-bold text-slate-900 text-xs block">
                Select Candidates from Talent Pool to Present:
              </span>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {agencyCandidates.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">No candidates found in pool.</div>
                ) : (
                  agencyCandidates.map((c) => {
                    const isSelected = selectedCandidateIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== c.id));
                          } else {
                            setSelectedCandidateIds([...selectedCandidateIds, c.id]);
                          }
                        }}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{c.fullName}</div>
                          <div className="text-[10px] text-slate-500">
                            {c.currentTitle} • {c.totalExpYears}y Exp • {c.noticePeriodDays}d Notice
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-blue-600 h-4 w-4"
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {generatedPortalUrl && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="font-extrabold text-emerald-900 text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Zero-Login Interactive Client Portal Active!</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedPortalUrl}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white text-slate-800 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPortalUrl);
                        setCopiedPortalUrl(true);
                        setTimeout(() => setCopiedPortalUrl(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      {copiedPortalUrl ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClientSubmitMandate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={generatingPortal || selectedCandidateIds.length === 0}
                  onClick={handleGenerateClientPortal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {generatingPortal ? "Generating..." : `Generate Link (${selectedCandidateIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DISTRIBUTION & PARTNER SHARING (RC-08, PO-01) */}
      {distributionMandate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Job Distribution & Partner Split Network</h3>
                  <p className="text-[10px] text-purple-800">Role: {distributionMandate.title}</p>
                </div>
              </div>
              <button
                onClick={() => setDistributionMandate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex border-b border-slate-200 space-x-4">
                <button
                  onClick={() => setActiveDistTab("BROADCAST")}
                  className={`pb-2 font-bold cursor-pointer transition-colors ${
                    activeDistTab === "BROADCAST" ? "border-b-2 border-purple-600 text-purple-900" : "text-slate-500"
                  }`}
                >
                  Job Boards 1-Click Multi-Posting (RC-08)
                </button>
                <button
                  onClick={() => setActiveDistTab("PARTNER")}
                  className={`pb-2 font-bold cursor-pointer transition-colors ${
                    activeDistTab === "PARTNER" ? "border-b-2 border-purple-600 text-purple-900" : "text-slate-500"
                  }`}
                >
                  Partner Sourcer 50% Split Link (PO-01)
                </button>
              </div>

              {activeDistTab === "BROADCAST" && (
                <div className="space-y-3">
                  {["LINKEDIN", "NAUKRI", "BAYT", "INDEED"].map((platform) => {
                    const isActive = broadcasts[platform] === "ACTIVE";
                    return (
                      <div key={platform} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{platform}</span>
                          <span className="text-[10px] text-slate-500">Status: {isActive ? "🟢 Live" : "⚪ Paused"}</span>
                        </div>
                        <button
                          onClick={() => handleToggleBroadcast(platform)}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            isActive ? "bg-rose-100 text-rose-800" : "bg-purple-600 text-white"
                          }`}
                        >
                          {isActive ? "Pause" : "Broadcast"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeDistTab === "PARTNER" && (
                <form onSubmit={handleSavePartnerShare} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Masked Client Title (NDA Protected) *</label>
                    <input
                      type="text"
                      required
                      value={partnerForm.maskedClientTitle}
                      onChange={(e) => setPartnerForm({ ...partnerForm, maskedClientTitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Partner Split Fee % (Default 50%)</label>
                    <input
                      type="number"
                      value={partnerForm.splitFeePercentage}
                      onChange={(e) => setPartnerForm({ ...partnerForm, splitFeePercentage: parseFloat(e.target.value) || 50 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  {partnerForm.shareToken && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                      <span className="font-bold text-purple-900 text-[11px] block">Shareable Partner Link:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/partner/mandates/${partnerForm.shareToken}`}
                          className="w-full px-2.5 py-1 border border-purple-300 rounded text-xs bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/partner/mandates/${partnerForm.shareToken}`);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-xs cursor-pointer"
                        >
                          {copiedLink ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={updatingPartner}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {updatingPartner ? "Saving..." : "Save & Generate Split Link"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SILVER MEDALIST MATCHING DRAWER (RC-07) */}
      {silverMatchMandate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Matching Silver Medalists (RC-07)</h3>
                  <p className="text-[10px] text-amber-800">Role: {silverMatchMandate.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSilverMatchMandate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {loadingSilverMatches ? (
                <div className="p-8 text-center text-slate-400 text-xs">Analyzing talent vault for skill matches...</div>
              ) : matchingCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No silver medalist candidates currently match the skill criteria for this role.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {matchingCandidates.map((c) => (
                    <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{c.fullName}</div>
                          <div className="text-[10px] text-slate-500">{c.currentTitle} • {c.totalExpYears}y Exp</div>
                        </div>
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {c.matchScore}% Match
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleInstantRedeploy(c.id)}
                          disabled={redeployingId === c.id}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer flex items-center space-x-1"
                        >
                          <Zap className="h-3 w-3" />
                          <span>{redeployingId === c.id ? "Redeploying..." : "1-Click Redeploy"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSilverMatchMandate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: ATTACH MEETING LINK MODAL (Scenario B) */}
      {meetingLinkModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-slate-800" />
                <h3 className="text-sm font-extrabold text-slate-900">Attach Custom Meeting Link</h3>
              </div>
              <button
                onClick={() =>
                  setMeetingLinkModal({
                    isOpen: false,
                    interviewId: "",
                    candidateName: "",
                    mandateTitle: "",
                    currentLink: "",
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600 font-medium">
                Candidate: <span className="font-bold text-slate-900">{meetingLinkModal.candidateName}</span>
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mandate: <span className="font-bold text-slate-800">{meetingLinkModal.mandateTitle}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meeting URL (Google Meet / Zoom / Microsoft Teams)
              </label>
              <input
                type="url"
                value={meetingLinkInput}
                onChange={(e) => setMeetingLinkInput(e.target.value)}
                placeholder="https://meet.google.com/xyz-abcd-efg"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Paste the custom video meeting link provided by the client or generated by your desk.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setMeetingLinkModal({
                    isOpen: false,
                    interviewId: "",
                    candidateName: "",
                    mandateTitle: "",
                    currentLink: "",
                  })
                }
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMeetingLink}
                disabled={savingMeetingLink || !meetingLinkInput.trim()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                {savingMeetingLink && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Meeting Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLOSE / RETIRE MANDATE                                             */}
      {/* ========================================================================= */}
      {mandateToClose && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Close / Retire Mandate</h3>
                  <p className="text-[10px] text-amber-800">Archive this search and recycle unplaced candidates</p>
                </div>
              </div>
              <button
                onClick={() => setMandateToClose(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="font-bold text-slate-900 text-sm block mb-1">
                  Mandate: {mandateToClose.title}
                </span>
                <p className="text-slate-500 text-[11px]">{mandateToClose.client.name}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-2">Select Close Status *</label>
                <div className="space-y-2">
                  <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    closeMandateStatus === "CLOSED_FULFILLED" ? "bg-emerald-50/80 border-emerald-300" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="cockpitCloseStatus"
                      value="CLOSED_FULFILLED"
                      checked={closeMandateStatus === "CLOSED_FULFILLED"}
                      onChange={() => setCloseMandateStatus("CLOSED_FULFILLED")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Position Fulfilled / Closed</span>
                      <span className="text-[11px] text-slate-500">Successfully placed candidate(s) for this position.</span>
                    </div>
                  </label>

                  <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    closeMandateStatus === "CLOSED_CANCELLED" ? "bg-rose-50/80 border-rose-300" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="cockpitCloseStatus"
                      value="CLOSED_CANCELLED"
                      checked={closeMandateStatus === "CLOSED_CANCELLED"}
                      onChange={() => setCloseMandateStatus("CLOSED_CANCELLED")}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Search Cancelled by Client</span>
                      <span className="text-[11px] text-slate-500">Hiring freeze or budget cancelled by client.</span>
                    </div>
                  </label>

                  <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    closeMandateStatus === "CLOSED_ON_HOLD" ? "bg-amber-50/80 border-amber-300" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="cockpitCloseStatus"
                      value="CLOSED_ON_HOLD"
                      checked={closeMandateStatus === "CLOSED_ON_HOLD"}
                      onChange={() => setCloseMandateStatus("CLOSED_ON_HOLD")}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Put Mandate On-Hold</span>
                      <span className="text-[11px] text-slate-500">Temporarily paused by client; may resume later.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Notes / Context (Optional)</label>
                <textarea
                  rows={2}
                  value={closeMandateReason}
                  onChange={(e) => setCloseMandateReason(e.target.value)}
                  placeholder="e.g. Search fulfilled on time. Placed senior candidate."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recycleFinalists}
                    onChange={(e) => setRecycleFinalists(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-700 text-xs">
                    Tag unplaced candidates as <strong>Silver Medalists</strong> in Talent Bank
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMandateToClose(null)}
                  disabled={closingMandate}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCloseMandate}
                  disabled={closingMandate}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {closingMandate ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <span>Confirm & Archive</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE MANDATE TO TRASH BIN                                        */}
      {/* ========================================================================= */}
      {mandateToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-rose-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Move Mandate to Trash Bin</h3>
                  <p className="text-[10px] text-rose-700">Safely archives search mandate and releases child relations</p>
                </div>
              </div>
              <button
                onClick={() => setMandateToDelete(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-bold text-slate-900 text-sm">
                Move mandate <strong>{mandateToDelete.title}</strong> ({mandateToDelete.client.name}) to Trash Bin?
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Notice:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Mandate will be removed from Active and Closed lists.</li>
                  <li>Candidate records remain safe in your Talent Bank.</li>
                  <li>Mandates with verified paid placement invoices cannot be deleted.</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMandateToDelete(null)}
                  disabled={deletingMandate}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteMandate}
                  disabled={deletingMandate}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {deletingMandate ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Moving to Bin...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Move Mandate to Bin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
