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
} from "lucide-react";

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

  // Navigation State (Solo Owner 3-Tab Architecture)
  const [currentTab, setCurrentTab] = useState<"dashboard" | "mandates">("dashboard");

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

  useEffect(() => {
    fetchFunnelData();
    fetchMandatesData();
  }, [scopeFilter]);

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
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
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
              </div>

              {/* SOLO OWNER 3-TAB NAVIGATION */}
              <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    currentTab === "dashboard"
                      ? "bg-white text-slate-900 shadow-xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-slate-700" />
                  <span>Dashboard (Funnel Radar)</span>
                </button>

                <button
                  onClick={() => setCurrentTab("mandates")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    currentTab === "mandates"
                      ? "bg-white text-slate-900 shadow-xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5 text-slate-700" />
                  <span>Mandates & SLA Radar</span>
                  {inboundMandates.length > 0 && (
                    <span className="ml-1 bg-amber-500 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {inboundMandates.length}
                    </span>
                  )}
                </button>

                <Link
                  href="/cockpit/candidates"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                >
                  <Users className="h-3.5 w-3.5 text-slate-700" />
                  <span>Candidate Bank & Talent Pool</span>
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-brand-surfaceLight px-3 py-1.5 rounded-lg border border-brand-surface text-xs font-semibold text-slate-800">
                <span className="font-bold">{session?.user?.name}</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-brand-surfaceDark text-slate-600 uppercase">
                  {userRole}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

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
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-slate-800" />
                  <h1 className="text-base font-extrabold text-slate-900">Agency Executive Pipeline & Funnel Radar</h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Macro candidate velocity across all roles and micro mandate-wise conversion metrics.
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

            {/* SECTION A: MACRO CANDIDATE FUNNEL BANNER (8 Agreed Stages) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    A. Aggregate Candidate Conversion Funnel (Across All Mandates)
                  </h2>
                </div>
                {macroFunnel && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Overall Placement Rate: {macroFunnel.conversionRate}%
                  </span>
                )}
              </div>

              {loadingFunnel ? (
                <div className="py-8 text-center text-slate-400 text-xs">Computing real-time pipeline funnel...</div>
              ) : macroFunnel ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {/* Stage 1: Ingested */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center relative">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">1. Ingested</span>
                    <div className="text-xl font-black text-slate-900 mt-1">{macroFunnel.ingested}</div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Raw Sourced</span>
                  </div>

                  {/* Stage 2: Shortlisted */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center relative">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">2. Shortlisted</span>
                    <div className="text-xl font-black text-slate-800 mt-1">{macroFunnel.shortlisted}</div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      {macroFunnel.ingested > 0 ? `${Math.round((macroFunnel.shortlisted / macroFunnel.ingested) * 100)}%` : "0%"}
                    </span>
                  </div>

                  {/* Stage 3: Shared with Company */}
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-center relative">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block truncate">3. Shared w/ Client</span>
                    <div className="text-xl font-black text-blue-950 mt-1">{macroFunnel.sharedWithCompany}</div>
                    <span className="text-[9px] text-blue-600 block mt-0.5">
                      {macroFunnel.shortlisted > 0 ? `${Math.round((macroFunnel.sharedWithCompany / macroFunnel.shortlisted) * 100)}%` : "0%"}
                    </span>
                  </div>

                  {/* Stage 4: Selected for Interview */}
                  <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 text-center relative">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block truncate">4. Interview Selected</span>
                    <div className="text-xl font-black text-purple-950 mt-1">{macroFunnel.selectedForInterview}</div>
                    <span className="text-[9px] text-purple-600 block mt-0.5">Client Approved</span>
                  </div>

                  {/* Stage 5: Interviews Done */}
                  <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 text-center relative">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase block truncate">5. Interviews Done</span>
                    <div className="text-xl font-black text-indigo-950 mt-1">{macroFunnel.interviewsDone}</div>
                    <span className="text-[9px] text-indigo-600 block mt-0.5">Debriefed</span>
                  </div>

                  {/* Stage 6: Selected */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-center relative">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block truncate">6. Selected</span>
                    <div className="text-xl font-black text-amber-950 mt-1">{macroFunnel.selected}</div>
                    <span className="text-[9px] text-amber-700 block mt-0.5">Final Choice</span>
                  </div>

                  {/* Stage 7: Offered */}
                  <div className="bg-purple-100/70 border border-purple-300 rounded-xl p-3 text-center relative">
                    <span className="text-[10px] font-bold text-purple-900 uppercase block truncate">7. Offered</span>
                    <div className="text-xl font-black text-purple-950 mt-1">{macroFunnel.offered}</div>
                    <span className="text-[9px] text-purple-700 block mt-0.5">Offer Locked</span>
                  </div>

                  {/* Stage 8: Joined */}
                  <div className="bg-emerald-100/80 border border-emerald-300 rounded-xl p-3 text-center relative shadow-xs">
                    <span className="text-[10px] font-black text-emerald-900 uppercase block truncate">8. Joined</span>
                    <div className="text-xl font-black text-emerald-950 mt-1">{macroFunnel.joined}</div>
                    <span className="text-[9px] text-emerald-800 font-bold block mt-0.5">Day 1 Placed</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* SECTION B: MANDATE-WISE FUNNEL (MICRO BREAKDOWN PER ROLE) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    B. Mandate-Wise Candidate Funnels & Conversion Drop-Offs
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Click any mandate row to slide out full JD specifications, client contacts, and pipeline candidates.
                  </p>
                </div>

                <div className="relative rounded-lg shadow-sm max-w-xs w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={funnelSearchQuery}
                    onChange={(e) => setFunnelSearchQuery(e.target.value)}
                    placeholder="Search mandate title or client..."
                    className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
                  />
                </div>
              </div>

              {loadingFunnel ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading mandate funnels...</div>
              ) : filteredMandateFunnels.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No active search mandates found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-brand-surfaceLight text-slate-700 uppercase font-semibold tracking-wider">
                      <tr>
                        <th scope="col" className="px-5 py-3">Mandate & Client</th>
                        <th scope="col" className="px-3 py-3 text-center">Ingested</th>
                        <th scope="col" className="px-3 py-3 text-center">Shortlisted</th>
                        <th scope="col" className="px-3 py-3 text-center">Shared</th>
                        <th scope="col" className="px-3 py-3 text-center">Interview</th>
                        <th scope="col" className="px-3 py-3 text-center">Debriefed</th>
                        <th scope="col" className="px-3 py-3 text-center">Selected</th>
                        <th scope="col" className="px-3 py-3 text-center">Offered</th>
                        <th scope="col" className="px-3 py-3 text-center bg-emerald-50/70 text-emerald-950 font-bold">Joined</th>
                        <th scope="col" className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredMandateFunnels.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                        >
                          {/* Role & Client */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center space-x-1.5">
                              <span>{m.title}</span>
                              <ChevronRight className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {m.client.name} • {m.location || "Hybrid"}
                            </div>
                          </td>

                          {/* 1. Ingested */}
                          <td className="px-3 py-3.5 text-center font-semibold text-slate-700">
                            {m.funnel.ingested}
                          </td>

                          {/* 2. Shortlisted */}
                          <td className="px-3 py-3.5 text-center font-semibold text-slate-800">
                            {m.funnel.shortlisted}
                          </td>

                          {/* 3. Shared */}
                          <td className="px-3 py-3.5 text-center font-semibold text-blue-700">
                            {m.funnel.sharedWithCompany}
                          </td>

                          {/* 4. Interview Selected */}
                          <td className="px-3 py-3.5 text-center font-semibold text-purple-700">
                            {m.funnel.selectedForInterview}
                          </td>

                          {/* 5. Interviews Done */}
                          <td className="px-3 py-3.5 text-center font-semibold text-indigo-700">
                            {m.funnel.interviewsDone}
                          </td>

                          {/* 6. Selected */}
                          <td className="px-3 py-3.5 text-center font-semibold text-amber-800">
                            {m.funnel.selected}
                          </td>

                          {/* 7. Offered */}
                          <td className="px-3 py-3.5 text-center font-extrabold text-purple-900">
                            {m.funnel.offered}
                          </td>

                          {/* 8. Joined */}
                          <td className="px-3 py-3.5 text-center bg-emerald-50/40">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              {m.funnel.joined}
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => router.push(`/cockpit/mandates/${m.id}`)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-brand-surfaceLight hover:bg-brand-surface border border-brand-surfaceDark text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              <Briefcase className="h-3 w-3 text-slate-700" />
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
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${slaBadgeColors[m.calculatedSlaStatus]}`}>
                              SLA: {m.calculatedSlaStatus} ({m.hoursInStage}h / {m.slaTargetHours}h)
                            </span>
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
                            onClick={() => handleOpenClientSubmit(m)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Submit to Client</span>
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
    </div>
  );
}
