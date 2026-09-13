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

export default function CockpitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isManagement = userRole === "AGENCY_OWNER" || userRole === "TEAM_LEAD";

  // Navigation State (Solo Owner Micro-Nav Architecture)
  const [currentTab, setCurrentTab] = useState<"dashboard" | "pipeline" | "mandates">("dashboard");

  // Pipeline State (Tab: ⚡ Pipeline)
  const [pipelineData, setPipelineData] = useState<{
    interviewsToday: PipelineInterview[];
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
      slaComplianceRate: number;
      breachedCount: number;
      warningCount: number;
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
  const [inboundMandates, setInboundMandates] = useState<InboundMandate[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");

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
      const mandatesRes = await fetch(`/api/mandates?scope=${scopeFilter}`);
      if (mandatesRes.ok) {
        const data = await mandatesRes.json();
        setActiveMandates(data.mandates || []);
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

  const filteredActiveMandates = activeMandates.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.client.name.toLowerCase().includes(q) ||
      (m.location && m.location.toLowerCase().includes(q))
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
        {/* TAB 1: DASHBOARD (CANDIDATE FUNNEL OPERATIONS - MACRO & MANDATE-WISE)     */}
        {/* ========================================================================= */}
        {currentTab === "dashboard" && (
          <div className="space-y-6">
            {/* Dashboard Header Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="h-10 w-10 rounded-xl bg-[#fce17c] border border-[#f5d762] flex items-center justify-center text-slate-900 shadow-xs flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base font-black text-slate-900 tracking-tight">Agency Executive Pipeline & Funnel Radar</h1>
                    <span className="bg-[#fce17c]/30 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded border border-[#f5d762] uppercase tracking-wide">
                      RC-03 Velocity Radar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Macro candidate velocity across all active mandates and micro conversion progression metrics.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsOfflineModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#fce17c] hover:bg-[#ebd066] border border-[#f5d762] text-slate-900 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-slate-900" />
                  <span>+ New Search Mandate</span>
                </button>
              </div>
            </div>

            {/* TOP 4 MACRO KPI RADAR CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Ingested */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Ingested</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loadingFunnel ? "..." : (macroFunnel?.ingested || 0)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Candidates in raw pipeline</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              {/* Card 2: In-Flight Evaluation */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Active In-Flight</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loadingFunnel ? "..." : ((macroFunnel?.shortlisted || 0) + (macroFunnel?.sharedWithCompany || 0) + (macroFunnel?.selectedForInterview || 0) + (macroFunnel?.interviewsDone || 0))}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Screening to Interviews</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <Filter className="h-5 w-5" />
                </div>
              </div>

              {/* Card 3: Decisions & Offers */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Decisions & Offers</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loadingFunnel ? "..." : ((macroFunnel?.selected || 0) + (macroFunnel?.offered || 0))}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Final selection & pre-lock</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Flame className="h-5 w-5" />
                </div>
              </div>

              {/* Card 4: Placements Secured */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Placements Secured</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {loadingFunnel ? "..." : (macroFunnel?.joined || 0)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-extrabold">
                    {macroFunnel ? `${macroFunnel.conversionRate}% Conversion Rate` : "0% Conversion Rate"}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* SECTION A: MACRO CANDIDATE FUNNEL BANNER (8 Interconnected Pipeline Stages) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-amber-500" />
                  </div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    A. Aggregate Candidate Conversion Pipeline (All Mandates)
                  </h2>
                </div>
                {macroFunnel && (
                  <span className="inline-flex items-center space-x-1.5 text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 w-fit">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Overall Placement Rate: {macroFunnel.conversionRate}%</span>
                  </span>
                )}
              </div>

              {loadingFunnel ? (
                <div className="py-12 text-center text-slate-400 text-xs">Computing real-time pipeline funnel...</div>
              ) : macroFunnel ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {/* Stage 1: Ingested */}
                  <div className="bg-[#fce17c]/10 border border-[#fce17c]/70 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="bg-[#fce17c] text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-[#f5d762] uppercase tracking-wide inline-block">
                        1. Ingested
                      </span>
                      <div className="text-2xl font-black text-slate-900 mt-2">{macroFunnel.ingested}</div>
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold block mt-2">Raw Sourced</span>
                  </div>

                  {/* Stage 2: Shortlisted */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="bg-slate-200/80 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-300 uppercase tracking-wide inline-block">
                        2. Shortlisted
                      </span>
                      <div className="text-2xl font-black text-slate-800 mt-2">{macroFunnel.shortlisted}</div>
                    </div>
                    <span className="text-[10px] text-slate-600 font-extrabold block mt-2">
                      {macroFunnel.ingested > 0 ? `${Math.round((macroFunnel.shortlisted / macroFunnel.ingested) * 100)}% pass` : "0% pass"}
                    </span>
                  </div>

                  {/* Stage 3: Shared with Company */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-300 uppercase tracking-wide inline-block">
                        3. Shared w/ Client
                      </span>
                      <div className="text-2xl font-black text-blue-950 mt-2">{macroFunnel.sharedWithCompany}</div>
                    </div>
                    <span className="text-[10px] text-blue-600 font-extrabold block mt-2">
                      {macroFunnel.shortlisted > 0 ? `${Math.round((macroFunnel.sharedWithCompany / macroFunnel.shortlisted) * 100)}% pass` : "0% pass"}
                    </span>
                  </div>

                  {/* Stage 4: Selected for Interview */}
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-300 uppercase tracking-wide inline-block">
                        4. Interview Selected
                      </span>
                      <div className="text-2xl font-black text-purple-950 mt-2">{macroFunnel.selectedForInterview}</div>
                    </div>
                    <span className="text-[10px] text-purple-600 font-extrabold block mt-2">
                      {macroFunnel.sharedWithCompany > 0 ? `${Math.round((macroFunnel.selectedForInterview / macroFunnel.sharedWithCompany) * 100)}% pass` : "Client Approved"}
                    </span>
                  </div>

                  {/* Stage 5: Interviews Done */}
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-300 uppercase tracking-wide inline-block">
                        5. Interviews Done
                      </span>
                      <div className="text-2xl font-black text-indigo-950 mt-2">{macroFunnel.interviewsDone}</div>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-extrabold block mt-2">
                      {macroFunnel.selectedForInterview > 0 ? `${Math.round((macroFunnel.interviewsDone / macroFunnel.selectedForInterview) * 100)}% debriefed` : "Debriefed"}
                    </span>
                  </div>

                  {/* Stage 6: Selected */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 uppercase tracking-wide inline-block">
                        6. Selected
                      </span>
                      <div className="text-2xl font-black text-amber-950 mt-2">{macroFunnel.selected}</div>
                    </div>
                    <span className="text-[10px] text-amber-700 font-extrabold block mt-2">Final Choice</span>
                  </div>

                  {/* Stage 7: Offered */}
                  <div className="bg-fuchsia-50/70 border border-fuchsia-200 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="bg-fuchsia-100 text-fuchsia-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-fuchsia-300 uppercase tracking-wide inline-block">
                        7. Offered
                      </span>
                      <div className="text-2xl font-black text-fuchsia-950 mt-2">{macroFunnel.offered}</div>
                    </div>
                    <span className="text-[10px] text-fuchsia-700 font-extrabold block mt-2">Offer Locked</span>
                  </div>

                  {/* Stage 8: Joined */}
                  <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-xl p-3.5 text-center relative flex flex-col justify-between shadow-xs">
                    <div>
                      <span className="bg-emerald-200/90 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400 uppercase tracking-wide inline-block">
                        8. Joined
                      </span>
                      <div className="text-2xl font-black text-emerald-950 mt-2">{macroFunnel.joined}</div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-black block mt-2">Hired & Billed</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">No active funnel data available.</div>
              )}
            </div>

            {/* SECTION B: MANDATE-WISE CANDIDATE CONVERSION RADAR */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-slate-700" />
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      B. Active Mandate Conversion Radar & Drop-off Diagnostics
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Micro candidate distribution across each search mandate's 8 stages.
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
                <div className="py-12 text-center text-slate-400 text-xs">Loading mandate breakdown...</div>
              ) : filteredMandateFunnels.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {funnelSearchQuery ? "No mandates match your filter criteria." : "No active mandates found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-black text-slate-600 uppercase tracking-wider">Mandate / Client</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">1. Ingested</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">2. Shortlisted</th>
                        <th className="px-3 py-3 text-center font-bold text-blue-700 uppercase tracking-wider">3. Shared</th>
                        <th className="px-3 py-3 text-center font-bold text-purple-700 uppercase tracking-wider">4. Interview</th>
                        <th className="px-3 py-3 text-center font-bold text-indigo-700 uppercase tracking-wider">5. Debrief</th>
                        <th className="px-3 py-3 text-center font-bold text-amber-800 uppercase tracking-wider">6. Selected</th>
                        <th className="px-3 py-3 text-center font-bold text-fuchsia-800 uppercase tracking-wider">7. Offered</th>
                        <th className="px-3 py-3 text-center font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50/50">8. Joined</th>
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

                          {/* 1. Ingested */}
                          <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                            {m.funnel.ingested > 0 ? (
                              <span>{m.funnel.ingested}</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 2. Shortlisted */}
                          <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                            {m.funnel.shortlisted > 0 ? (
                              <span>{m.funnel.shortlisted}</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 3. Shared */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.sharedWithCompany > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                                {m.funnel.sharedWithCompany}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 4. Interview Selected */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.selectedForInterview > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                                {m.funnel.selectedForInterview}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 5. Interviews Done */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.interviewsDone > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                                {m.funnel.interviewsDone}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 6. Selected */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.selected > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                                {m.funnel.selected}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 7. Offered */}
                          <td className="px-3 py-3.5 text-center">
                            {m.funnel.offered > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-black bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300">
                                {m.funnel.offered}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          {/* 8. Joined */}
                          <td className="px-3 py-3.5 text-center bg-emerald-50/40 border-l border-r border-emerald-100">
                            {m.funnel.joined > 0 ? (
                              <span className="inline-flex items-center justify-center min-w-[24px] px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
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
        {/* TAB: PIPELINE (DAILY LINEUP & 3-COLUMN TACTICAL SLA KANBAN)               */}
        {/* ========================================================================= */}
        {currentTab === "pipeline" && (
          <div className="space-y-6 animate-in fade-in duration-150">
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

            {/* Pipeline Header Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs flex-shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Tactical SLA Pipeline</h1>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-200">
                      LIVE EXECUTION
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Today's interview lineup and 3-stage candidate throughput with strict 48h client feedback SLA enforcement.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
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

                {/* SLA Compliance Pill */}
                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{pipelineData?.stats?.slaComplianceRate ?? 100}% SLA Healthy</span>
                </div>

                {/* Today Date Pill */}
                <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Today's Interview Lineup */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-700" />
                  <h2 className="text-sm font-black text-slate-900">Today's Interview Lineup</h2>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-200">
                    {pipelineData?.interviewsToday?.length || 0} Scheduled
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Scenario B: Custom Meeting Links Enabled</span>
              </div>

              {pipelineLoading ? (
                <div className="py-8 flex items-center justify-center space-x-2 text-slate-400 text-xs font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  <span>Loading today's schedule...</span>
                </div>
              ) : !pipelineData?.interviewsToday || pipelineData.interviewsToday.length === 0 ? (
                <div className="py-8 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
                  <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No interviews scheduled for today</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">When candidates confirm interview slots via WhatsApp, they appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pipelineData.interviewsToday.map((iv) => {
                    const timeStr = new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const hasLink = !!iv.meetingLink;
                    return (
                      <div key={iv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
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
                              <span>⚠️ Link Needed</span>
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
                              {hasLink ? "Edit Link" : "+ Attach Link"}
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
              )}
            </div>

            {/* Section 2: 3-Column Tactical SLA Kanban */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Column 1: Screened (<24h) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 flex flex-col space-y-3 min-h-[500px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Screened</h3>
                    <span className="text-[10px] text-slate-400 font-bold">&lt;24h</span>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                    {pipelineData?.columns.screened?.length || 0}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Vetted candidates ready for client presentation.</p>

                <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[600px] pr-1">
                  {!pipelineData?.columns.screened || pipelineData.columns.screened.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-medium">
                      No screened candidates awaiting submission.
                    </div>
                  ) : (
                    pipelineData.columns.screened.map((c) => (
                      <div key={c.id} className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{c.candidate.fullName}</h4>
                            <p className="text-[11px] text-slate-600 font-medium">{c.candidate.currentTitle || "Profile"}</p>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                            {c.candidate.totalExpYears}y exp
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          Mandate: <span className="font-bold text-slate-700">{c.mandate.title}</span> ({c.mandate.client.name})
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                          <span>{c.candidate.expectedCtc ? `${c.candidate.currency} ${c.candidate.expectedCtc.toLocaleString()}` : "CTC not set"}</span>
                          <span className="font-semibold text-slate-500">{c.candidate.noticePeriodDays}d Notice</span>
                        </div>
                        {c.candidate.skills && c.candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {c.candidate.skills.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-50 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                                {s}
                              </span>
                            ))}
                            {c.candidate.skills.length > 3 && (
                              <span className="text-[9px] text-slate-400 font-semibold">+{c.candidate.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className="pt-1.5 flex justify-end">
                          <button
                            onClick={() => router.push(`/cockpit/mandates/${c.mandate.id}`)}
                            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                          >
                            View in Mandate →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Submitted to Client (<48h SLA) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 flex flex-col space-y-3 min-h-[500px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Submitted to Client</h3>
                    <span className="text-[10px] text-amber-700 font-bold">&lt;48h SLA</span>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                    {pipelineData?.columns.submitted?.length || 0}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Awaiting client review with automated 48h SLA tracking.</p>

                <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[600px] pr-1">
                  {!pipelineData?.columns.submitted || pipelineData.columns.submitted.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-medium">
                      No candidates currently in client review.
                    </div>
                  ) : (
                    pipelineData.columns.submitted.map((c) => {
                      const isBreached = c.slaStatus === "BREACHED";
                      const isWarning = c.slaStatus === "WARNING";
                      return (
                        <div
                          key={c.id}
                          className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                            isBreached
                              ? "bg-rose-50/50 border-rose-400 ring-2 ring-rose-200 shadow-xs"
                              : isWarning
                              ? "bg-amber-50/40 border-amber-300 shadow-2xs"
                              : "bg-white border-slate-200/90 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{c.candidate.fullName}</h4>
                              <p className="text-[11px] text-slate-600 font-medium">{c.candidate.currentTitle || "Profile"}</p>
                            </div>
                            {/* SLA Status Pill */}
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                                isBreached
                                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                                  : isWarning
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-emerald-100 text-emerald-900 border-emerald-200"
                              }`}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              <span>
                                {isBreached
                                  ? `BREACHED (${c.hoursWaiting}h)`
                                  : isWarning
                                  ? `48h Warning (${c.hoursWaiting}h)`
                                  : `SLA OK (${c.hoursWaiting}h)`}
                              </span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-medium truncate">
                            Client: <span className="font-bold text-slate-700">{c.mandate.client.name}</span> • {c.mandate.title}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                            <span>{c.candidate.noticePeriodDays}d Notice</span>
                            <span className="text-[10px] text-slate-400">
                              Submitted {c.submittedToClientAt ? new Date(c.submittedToClientAt).toLocaleDateString() : "recently"}
                            </span>
                          </div>

                          {/* Action Bar */}
                          <div className="pt-1.5 flex items-center justify-between">
                            <button
                              onClick={() => router.push(`/cockpit/mandates/${c.mandate.id}`)}
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                            >
                              View Mandate
                            </button>

                            {(isBreached || isWarning) && (
                              <button
                                onClick={() => handleChaseClient(c.mandate.id, c.candidate.fullName)}
                                disabled={chasingMandateId === c.mandate.id}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs ${
                                  isBreached
                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : "bg-amber-500 hover:bg-amber-600 text-slate-900"
                                }`}
                              >
                                {chasingMandateId === c.mandate.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Zap className="h-3 w-3" />
                                )}
                                <span>{isBreached ? "⚡ Chase Client Now" : "⚡ Remind Client"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Column 3: Interviewing (<24h debrief) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 flex flex-col space-y-3 min-h-[500px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Interviewing</h3>
                    <span className="text-[10px] text-blue-700 font-bold">&lt;24h Debrief</span>
                  </div>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                    {pipelineData?.columns.interviewing?.length || 0}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Candidate interviews in progress and debrief tracking.</p>

                <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[600px] pr-1">
                  {!pipelineData?.columns.interviewing || pipelineData.columns.interviewing.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-medium">
                      No active interviews currently running.
                    </div>
                  ) : (
                    pipelineData.columns.interviewing.map((c) => {
                      const latestIv = c.interviews && c.interviews.length > 0 ? c.interviews[0] : null;
                      const isScheduled = latestIv?.status === "SCHEDULED";
                      const isCompleted = latestIv?.status === "COMPLETED";
                      return (
                        <div key={c.id} className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{c.candidate.fullName}</h4>
                              <p className="text-[11px] text-slate-600 font-medium">{c.candidate.currentTitle || "Profile"}</p>
                            </div>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                isCompleted
                                  ? "bg-purple-100 text-purple-900 border-purple-200"
                                  : isScheduled
                                  ? "bg-blue-100 text-blue-900 border-blue-200"
                                  : "bg-emerald-100 text-emerald-900 border-emerald-200"
                              }`}
                            >
                              {isCompleted ? "Debrief Pending" : isScheduled ? "Slot Locked" : "Shortlisted"}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-medium truncate">
                            Mandate: <span className="font-bold text-slate-700">{c.mandate.title}</span> ({c.mandate.client.name})
                          </div>

                          {latestIv && (
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                              <div className="flex items-center justify-between font-bold text-slate-700">
                                <span>{latestIv.interviewType.replace(/_/g, " ")}</span>
                                <span>{new Date(latestIv.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                                <span>Time: {new Date(latestIv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{latestIv.meetingLink ? "Link Attached ✓" : "⚠️ Link Needed"}</span>
                              </div>
                            </div>
                          )}

                          <div className="pt-1.5 flex items-center justify-between">
                            <button
                              onClick={() => router.push(`/cockpit/mandates/${c.mandate.id}`)}
                              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                            >
                              Open Workspace →
                            </button>
                            {latestIv && !latestIv.meetingLink && (
                              <button
                                onClick={() => {
                                  setMeetingLinkModal({
                                    isOpen: true,
                                    interviewId: latestIv.id,
                                    candidateName: c.candidate.fullName,
                                    mandateTitle: c.mandate.title,
                                    currentLink: "",
                                  });
                                  setMeetingLinkInput("");
                                }}
                                className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                              >
                                + Attach Link
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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

            {/* Active Mandates List with 72h SLA Radar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
                <div className="relative rounded-lg shadow-sm flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mandate title, company, skills..."
                    className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
                  />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing <strong>{filteredActiveMandates.length}</strong> active searches
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading active mandates...</div>
              ) : filteredActiveMandates.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No active search mandates found.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredActiveMandates.map((m) => {
                    const slaBadgeColors = {
                      HEALTHY: "bg-emerald-100 text-emerald-800 border-emerald-300",
                      WARNING: "bg-amber-100 text-amber-800 border-amber-300",
                      BREACHED: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
                    };

                    return (
                      <div
                        key={m.id}
                        onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                        className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                              {m.title}
                            </h3>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                              {m.client.name}
                            </span>
                            {m.hasShortlistSubmitted ? (
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                m.calculatedSlaStatus === "BREACHED"
                                  ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                                  : m.calculatedSlaStatus === "WARNING"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-blue-100 text-blue-800 border-blue-300"
                              }`}>
                                Client Review SLA: {m.calculatedSlaStatus} ({m.hoursInStage}h / {m.slaTargetHours}h)
                              </span>
                            ) : (
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${slaBadgeColors[m.calculatedSlaStatus]}`}>
                                Sourcing SLA: {m.calculatedSlaStatus} ({m.hoursInStage}h / {m.slaTargetHours}h)
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            <span>{m.location || "Hybrid"}</span>
                            <span>•</span>
                            <span>Exp: <strong>{m.minExp && m.maxExp ? `${m.minExp}-${m.maxExp} yrs` : m.minExp ? `${m.minExp}+ yrs` : "Any"}</strong></span>
                            {(m.minCtc || m.maxCtc) ? (
                              <>
                                <span>•</span>
                                <span>CTC: <strong>{(m.minCtc ? `${(m.minCtc / 100000).toFixed(0)}L` : "") + (m.minCtc && m.maxCtc ? " - " : "") + (m.maxCtc ? `${(m.maxCtc / 100000).toFixed(0)}L` : "")}</strong></span>
                              </>
                            ) : null}
                            <span>•</span>
                            <span>Fee: <strong>{m.feePercentage}%</strong></span>
                            <span>•</span>
                            <span>Guarantee: <strong>{m.guaranteeDays}d</strong></span>
                            <span>•</span>
                            <span>Desk Lead: <strong>{m.assignedRecruiter?.name || "Solo Owner"}</strong></span>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {m.skills.slice(0, 4).map((skill, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                            {m.skills.length > 4 && (
                              <span className="text-[10px] text-slate-400">+{m.skills.length - 4}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions Suite */}
                        <div className="flex items-center space-x-2 flex-wrap gap-y-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenSilverMatches(m)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            <Zap className="h-3.5 w-3.5 text-amber-700" />
                            <span>Silver Matches</span>
                          </button>

                          <button
                            onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>{m.hasShortlistSubmitted ? "Shared with Client" : "Submit to Client"}</span>
                          </button>

                          <button
                            onClick={() => handleOpenDistribution(m)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            <Share2 className="h-3.5 w-3.5 text-slate-600" />
                            <span>Distribution</span>
                          </button>

                          <button
                            onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-brand-surfaceLight hover:bg-brand-surface border border-brand-surfaceDark text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            <Briefcase className="h-3.5 w-3.5 text-slate-700" />
                            <span>Open Workspace</span>
                          </button>
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
    </div>
  );
}
