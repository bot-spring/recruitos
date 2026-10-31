"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  MessageSquare,
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
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import { UserSandboxToggle, UserSandboxBanner } from "@/components/UserSandboxToggle";
import { CockpitHeader } from "@/components/CockpitHeader";
import { downloadCSV } from "@/lib/export-csv";

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
  rejected?: number;
  conversionRate: number;
}

interface VelocityItem {
  label: string;
  applied: number;
  shortlisted: number;
  rejected: number;
}

interface ApplicationsVelocityData {
  days: VelocityItem[];
  weeks: VelocityItem[];
  months: VelocityItem[];
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const batchCount = params.get("batchSuccess");
    const clientName = params.get("client");
    if (batchCount) {
      setSuccessMessage(
        `🚀 Successfully launched ${batchCount} new search mandates for '${clientName || "Client"}'! Sourcing mode active.`
      );
    }
  }, []);

  // Active Mandate Kebab Menu State
  const [activeMenuMandateId, setActiveMenuMandateId] = useState<string | null>(null);
  const [newMandateMenuOpen, setNewMandateMenuOpen] = useState(false);
  const [newMandateMenuTab2Open, setNewMandateMenuTab2Open] = useState(false);
  const newMandateMenuRef = useRef<HTMLDivElement>(null);
  const newMandateMenuTab2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (newMandateMenuRef.current && !newMandateMenuRef.current.contains(target as Node)) {
        setNewMandateMenuOpen(false);
      }
      if (newMandateMenuTab2Ref.current && !newMandateMenuTab2Ref.current.contains(target as Node)) {
        setNewMandateMenuTab2Open(false);
      }
      // Only close mandate action menu if click was outside the mandate kebab container
      if (target && !target.closest("[data-mandate-kebab]")) {
        setActiveMenuMandateId(null);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

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
    tasks?: {
      callbacks: {
        dueCount: number;
        completedToday: number;
        completionRate: number;
        items: Array<{
          id: string;
          callbackAt: string | null;
          candidate: {
            id: string;
            fullName: string;
            phone?: string | null;
            email?: string | null;
            currentTitle?: string | null;
          };
          mandate?: {
            id: string;
            title: string;
            client?: { id: string; name: string } | null;
          } | null;
        }>;
      };
      screening: {
        pendingCount: number;
        screenedToday: number;
        completionRate: number;
      };
      clientChases: {
        bottlenecksCount: number;
        totalWaiting: number;
        completionRate: number;
        topBottleneck?: any;
      };
      debriefs: {
        pendingCount: number;
        completedToday: number;
        completionRate: number;
        items: Array<{
          id: string;
          scheduledAt: string;
          candidate: {
            id: string;
            fullName: string;
            phone?: string | null;
            email?: string | null;
            currentTitle?: string | null;
          };
          mandate?: {
            id: string;
            title: string;
            client?: { id: string; name: string } | null;
          } | null;
        }>;
      };
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
      callbacksDueCount?: number;
      debriefsPendingCount?: number;
      unscreenedCount?: number;
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
  const [applicationsVelocity, setApplicationsVelocity] = useState<ApplicationsVelocityData | null>(null);
  const [velocityRange, setVelocityRange] = useState<"days" | "weeks" | "months">("days");
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

  // Interviews & Schedule Card State (Command Center Card 3)
  const [interviewsList, setInterviewsList] = useState<any[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewDateRange, setInterviewDateRange] = useState<"TODAY" | "NEXT_7" | "NEXT_30" | "LAST_7" | "LAST_30">("TODAY");

  const filteredInterviews = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return interviewsList
      .filter((iv) => {
        if (!iv.scheduledAt) return false;
        const d = new Date(iv.scheduledAt);

        if (interviewDateRange === "TODAY") {
          return d >= startOfToday && d <= endOfToday;
        }
        if (interviewDateRange === "NEXT_7") {
          const next7End = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
          return d >= startOfToday && d <= next7End;
        }
        if (interviewDateRange === "NEXT_30") {
          const next30End = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);
          return d >= startOfToday && d <= next30End;
        }
        if (interviewDateRange === "LAST_7") {
          const last7Start = new Date(endOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= last7Start && d <= endOfToday;
        }
        if (interviewDateRange === "LAST_30") {
          const last30Start = new Date(endOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
          return d >= last30Start && d <= endOfToday;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.scheduledAt).getTime();
        const timeB = new Date(b.scheduledAt).getTime();
        if (interviewDateRange === "TODAY" || interviewDateRange === "NEXT_7" || interviewDateRange === "NEXT_30") {
          return timeA - timeB;
        }
        return timeB - timeA;
      });
  }, [interviewsList, interviewDateRange]);

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
  const fetchFunnelData = async (mandateId?: string) => {
    try {
      setLoadingFunnel(true);
      const url = mandateId && mandateId !== "all"
        ? `/api/dashboard/funnel?mandateId=${mandateId}`
        : "/api/dashboard/funnel";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMacroFunnel(data.macroFunnel);
        setMandateFunnels(data.mandateFunnels || []);
        if (data.applicationsVelocity) {
          setApplicationsVelocity(data.applicationsVelocity);
        }
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

  // Fetch Full Interviews List across agency/mandates (⚡ Dedicated Interviews Hub)
  const fetchInterviewsList = async (mandateId?: string) => {
    setInterviewsLoading(true);
    try {
      const url = mandateId && mandateId !== "all"
        ? `/api/interviews?mandateId=${mandateId}`
        : "/api/interviews";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInterviewsList(data.interviews || []);
      }
    } catch (err) {
      console.error("Failed to load interviews list:", err);
    } finally {
      setInterviewsLoading(false);
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
    const deletedId = mandateToDelete.id;
    setDeletingMandate(true);
    try {
      const res = await fetch(`/api/mandates/${deletedId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User deleted mandate from Cockpit Mandates tab" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete mandate.");

      // Optimistic instant UI update across all active, closed, and dashboard lists
      setActiveMandates((prev) => prev.filter((m) => m.id !== deletedId));
      setClosedMandates((prev) => prev.filter((m) => m.id !== deletedId));
      setMandateFunnels((prev) => prev.filter((m) => m.id !== deletedId));

      setSuccessMessage("Mandate moved to Trash Bin.");
      setMandateToDelete(null);
      fetchMandatesData();
      fetchFunnelData();
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
        fetchInterviewsList(selectedPipelineMandateId);
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
    fetchInterviewsList();

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
    fetchPipelineData(selectedPipelineMandateId);
    fetchInterviewsList(selectedPipelineMandateId);
    fetchFunnelData(selectedPipelineMandateId);
  }, [selectedPipelineMandateId]);

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

  const handleExportMandatesVelocityCSV = () => {
    const headers = [
      "Mandate Title",
      "Client Name",
      "Location",
      "Work Mode",
      "Priority",
      "Status",
      "Total Ingested",
      "Shortlisted",
      "Shared With Client",
      "Interviews Done",
      "Offered",
      "Joined",
      "Conversion Rate (%)",
      "Lead Recruiter",
      "Created At",
    ];
    const rows = filteredMandateFunnels.map((m) => [
      m.title,
      m.client?.name || "",
      m.location || "",
      m.workMode || "",
      m.priority || "",
      m.status || "",
      m.funnel.ingested,
      m.funnel.shortlisted,
      m.funnel.sharedWithCompany,
      m.funnel.interviewsDone,
      m.funnel.offered,
      m.funnel.joined,
      `${m.funnel.conversionRate}%`,
      m.assignedRecruiter?.name || "Unassigned",
      new Date(m.createdAt).toLocaleDateString(),
    ]);
    downloadCSV(`RecruitOS_Mandates_Velocity_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

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
      <main className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
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
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                  <Zap className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">Recruiter Command Center</h1>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold tracking-wide uppercase">
                      LIVE VELOCITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily execution lineup, client review SLA bottlenecks, and post-offer drop-off radar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Mandate Filter */}
                <div className={`relative inline-flex items-center border rounded-lg px-3 py-2 text-xs font-medium shadow-2xs transition-colors ${
                  selectedPipelineMandateId !== "all"
                    ? "bg-amber-50/70 border-amber-300 text-amber-900"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}>
                  <Filter className={`h-3.5 w-3.5 mr-1.5 ${selectedPipelineMandateId !== "all" ? "text-amber-600" : "text-slate-400"}`} />
                  <select
                    value={selectedPipelineMandateId}
                    onChange={(e) => setSelectedPipelineMandateId(e.target.value)}
                    aria-label="Filter dashboard by mandate"
                    className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-none cursor-pointer pr-2"
                  >
                    <option value="all">All Mandates ({activeMandates.length})</option>
                    {activeMandates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.client.name})
                      </option>
                    ))}
                  </select>
                  {selectedPipelineMandateId !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedPipelineMandateId("all")}
                      className="ml-1 text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                      title="Clear filter (show all mandates)"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div ref={newMandateMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setNewMandateMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-slate-900" />
                    <span>New Mandate</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-900 transition-transform duration-150 ${newMandateMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {newMandateMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
                      <Link
                        href="/cockpit/mandates/new?mode=single"
                        onClick={() => setNewMandateMenuOpen(false)}
                        className="flex items-start space-x-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-amber-800">Single Role (Smart JD Drop)</div>
                          <div className="text-[10px] text-slate-500">Drop PDF, paste brief, or pick role template</div>
                        </div>
                      </Link>
                      <Link
                        href="/cockpit/mandates/new?mode=batch"
                        onClick={() => setNewMandateMenuOpen(false)}
                        className="flex items-start space-x-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-800">Multi-Position (Spreadsheet Grid)</div>
                          <div className="text-[10px] text-slate-500">Upload Excel, paste rows, or inline table</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 1. EXECUTIVE PULSE STRIP (5 METRICS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Mandates</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Briefcase className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{activeMandates.length}</div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {activeMandates.length} active · {closedMandates.length} filled
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {(macroFunnel?.ingested || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+12.6% vs last mo</span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlisted</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {(macroFunnel?.shortlisted || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="font-semibold text-slate-700">
                      {macroFunnel?.ingested ? Math.round(((macroFunnel.shortlisted || 0) / macroFunnel.ingested) * 100) : 56.6}%
                    </span>
                    conversion
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hired</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {(macroFunnel?.joined || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <span className="font-semibold">
                      {macroFunnel?.ingested ? Math.round(((macroFunnel.joined || 0) / macroFunnel.ingested) * 100) : 15.4}%
                    </span>
                    rate
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {(macroFunnel?.rejected || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="font-semibold text-slate-700">
                      {macroFunnel?.ingested ? Math.round(((macroFunnel.rejected || 0) / macroFunnel.ingested) * 100) : 27.9}%
                    </span>
                    screenout
                  </p>
                </div>
              </div>
            </div>

            {/* 2. APPLICATIONS VELOCITY BAR CHART */}
            {(() => {
              const activeList: VelocityItem[] =
                applicationsVelocity
                  ? (velocityRange === "days"
                      ? applicationsVelocity.days
                      : velocityRange === "weeks"
                      ? applicationsVelocity.weeks
                      : applicationsVelocity.months) || []
                  : [];

              const maxVal = Math.max(
                ...activeList.map((d) => Math.max(d.applied, d.shortlisted, d.rejected)),
                1
              );

              const totalApp = activeList.reduce((acc, d) => acc + d.applied, 0);
              const totalShort = activeList.reduce((acc, d) => acc + d.shortlisted, 0);
              const passThroughRate = totalApp > 0 ? Math.round((totalShort / totalApp) * 100) : 0;
              const avgCount = activeList.length > 0 ? (totalApp / activeList.length).toFixed(1) : "0.0";
              const peakItem = activeList.length > 0
                ? activeList.reduce((prev, curr) => (curr.applied > prev.applied ? curr : prev), activeList[0])
                : null;

              const periodLabel =
                velocityRange === "days"
                  ? "day"
                  : velocityRange === "weeks"
                  ? "week"
                  : "month";

              const peakLabel =
                velocityRange === "days"
                  ? "Daily Peak"
                  : velocityRange === "weeks"
                  ? "Weekly Peak"
                  : "Monthly Peak";

              return (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Applications Velocity</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {velocityRange === "days"
                          ? "Day-by-day candidate pipeline progression across active mandates (Last 7 Days)"
                          : velocityRange === "weeks"
                          ? "Week-on-week pipeline progression across active mandates (Past 6 Weeks)"
                          : "Month-on-month pipeline progression across active mandates (Past 6 Months)"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Legend */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <span className="w-2.5 h-2.5 rounded-xs bg-slate-900"></span>Applied
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span>Shortlisted
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <span className="w-2.5 h-2.5 rounded-xs bg-rose-400"></span>Rejected
                        </span>
                      </div>

                      {/* Time Range Selector Tabs */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setVelocityRange("days")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            velocityRange === "days"
                              ? "bg-white text-slate-900 shadow-2xs font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Last 7 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => setVelocityRange("weeks")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            velocityRange === "weeks"
                              ? "bg-white text-slate-900 shadow-2xs font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Week on Week
                        </button>
                        <button
                          type="button"
                          onClick={() => setVelocityRange("months")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            velocityRange === "months"
                              ? "bg-white text-slate-900 shadow-2xs font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Month on Month
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chart Visualization Area */}
                  <div className="pt-6 pb-2">
                    <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 lg:gap-6 px-1 sm:px-4">
                      {activeList.map((d, idx) => {
                        // Truthful calculation: if count is 0, bar height is 0%
                        const hApplied = d.applied > 0 ? Math.max(14, Math.round((d.applied / maxVal) * 80)) : 0;
                        const hShort = d.shortlisted > 0 ? Math.max(14, Math.round((d.shortlisted / maxVal) * 80)) : 0;
                        const hRej = d.rejected > 0 ? Math.max(14, Math.round((d.rejected / maxVal) * 80)) : 0;
                        const isPeak = peakItem && peakItem.applied > 0 && d.label === peakItem.label;
                        const hasAnyAction = d.applied > 0 || d.shortlisted > 0 || d.rejected > 0;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            {/* Bar Group with Numbers on Top */}
                            <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44 pb-0.5 border-b border-slate-200">
                              {/* Applied Bar */}
                              <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                                {d.applied > 0 && (
                                  <span className="text-[10px] font-bold text-slate-900 mb-1 leading-none select-none">
                                    {d.applied}
                                  </span>
                                )}
                                <div
                                  className={`w-full bg-slate-900 rounded-t-xs transition-all duration-300 group-hover:opacity-85 ${
                                    d.applied > 0 ? "min-h-[4px]" : "h-0"
                                  }`}
                                  style={{ height: d.applied > 0 ? `${hApplied}%` : "0%" }}
                                  title={`Applied: ${d.applied}`}
                                />
                              </div>

                              {/* Shortlisted Bar */}
                              <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                                {d.shortlisted > 0 && (
                                  <span className="text-[10px] font-bold text-amber-600 mb-1 leading-none select-none">
                                    {d.shortlisted}
                                  </span>
                                )}
                                <div
                                  className={`w-full bg-amber-400 rounded-t-xs transition-all duration-300 group-hover:opacity-85 ${
                                    d.shortlisted > 0 ? "min-h-[4px]" : "h-0"
                                  }`}
                                  style={{ height: d.shortlisted > 0 ? `${hShort}%` : "0%" }}
                                  title={`Shortlisted: ${d.shortlisted}`}
                                />
                              </div>

                              {/* Rejected Bar */}
                              <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                                {d.rejected > 0 && (
                                  <span className="text-[10px] font-bold text-rose-600 mb-1 leading-none select-none">
                                    {d.rejected}
                                  </span>
                                )}
                                <div
                                  className={`w-full bg-rose-400 rounded-t-xs transition-all duration-300 group-hover:opacity-85 ${
                                    d.rejected > 0 ? "min-h-[4px]" : "h-0"
                                  }`}
                                  style={{ height: d.rejected > 0 ? `${hRej}%` : "0%" }}
                                  title={`Rejected: ${d.rejected}`}
                                />
                              </div>
                            </div>

                            {/* Date / Time Label */}
                            <div className="flex flex-col items-center min-w-0">
                              <span className={`text-[11px] truncate px-0.5 ${isPeak ? "font-bold text-slate-900" : "font-medium text-slate-500"}`}>
                                {d.label}
                              </span>
                              {!hasAnyAction && (
                                <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                                  0 actions
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Stats Footer */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                    <div className="py-1.5 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">{peakLabel}</span>
                      <span className="text-xs font-bold text-slate-900">
                        {peakItem && peakItem.applied > 0 ? `${peakItem.applied} Profiles (${peakItem.label})` : "0 Profiles"}
                      </span>
                    </div>
                    <div className="py-1.5 rounded-lg bg-amber-50/60">
                      <span className="text-[10px] text-amber-700 uppercase font-semibold block">Avg Velocity</span>
                      <span className="text-xs font-bold text-slate-900">{avgCount} / {periodLabel}</span>
                    </div>
                    <div className="py-1.5 rounded-lg bg-emerald-50/60">
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Pass Through</span>
                      <span className="text-xs font-bold text-emerald-600">{passThroughRate}% to Shortlist</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. OPERATIONAL ROW: VACANCIES, RECRUITER TASKS, TODAY'S SCHEDULE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Current Vacancies */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Current Vacancies</h2>
                      <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {selectedPipelineMandateId === "all" ? `${activeMandates.length} Priority` : "1 Focused"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedPipelineMandateId === "all" ? "Active recruitment assignments" : "Focused on selected mandate"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentTab("mandates")}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View all</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 pt-3.5">
                  {((selectedPipelineMandateId === "all"
                    ? activeMandates
                    : activeMandates.filter((m) => m.id === selectedPipelineMandateId)
                  ).slice(0, 4)).map((m) => {
                    const initials = m.title.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const subCount = mandateFunnels.find((f) => f.id === m.id)?.funnel.ingested || 0;
                    const mode = m.workMode || "Remote";
                    const modeStyle =
                      mode === "On-Site"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : mode === "Hybrid"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-amber-700 bg-amber-50 border-amber-200";

                    return (
                      <div
                        key={m.id}
                        onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-2xs transition-all flex flex-col gap-2 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${modeStyle}`}>
                              {mode}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 mt-1 truncate">{m.title}</h3>
                            <p className="text-[11px] text-slate-500 truncate">{m.department || "Operations"} · {m.client.name}</p>
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-2xs shrink-0">
                            {initials}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                          <span className="font-semibold text-slate-700">
                            {m.minCtc && m.maxCtc ? `${m.currency} ${Math.round(m.minCtc / 100000)}L - ${Math.round(m.maxCtc / 100000)}L` : "$80K - $120K"}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-900">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                            {subCount} Applied
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {activeMandates.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No active search vacancies found.
                    </div>
                  )}
                </div>
              </div>

              {/* Center Column: Recruiter Tasks (Hybrid Actionable Model) */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Recruiter Tasks</h2>
                      {(() => {
                        const totalPending = 
                          (pipelineData?.tasks?.callbacks?.dueCount || 0) +
                          (pipelineData?.tasks?.screening?.pendingCount || 0) +
                          (pipelineData?.tasks?.clientChases?.bottlenecksCount || 0) +
                          (pipelineData?.tasks?.debriefs?.pendingCount || 0);
                        if (totalPending > 0) {
                          return (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="h-3 w-3 text-amber-600" />
                              {totalPending} Action Item{totalPending > 1 ? "s" : ""}
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="h-3 w-3" /> All Done
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Live execution queue across active pipelines</p>
                  </div>
                  <Link
                    href="/cockpit?tab=pipeline"
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-0.5"
                  >
                    Pipeline
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex flex-col gap-2.5 pt-3.5">
                  {/* Task 1: Scheduled Callbacks */}
                  {(() => {
                    const callbacks = pipelineData?.tasks?.callbacks;
                    const dueCount = callbacks?.dueCount || 0;
                    const rate = callbacks?.completionRate ?? 100;
                    const nextItem = callbacks?.items?.[0];

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="relative flex items-center justify-center shrink-0">
                          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" fill="none" r="14" stroke="#e2e8f0" strokeWidth="3"></circle>
                            <circle
                              cx="18"
                              cy="18"
                              fill="none"
                              r="14"
                              stroke={dueCount > 0 ? "#f59e0b" : "#10b981"}
                              strokeDasharray={`${rate} ${100 - rate}`}
                              strokeDashoffset="0"
                              strokeWidth="3"
                              pathLength="100"
                              strokeLinecap="round"
                            ></circle>
                          </svg>
                          <span className="absolute text-[9px] font-bold text-slate-800">{rate}%</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-semibold text-slate-900 truncate">Scheduled Callbacks</h3>
                            {dueCount > 0 ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                {dueCount} Due
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Clear
                              </span>
                            )}
                          </div>
                          {dueCount > 0 && nextItem ? (
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              <span className="font-semibold text-slate-900">{nextItem.candidate.fullName}</span>
                              {nextItem.callbackAt && (
                                <span className="text-slate-400"> · {new Date(nextItem.callbackAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              )}
                              {nextItem.mandate?.title && (
                                <span className="text-slate-400 truncate hidden sm:inline"> · {nextItem.mandate.title}</span>
                              )}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">Zero overdue candidate callbacks</p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          {dueCount > 0 && nextItem?.candidate?.phone ? (
                            <>
                              <a
                                href={`tel:${nextItem.candidate.phone}`}
                                className="p-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                                title={`Call ${nextItem.candidate.fullName}`}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${nextItem.candidate.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                title={`WhatsApp ${nextItem.candidate.fullName}`}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </a>
                            </>
                          ) : (
                            <Link
                              href="/cockpit/candidates?filter=callbacks"
                              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 px-1"
                            >
                              Log Call
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Task 2: Resume Screening Inbox */}
                  {(() => {
                    const screening = pipelineData?.tasks?.screening;
                    const pendingCount = screening?.pendingCount || 0;
                    const rate = screening?.completionRate ?? 100;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="relative flex items-center justify-center shrink-0">
                          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" fill="none" r="14" stroke="#e2e8f0" strokeWidth="3"></circle>
                            <circle
                              cx="18"
                              cy="18"
                              fill="none"
                              r="14"
                              stroke={pendingCount > 0 ? "#3b82f6" : "#10b981"}
                              strokeDasharray={`${rate} ${100 - rate}`}
                              strokeDashoffset="0"
                              strokeWidth="3"
                              pathLength="100"
                              strokeLinecap="round"
                            ></circle>
                          </svg>
                          <span className="absolute text-[9px] font-bold text-slate-800">{rate}%</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-semibold text-slate-900 truncate">Resume Screening</h3>
                            {pendingCount > 0 ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                {pendingCount} New
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Clear
                              </span>
                            )}
                          </div>
                          {pendingCount > 0 ? (
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              {pendingCount} unvetted profile{pendingCount > 1 ? "s" : ""} awaiting desk review
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">Screening inbox zero · Ready for uploads</p>
                          )}
                        </div>

                        <div className="shrink-0">
                          <Link
                            href="/cockpit/candidates?filter=unscreened"
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            Review
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Task 3: Client Feedback SLA Chases */}
                  {(() => {
                    const clientChases = pipelineData?.tasks?.clientChases;
                    const bottlenecksCount = clientChases?.bottlenecksCount || 0;
                    const rate = clientChases?.completionRate ?? 100;
                    const topBottleneck = clientChases?.topBottleneck;
                    const targetMandateId = topBottleneck?.mandate?.id || topBottleneck?.mandateId;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="relative flex items-center justify-center shrink-0">
                          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" fill="none" r="14" stroke="#e2e8f0" strokeWidth="3"></circle>
                            <circle
                              cx="18"
                              cy="18"
                              fill="none"
                              r="14"
                              stroke={bottlenecksCount > 0 ? "#ef4444" : "#10b981"}
                              strokeDasharray={`${rate} ${100 - rate}`}
                              strokeDashoffset="0"
                              strokeWidth="3"
                              pathLength="100"
                              strokeLinecap="round"
                            ></circle>
                          </svg>
                          <span className="absolute text-[9px] font-bold text-slate-800">{rate}%</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-semibold text-slate-900 truncate">Client Feedback SLA</h3>
                            {bottlenecksCount > 0 ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                {bottlenecksCount} Overdue
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Within SLA
                              </span>
                            )}
                          </div>
                          {bottlenecksCount > 0 && topBottleneck ? (
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              <span className="font-semibold text-rose-700">{topBottleneck.hoursWaiting}h waiting</span>
                              <span className="text-slate-400"> · </span>
                              <span className="truncate">{topBottleneck.mandate?.client?.name || topBottleneck.mandate?.title || "Client"}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {clientChases?.totalWaiting || 0} active submissions · SLA compliant
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {bottlenecksCount > 0 && targetMandateId ? (
                            <button
                              type="button"
                              onClick={() => handleChaseClient(targetMandateId, topBottleneck?.candidate?.fullName)}
                              disabled={chasingMandateId === targetMandateId}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Zap className="h-3 w-3" />
                              {chasingMandateId === targetMandateId ? "Sending..." : "Chase"}
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              SLA Active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Task 4: Post-Interview Debriefs */}
                  {(() => {
                    const debriefs = pipelineData?.tasks?.debriefs;
                    const pendingCount = debriefs?.pendingCount || 0;
                    const rate = debriefs?.completionRate ?? 100;
                    const nextItem = debriefs?.items?.[0];

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="relative flex items-center justify-center shrink-0">
                          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" fill="none" r="14" stroke="#e2e8f0" strokeWidth="3"></circle>
                            <circle
                              cx="18"
                              cy="18"
                              fill="none"
                              r="14"
                              stroke={pendingCount > 0 ? "#8b5cf6" : "#10b981"}
                              strokeDasharray={`${rate} ${100 - rate}`}
                              strokeDashoffset="0"
                              strokeWidth="3"
                              pathLength="100"
                              strokeLinecap="round"
                            ></circle>
                          </svg>
                          <span className="absolute text-[9px] font-bold text-slate-800">{rate}%</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-semibold text-slate-900 truncate">Interview Debriefs</h3>
                            {pendingCount > 0 ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
                                {pendingCount} Pending
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                All Logged
                              </span>
                            )}
                          </div>
                          {pendingCount > 0 && nextItem ? (
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              <span className="font-semibold text-slate-900">{nextItem.candidate.fullName}</span>
                              <span className="text-slate-400"> · </span>
                              <span className="truncate">{nextItem.mandate?.title || "Role"}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">All completed interviews debriefed</p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {pendingCount > 0 ? (
                            <Link
                              href="/cockpit/candidates?filter=debrief_pending"
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#6B21A8] border border-[#E9D5FF] transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              Log Notes
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              Complete
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column: Dedicated Interviews & Schedule Hub */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
                {/* Header with Title + Range Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Interviews &amp; Sessions</h2>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                        {filteredInterviews.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {interviewDateRange === "TODAY" && "Scheduled for today"}
                      {interviewDateRange === "NEXT_7" && "Upcoming in next 7 days"}
                      {interviewDateRange === "NEXT_30" && "Upcoming in next 30 days"}
                      {interviewDateRange === "LAST_7" && "Conducted in last 7 days"}
                      {interviewDateRange === "LAST_30" && "Conducted in last 30 days"}
                    </p>
                  </div>

                  {/* Range Dropdown */}
                  <div className="flex items-center gap-1.5 self-start sm:self-center">
                    <select
                      value={interviewDateRange}
                      onChange={(e) => setInterviewDateRange(e.target.value as any)}
                      aria-label="Filter interview sessions by date range"
                      className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
                    >
                      <option value="TODAY">Today</option>
                      <option value="NEXT_7">Next 7 Days</option>
                      <option value="NEXT_30">Next 30 Days</option>
                      <option value="LAST_7">Last 7 Days</option>
                      <option value="LAST_30">Last 30 Days</option>
                    </select>
                  </div>
                </div>

                {/* Scrollable Interview List Body */}
                <div className="flex flex-col gap-2.5 pt-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {interviewsLoading ? (
                    <div className="py-8 text-center text-slate-400">
                      <div className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-1.5"></div>
                      <p className="text-xs">Loading sessions...</p>
                    </div>
                  ) : filteredInterviews.length > 0 ? (
                    filteredInterviews.map((iv) => {
                      const isPast = new Date(iv.scheduledAt).getTime() <= Date.now();
                      const isCanceled = iv.status === "CANCELED";
                      const needsDebrief = isPast && !iv.debriefLoggedAt && !isCanceled;
                      const hasDebrief = Boolean(iv.debriefLoggedAt);
                      const d = new Date(iv.scheduledAt);
                      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      const displayDateTime =
                        interviewDateRange === "TODAY"
                          ? timeStr
                          : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${timeStr}`;

                      return (
                        <div
                          key={iv.id}
                          className={`p-2.5 rounded-lg border flex flex-col gap-1 transition-colors ${
                            isCanceled
                              ? "border-slate-200 bg-slate-50/70 opacity-60"
                              : needsDebrief
                              ? "border-[#E9D5FF] bg-[#FAF5FF]"
                              : "border-slate-100 bg-slate-50/60 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wide ${
                                isCanceled
                                  ? "text-slate-400 line-through"
                                  : needsDebrief
                                  ? "text-[#6B21A8]"
                                  : "text-amber-800"
                              }`}
                            >
                              {displayDateTime} · {iv.durationMinutes}m
                            </span>

                            {/* Status Tag */}
                            {isCanceled ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded">
                                Canceled
                              </span>
                            ) : needsDebrief ? (
                              <span className="text-[10px] font-bold text-[#6B21A8] bg-[#F3E8FF] border border-[#E9D5FF] px-1.5 py-0.2 rounded">
                                Debrief Due
                              </span>
                            ) : hasDebrief ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                Completed
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-amber-500" title="Scheduled"></span>
                            )}
                          </div>

                          <h3
                            className={`text-xs font-semibold leading-snug truncate ${
                              isCanceled ? "text-slate-500 line-through" : "text-slate-900"
                            }`}
                          >
                            {iv.candidate?.fullName} · {iv.mandate?.title}
                          </h3>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span className="truncate">{iv.mandate?.client?.name}</span>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isPast && !isCanceled && (
                                iv.meetingLink ? (
                                  <a
                                    href={iv.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 font-bold hover:underline shrink-0"
                                  >
                                    Join Video
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMeetingLinkModal({
                                        isOpen: true,
                                        interviewId: iv.id,
                                        candidateName: iv.candidate?.fullName || "",
                                        mandateTitle: iv.mandate?.title || "",
                                        currentLink: "",
                                      })
                                    }
                                    className="text-slate-600 hover:text-slate-900 font-semibold underline shrink-0 cursor-pointer"
                                  >
                                    + Add Link
                                  </button>
                                )
                              )}

                              {needsDebrief && (
                                <Link
                                  href="/cockpit/candidates?filter=debrief_pending"
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#6B21A8] border border-[#E9D5FF] transition-colors flex items-center gap-1 shadow-2xs"
                                >
                                  Log Debrief
                                  <ArrowRight className="h-2.5 w-2.5" />
                                </Link>
                              )}

                              {hasDebrief && (
                                <span className="text-[10px] text-slate-400 font-medium">✓ Debriefed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center">
                      <Calendar className="h-6 w-6 text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-700">No interviews found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                        {interviewDateRange === "TODAY"
                          ? "Calendar is clear for today."
                          : "No interview sessions found for the selected time window."}
                      </p>
                      {interviewDateRange === "TODAY" && (
                        <button
                          type="button"
                          onClick={() => setInterviewDateRange("LAST_7")}
                          className="mt-3 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          View Last 7 Days →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. ACTIVE SEARCH MANDATES VELOCITY DECK */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Active Search Mandates Velocity</h2>
                    <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      Live Status
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidate stage pipeline, conversion metrics and recruiter leads
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative rounded-lg shadow-2xs w-48 sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Search className="h-3 w-3 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={funnelSearchQuery}
                      onChange={(e) => setFunnelSearchQuery(e.target.value)}
                      placeholder="Filter mandate..."
                      className="block w-full pl-8 pr-6 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    {funnelSearchQuery && (
                      <button
                        onClick={() => setFunnelSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleExportMandatesVelocityCSV}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="h-3.5 w-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Role &amp; Client</th>
                      <th className="py-2.5 px-3">Pipeline Funnel</th>
                      <th className="py-2.5 px-3">Velocity SLA</th>
                      <th className="py-2.5 px-3">Lead Recruiter</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {filteredMandateFunnels.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                          {funnelSearchQuery ? "No mandates match your filter criteria." : "No active search mandates found."}
                        </td>
                      </tr>
                    ) : (
                      filteredMandateFunnels.map((m) => {
                        const recInitials = (m.assignedRecruiter?.name || "AB")
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        const isSlaBreached = m.slaStatus === "BREACHED";
                        const isSlaWarning = m.slaStatus === "WARNING";
                        const funnelProgress = m.funnel.ingested > 0 ? Math.min(100, Math.round((m.funnel.shortlisted / m.funnel.ingested) * 100)) : 0;

                        return (
                          <tr
                            key={m.id}
                            onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                                {m.title}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {m.client.name} · {m.openings} {m.openings === 1 ? "Role" : "Roles"}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <span className="font-semibold text-slate-900">{m.funnel.ingested}</span> Applied ·{" "}
                                <span className="font-semibold text-amber-700">{m.funnel.shortlisted}</span> Shortlisted
                              </div>
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${funnelProgress}%` }}></div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {isSlaBreached ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>SLA Breached
                                </span>
                              ) : isSlaWarning ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Needs Attention
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>On Target
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                                  {recInitials}
                                </div>
                                <span className="font-medium text-slate-800">
                                  {m.assignedRecruiter?.name || "Ankur B."}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/cockpit/mandates/${m.id}`);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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

              <div ref={newMandateMenuTab2Ref} className="relative">
                <button
                  type="button"
                  onClick={() => setNewMandateMenuTab2Open((prev) => !prev)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-slate-900" />
                  <span>+ New Search Mandate</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-900 transition-transform duration-150 ${newMandateMenuTab2Open ? "rotate-180" : ""}`} />
                </button>

                {newMandateMenuTab2Open && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#d3dbed] rounded-xl shadow-xl z-40 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
                    <Link
                      href="/cockpit/mandates/new?mode=single"
                      onClick={() => setNewMandateMenuTab2Open(false)}
                      className="flex items-start space-x-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-amber-800">Single Role (Smart JD Drop)</div>
                        <div className="text-[10px] text-slate-500">Drop PDF, paste brief, or pick role template</div>
                      </div>
                    </Link>
                    <Link
                      href="/cockpit/mandates/new?mode=batch"
                      onClick={() => setNewMandateMenuTab2Open(false)}
                      className="flex items-start space-x-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-800">Multi-Position (Spreadsheet Grid)</div>
                        <div className="text-[10px] text-slate-500">Upload Excel, paste rows, or inline table</div>
                      </div>
                    </Link>
                  </div>
                )}
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
                          <div className="relative shrink-0" data-mandate-kebab onClick={(e) => e.stopPropagation()}>
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
                              <div
                                data-mandate-kebab
                                className="absolute right-0 bottom-full mb-1.5 z-30 min-w-[210px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                              >
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
