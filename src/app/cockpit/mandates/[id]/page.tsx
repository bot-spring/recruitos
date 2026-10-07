"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  UploadCloud,
  FileText,
  UserPlus,
  Send,
  Zap,
  Sparkles,
  ChevronRight,
  X,
  PhoneCall,
  MessageSquare,
  Shield,
  Award,
  DollarSign,
  ExternalLink,
  ChevronDown,
  Check,
  AlertTriangle,
  Radio,
  Share2,
  BellRing,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  MapPin,
  MoreVertical,
  Trash2,
  Archive,
  Loader2,
} from "lucide-react";
import { UserSandboxToggle, UserSandboxBanner } from "@/components/UserSandboxToggle";
import { CandidateDetailModal, CALL_DISPOSITIONS } from "@/components/CandidateDetailModal";
import { ScheduleInterviewModal } from "@/components/ScheduleInterviewModal";
import { CockpitHeader } from "@/components/CockpitHeader";
import { CandidateCard } from "@/components/CandidateCard";

interface MandateDetails {
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
  slaStatus: string;
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
}

interface AttachedCandidate {
  submissionId: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  phoneNormalized: string;
  currentCompany: string | null;
  currentTitle: string | null;
  totalExpYears: number;
  expectedCtc: number | null;
  currentCtc: number | null;
  currency: string;
  noticePeriodDays: number;
  location: string | null;
  skills: string[];
  summary: string | null;
  rawResumeText: string | null;
  resumeUrl: string | null;
  qualification: string | null;
  source: string;
  dateOfSourcing: string;
  status: "NOT_SHARED" | "SHARED_WITH_COMPANY" | "SELECTED_FOR_NEXT_ROUND" | "OFFERED" | "HOLD" | "REJECTED" | "JOINED";
  stage: string;
  clientDecision: string | null;
  clientFeedbackNotes: string | null;
  clientFeedbackAt: string | null;
  preferredInterviewTimes: string | null;
  rejectionReason: string | null;
  clientQuestionText: string | null;
  submittedToClientAt: string | null;
  lastCallOutcome: string | null;
  lastCallNotes: string | null;
  lastCallAt: string | null;
  nextCallbackAt: string | null;
  readyToRelocate: string | null;
  relevantExpYears: number | null;
  currentSalary: string | null;
  expectedSalary: string | null;
  noticePeriod: string | null;
  reasonForLeaving: string | null;
  offerInHand: string | null;
  isSilverMedalist: boolean;
  silverMedalistReason: string | null;
  thisJobCallLogs: Array<{
    id: string;
    disposition: string;
    notes: string | null;
    callbackAt?: string | null;
    calledAt: string;
    recruiterName: string;
  }>;
  otherJobsHistory: Array<{
    mandateId: string;
    mandateTitle: string;
    clientName: string;
    stage: string;
    candidateJobStatus: string;
    createdAt: string;
    callLogs: Array<{
      id: string;
      disposition: string;
      notes: string | null;
      calledAt: string;
      recruiterName: string;
    }>;
  }>;
}

interface PoolCandidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentCompany: string | null;
  currentTitle: string | null;
  totalExpYears: number;
  expectedCtc: number | null;
  noticePeriodDays: number;
  location: string | null;
  skills: string[];
  summary: string | null;
  source: string;
  matchScore: number;
  matchedSkills: string[];
}


const CANDIDATE_STATUSES = [
  { value: "NOT_SHARED", label: "Not Shared with Company", badge: "bg-slate-100 text-slate-800 border-slate-300" },
  { value: "SHARED_WITH_COMPANY", label: "Shared with Company", badge: "bg-blue-100 text-blue-900 border-blue-300" },
  { value: "SELECTED_FOR_NEXT_ROUND", label: "Selected for Next Round", badge: "bg-purple-100 text-purple-900 border-purple-300" },
  { value: "OFFERED", label: "Offered", badge: "bg-amber-100 text-amber-900 border-amber-300 font-black" },
  { value: "HOLD", label: "Hold", badge: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  { value: "REJECTED", label: "Rejected", badge: "bg-rose-100 text-rose-900 border-rose-300" },
  { value: "JOINED", label: "Joined (Day 1)", badge: "bg-emerald-100 text-emerald-950 border-emerald-400 font-black" },
];

export default function MandateWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const mandateId = params.id as string;

  const [mandate, setMandate] = useState<MandateDetails | null>(null);
  const [candidates, setCandidates] = useState<AttachedCandidate[]>([]);
  const [matchingPool, setMatchingPool] = useState<PoolCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeQuickTab, setActiveQuickTab] = useState<"ALL" | "CALLBACKS_TODAY" | "READY_TO_SHARE">("ALL");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isJdDrawerOpen, setIsJdDrawerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Centered Call Screening Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<AttachedCandidate | null>(null);
  const [scheduleCandidate, setScheduleCandidate] = useState<AttachedCandidate | null>(null);

  // Candidate Lifecycle Actions (Remove from Mandate / Delete to Trash Bin)
  const [candidateToRemove, setCandidateToRemove] = useState<AttachedCandidate | null>(null);
  const [removingFromMandate, setRemovingFromMandate] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<AttachedCandidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState(false);

  // Mandate Lifecycle Actions (Close / Retire / Delete Mandate)
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isCloseMandateModalOpen, setIsCloseMandateModalOpen] = useState(false);
  const [closeStatus, setCloseStatus] = useState<"CLOSED_FULFILLED" | "CLOSED_CANCELLED" | "CLOSED_ON_HOLD">("CLOSED_FULFILLED");
  const [closeReason, setCloseReason] = useState("");
  const [recycleCandidates, setRecycleCandidates] = useState(true);
  const [updatingMandateStatus, setUpdatingMandateStatus] = useState(false);

  const [isDeleteMandateModalOpen, setIsDeleteMandateModalOpen] = useState(false);
  const [deletingMandate, setDeletingMandate] = useState(false);

  // Helper to format scheduled callback badge
  const getCallbackBadge = (callbackAtStr: string | null) => {
    if (!callbackAtStr) return null;
    try {
      const cbDate = new Date(callbackAtStr);
      const now = new Date();
      const isOverdue = cbDate.getTime() < now.getTime();
      const isToday = cbDate.toDateString() === now.toDateString();
      const timeStr = cbDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      if (isOverdue) {
        return {
          text: `⚠️ Overdue (${isToday ? timeStr : `${cbDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`})`,
          className: "bg-rose-100 text-rose-800 border-rose-300 font-extrabold",
        };
      }
      if (isToday) {
        return {
          text: `⏰ Call Today @ ${timeStr}`,
          className: "bg-amber-100 text-amber-900 border-amber-400 font-extrabold",
        };
      }
      return {
        text: `📅 ${cbDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} @ ${timeStr}`,
        className: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
      };
    } catch (_) {
      return null;
    }
  };

  // Pool Browse Modal State
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  // Multi-Resume Ingestion Modal State (RC-02 Split-Screen Review)
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [expandedEditIndex, setExpandedEditIndex] = useState<number | null>(null);
  const [parseProgress, setParseProgress] = useState({
    current: 0,
    total: 0,
    currentFileName: "",
    percent: 0,
    stageText: "Preparing document...",
  });

  const updateCandidateField = (index: number, field: string, value: any) => {
    setBatchResults((prev) => {
      const updated = [...prev];
      if (updated[index]?.parsed) {
        updated[index] = {
          ...updated[index],
          parsed: {
            ...updated[index].parsed,
            [field]: value,
          },
        };
      }
      return updated;
    });
  };

  const updateActiveParsedField = (field: string, value: any) => {
    updateCandidateField(activeBatchIndex, field, value);
  };

  const handleRemoveSkill = (skillToRemove: string, index = activeBatchIndex) => {
    setBatchResults((prev) => {
      const updated = [...prev];
      const curr = updated[index]?.parsed;
      if (curr && Array.isArray(curr.skills)) {
        updated[index] = {
          ...updated[index],
          parsed: {
            ...curr,
            skills: curr.skills.filter((s: string) => s !== skillToRemove),
          },
        };
      }
      return updated;
    });
  };

  const handleAddSkill = (index = activeBatchIndex) => {
    if (!newSkillInput.trim()) return;
    const skillToAdd = newSkillInput.trim();
    setBatchResults((prev) => {
      const updated = [...prev];
      const curr = updated[index]?.parsed;
      if (curr) {
        const existing = Array.isArray(curr.skills) ? curr.skills : [];
        if (!existing.includes(skillToAdd)) {
          updated[index] = {
            ...updated[index],
            parsed: {
              ...curr,
              skills: [...existing, skillToAdd],
            },
          };
        }
      }
      return updated;
    });
    setNewSkillInput("");
  };

  const handleRemoveBatchItem = (index: number) => {
    setBatchResults((prev) => prev.filter((_, i) => i !== index));
    if (expandedEditIndex === index) {
      setExpandedEditIndex(null);
    } else if (expandedEditIndex !== null && expandedEditIndex > index) {
      setExpandedEditIndex(expandedEditIndex - 1);
    }
  };

  // Client Portal Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedForSharing, setSelectedForSharing] = useState<string[]>([]);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [generatedPortalUrl, setGeneratedPortalUrl] = useState<string | null>(null);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);
  const [chasingClient, setChasingClient] = useState(false);

  // Fetch Mandate Workspace Data
  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mandates/${mandateId}/workspace`);
      if (res.ok) {
        const data = await res.json();
        setMandate(data.mandate);
        setCandidates(data.attachedCandidates || []);
        setMatchingPool(data.matchingPool || []);

        // Pre-select candidates for sharing who are CONNECTED_INTERESTED and NOT_SHARED
        const readyIds = (data.attachedCandidates || [])
          .filter((c: AttachedCandidate) => c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED")
          .map((c: AttachedCandidate) => c.candidateId);
        setSelectedForSharing(readyIds);
      }
    } catch (err) {
      console.error("Failed to load mandate workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mandateId) {
      fetchWorkspace();
    }
  }, [mandateId]);

  // Open Centered Candidate Call Screening Modal
  const handleOpenCandidateModal = (cand: AttachedCandidate) => {
    setSelectedCandidate(cand);
  };


  // Update Candidate Status
  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/mandates/${mandateId}/candidate-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setSuccessMessage(`Candidate status updated to: ${newStatus.replace(/_/g, " ")}`);
      fetchWorkspace();

      if (selectedCandidate && selectedCandidate.submissionId === submissionId) {
        setSelectedCandidate({ ...selectedCandidate, status: newStatus as any });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  // Add Candidate from Pool to this Mandate
  const handleAttachFromPool = async (candidateId: string) => {
    setAttachingId(candidateId);
    try {
      const res = await fetch(`/api/mandates/${mandateId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to attach candidate");
      }

      setSuccessMessage(`Candidate attached to this job successfully!`);
      fetchWorkspace();
    } catch (err: any) {
      alert(err.message || "Failed to attach candidate");
    } finally {
      setAttachingId(null);
    }
  };

  // Candidate Lifecycle: Remove from this Mandate
  const handleExecuteRemoveFromMandate = async () => {
    if (!candidateToRemove || !mandate) return;
    setRemovingFromMandate(true);
    try {
      const res = await fetch(`/api/mandates/${mandate.id}/candidates?submissionId=${candidateToRemove.submissionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove candidate from search.");

      setSuccessMessage(`Candidate '${candidateToRemove.fullName}' removed from this search mandate.`);
      setCandidates((prev) => prev.filter((c) => c.submissionId !== candidateToRemove.submissionId));
      if (selectedCandidate?.submissionId === candidateToRemove.submissionId) {
        setSelectedCandidate(null);
      }
      setCandidateToRemove(null);
    } catch (err: any) {
      alert(err.message || "Failed to remove candidate.");
    } finally {
      setRemovingFromMandate(false);
    }
  };

  // Candidate Lifecycle: Delete to Trash Bin
  const handleExecuteDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    setDeletingCandidate(true);
    try {
      const res = await fetch(`/api/candidates/${candidateToDelete.candidateId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User deleted profile from Mandate Workspace" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete candidate.");

      setSuccessMessage(`Candidate '${candidateToDelete.fullName}' moved to Trash Bin.`);
      setCandidates((prev) => prev.filter((c) => c.candidateId !== candidateToDelete.candidateId));
      if (selectedCandidate?.candidateId === candidateToDelete.candidateId) {
        setSelectedCandidate(null);
      }
      setCandidateToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete candidate.");
    } finally {
      setDeletingCandidate(false);
    }
  };

  // Mandate Lifecycle: Close or Re-open Mandate
  const handleExecuteCloseMandate = async (targetStatus?: string) => {
    if (!mandate) return;
    setUpdatingMandateStatus(true);
    try {
      const statusToSet = targetStatus || closeStatus;
      const res = await fetch(`/api/mandates/${mandate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusToSet,
          closeReason,
          recycleCandidates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update mandate status.");

      setSuccessMessage(data.message || `Mandate status updated to ${statusToSet.replace(/_/g, " ")}.`);
      setIsCloseMandateModalOpen(false);
      fetchWorkspace();
    } catch (err: any) {
      alert(err.message || "Failed to close mandate.");
    } finally {
      setUpdatingMandateStatus(false);
    }
  };

  // Mandate Lifecycle: Delete Mandate to MandateTrashBin
  const handleExecuteDeleteMandate = async () => {
    if (!mandate) return;
    setDeletingMandate(true);
    try {
      const res = await fetch(`/api/mandates/${mandate.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User deleted mandate from Mandate Workspace" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete mandate.");

      router.push("/cockpit?tab=mandates");
    } catch (err: any) {
      alert(err.message || "Failed to delete mandate.");
      setDeletingMandate(false);
    }
  };

  // Handle Multi-File Upload & Gemini AI Parse (Up to 5 files, 10MB limit)
  const handleMultiFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);

    if (fileList.length > 5) {
      setParseError("Maximum 5 resumes can be uploaded in one go. Please select up to 5 files.");
      return;
    }

    const oversized = fileList.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setParseError(`File '${oversized.name}' exceeds the 10MB size limit (${(oversized.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setUploadFiles(fileList);
    setParsing(true);
    setParseError(null);
    setBatchResults([]);
    setActiveBatchIndex(0);
    setExpandedEditIndex(null);
    setParseProgress({
      current: 1,
      total: fileList.length,
      currentFileName: fileList[0].name,
      percent: 8,
      stageText: "Uploading & storing document in cloud...",
    });

    const accumulatedResults: any[] = new Array(fileList.length);
    const concurrency = 5;
    let completedCount = 0;
    let nextIndexToProcess = 0;

    // Smooth stage-aware progress ticker
    const progressInterval = setInterval(() => {
      setParseProgress((prev) => {
        const baseFloor = (completedCount / fileList.length) * 100;
        const currentTargetCeiling = Math.min(94, Math.round(baseFloor + (94 - baseFloor) * 0.9));
        if (prev.percent >= currentTargetCeiling) {
          return prev;
        }
        const step = Math.max(1, Math.round((currentTargetCeiling - prev.percent) * 0.08));
        const nextVal = Math.min(currentTargetCeiling, prev.percent + step);

        let stage = "Uploading & storing document in cloud...";
        if (nextVal >= 25 && nextVal < 70) {
          stage = "AI extracting candidate profile & qualifications...";
        } else if (nextVal >= 70) {
          stage = "Checking duplicate records & mandate pipeline...";
        }

        return {
          ...prev,
          percent: nextVal,
          stageText: stage,
        };
      });
    }, 200);

    const worker = async () => {
      while (nextIndexToProcess < fileList.length) {
        const i = nextIndexToProcess++;
        const file = fileList[i];

        setParseProgress((prev) => ({
          ...prev,
          current: Math.min(completedCount + 1, fileList.length),
          currentFileName: file.name,
        }));

        const formData = new FormData();
        formData.append("file", file);
        if (mandateId) {
          formData.append("mandateId", mandateId);
        }

        try {
          const res = await fetch("/api/candidates/parse", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.results && data.results[0]) {
            accumulatedResults[i] = data.results[0];
          } else if (res.ok && data.parsed) {
            accumulatedResults[i] = {
              fileName: file.name,
              fileSize: file.size,
              success: true,
              parsed: data.parsed,
              resumeUrl: data.resumeUrl,
              rawResumeText: data.rawResumeText,
              isDuplicate: Boolean(data.isDuplicate),
              existingCandidateId: data.existingCandidateId || null,
              isMandateDuplicate: Boolean(data.isMandateDuplicate),
              existingStage: data.existingStage || null,
              existingJobStatus: data.existingJobStatus || null,
            };
          } else {
            accumulatedResults[i] = {
              fileName: file.name,
              fileSize: file.size,
              success: false,
              error: data.error || "Failed to extract entities",
            };
          }
        } catch (itemErr: any) {
          accumulatedResults[i] = {
            fileName: file.name,
            fileSize: file.size,
            success: false,
            error: itemErr.message || "Network error while parsing",
          };
        }

        completedCount++;
        setBatchResults([...accumulatedResults.filter(Boolean)]);
        setParseProgress((prev) => {
          const newFloor = Math.round((completedCount / fileList.length) * 100);
          return {
            ...prev,
            current: Math.min(completedCount + 1, fileList.length),
            currentFileName: file.name,
            percent: Math.max(prev.percent, newFloor > 94 ? 94 : newFloor),
          };
        });
      }
    };

    try {
      const workers = Array.from(
        { length: Math.min(concurrency, fileList.length) },
        () => worker()
      );
      await Promise.all(workers);
      clearInterval(progressInterval);
      setParseProgress((prev) => ({
        ...prev,
        current: fileList.length,
        percent: 100,
        stageText: "Parsing complete!",
      }));
      // Smooth visual transition
      await new Promise((r) => setTimeout(r, 350));
    } catch (err: any) {
      clearInterval(progressInterval);
      setParseError(err.message || "Failed to parse resumes with AI.");
    } finally {
      clearInterval(progressInterval);
      setParsing(false);
    }
  };

  // Save Batch Ingested Candidates and Attach to this Mandate
  const handleSaveBatchIngest = async () => {
    if (batchResults.length === 0) return;
    setSavingBatch(true);
    setParseError(null);

    try {
      let savedCount = 0;
      let newlyAttachedCount = 0;
      let alreadyActiveCount = 0;
      let lastErrorMessage = "";

      for (const item of batchResults) {
        if (!item.success || !item.parsed) continue;
        const p = item.parsed;
        const res = await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: p.fullName || "Candidate",
            email: p.email || "",
            phone: p.phone || "",
            currentCompany: p.currentCompany || "",
            currentTitle: p.currentTitle || "",
            totalExpYears: p.totalExpYears || 0,
            currentCtc: p.currentCtc ? String(p.currentCtc) : "",
            expectedCtc: p.expectedCtc ? String(p.expectedCtc) : "",
            currency: p.currency || "INR",
            noticePeriodDays: p.noticePeriodDays || 30,
            location: p.location || "",
            skills: Array.isArray(p.skills) ? p.skills : (typeof p.skills === "string" ? p.skills.split(",") : []),
            summary: p.summary || "",
            rawResumeText: item.rawResumeText || "",
            resumeUrl: item.resumeUrl || null,
            qualification: p.qualification || "",
            mandateId,
          }),
        });

        if (res.ok) {
          savedCount++;
          try {
            const resData = await res.json();
            if (resData.isNewSubmission) {
              newlyAttachedCount++;
            } else {
              alreadyActiveCount++;
            }
          } catch (_) {
            newlyAttachedCount++;
          }
        } else {
          try {
            const errData = await res.json();
            lastErrorMessage = errData.error || `HTTP ${res.status}`;
          } catch (_) {
            lastErrorMessage = `Server returned ${res.status}: ${res.statusText}`;
          }
        }
      }

      if (savedCount > 0) {
        let msg = "";
        if (newlyAttachedCount > 0 && alreadyActiveCount > 0) {
          msg = `✓ ${newlyAttachedCount} new candidate(s) attached to pipeline. ${alreadyActiveCount} candidate(s) were already active in this job (profiles & resumes refreshed).`;
        } else if (newlyAttachedCount > 0) {
          msg = `✓ Successfully attached ${newlyAttachedCount} new candidate(s) to '${mandate?.title || "job"}'!`;
        } else {
          msg = `ℹ️ All ${alreadyActiveCount} candidate(s) were already in this job mandate — updated their profile & resume records.`;
        }
        setSuccessMessage(msg);
        setIsIngestModalOpen(false);
        setUploadFiles([]);
        setBatchResults([]);
        setExpandedEditIndex(null);
        await fetchWorkspace();
      } else {
        setParseError(`Failed to save candidates: ${lastErrorMessage || "Unable to save to database."}`);
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to save ingested candidates.");
    } finally {
      setSavingBatch(false);
    }
  };

  // Generate Client Portal Share Link & Dispatch Shortlist Email
  const handleGenerateSharePortal = async () => {
    if (selectedForSharing.length === 0) return;
    setGeneratingPortal(true);

    try {
      const res = await fetch(`/api/mandates/${mandateId}/submit-to-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIds: selectedForSharing,
          feedbackSlaHours: 48,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate client presentation portal.");
      }

      const portalUrl = data.shareableUrl || (data.portalShare && data.portalShare.shareableUrl) || data.portalUrl || (data.portalToken ? `/portal/${data.portalToken}` : "");
      const fullUrl = portalUrl.startsWith("http") ? portalUrl : `${window.location.origin}${portalUrl}`;

      setGeneratedPortalUrl(fullUrl);
      setSuccessMessage(
        data.message || `Presentation link generated with 48h Feedback SLA for ${selectedForSharing.length} candidates!`
      );
      fetchWorkspace();
    } catch (err: any) {
      alert(err.message || "Failed to generate presentation link.");
    } finally {
      setGeneratingPortal(false);
    }
  };

  // 1-Click Threaded Client Reminder Chase (CF-04)
  const handleChaseClient = async () => {
    if (!confirm("Send polite in-thread reminder email to the hiring manager for unreviewed candidate profiles?")) {
      return;
    }
    setChasingClient(true);
    try {
      const res = await fetch(`/api/mandates/${mandateId}/chase-client`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reminder.");
      }
      setSuccessMessage(data.message || "Reminder email sent to hiring manager!");
      fetchWorkspace();
    } catch (err: any) {
      alert(err.message || "Failed to dispatch client chase.");
    } finally {
      setChasingClient(false);
    }
  };

  // Helper to determine if callback is due today or overdue
  const isCallbackDue = (c: AttachedCandidate) => {
    if (c.lastCallOutcome !== "CONNECTED_CALLBACK" || !c.nextCallbackAt) return false;
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const cbTime = new Date(c.nextCallbackAt).getTime();
    return cbTime < todayEnd;
  };

  const callbacksDueCount = candidates.filter(isCallbackDue).length;

  // Filter candidates in table
  const filteredCandidates = candidates
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.fullName.toLowerCase().includes(q) ||
        (c.currentCompany && c.currentCompany.toLowerCase().includes(q)) ||
        (c.currentTitle && c.currentTitle.toLowerCase().includes(q)) ||
        c.phone.includes(q);

      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

      let matchesTab = true;
      if (activeQuickTab === "CALLBACKS_TODAY") {
        matchesTab = isCallbackDue(c);
      } else if (activeQuickTab === "READY_TO_SHARE") {
        matchesTab = c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED";
      }

      return matchesSearch && matchesStatus && matchesTab;
    })
    .sort((a, b) => {
      if (activeQuickTab === "CALLBACKS_TODAY") {
        const timeA = a.nextCallbackAt ? new Date(a.nextCallbackAt).getTime() : Infinity;
        const timeB = b.nextCallbackAt ? new Date(b.nextCallbackAt).getTime() : Infinity;
        return timeA - timeB;
      }
      return 0;
    });

  // Count candidates ready to share (Connected & Profile Matched + Not Shared)
  const readyToShareCount = candidates.filter(
    (c) => c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED"
  ).length;

  // Count candidates currently shared with company awaiting feedback
  const sharedWithClientCount = candidates.filter(
    (c) => c.status === "SHARED_WITH_COMPANY" || c.stage === "SUBMITTED_TO_CLIENT"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-700">Opening Mandate Execution Desk...</p>
        </div>
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 text-center">
        <p className="text-sm font-bold text-slate-700">Search Mandate not found.</p>
        <Link href="/cockpit?tab=mandates" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          &larr; Return to Mandates List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <UserSandboxBanner />
      {/* Top Header Navigation */}

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Closed Mandate Notice Banner */}
        {mandate.status && (mandate.status === "CLOSED_FULFILLED" || mandate.status === "CLOSED_CANCELLED" || mandate.status === "CLOSED_ON_HOLD") && (
          <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-950 shadow-xs animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <Archive className="h-4 w-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold uppercase tracking-wide">Archived Search:</span>
                <span className="ml-1 text-slate-800">
                  This mandate is currently marked as <strong>{mandate.status.replace(/_/g, " ")}</strong>. Active recruiting is closed.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleExecuteCloseMandate("ACTIVE_ASSIGNED")}
              disabled={updatingMandateStatus}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 font-bold rounded-lg text-amber-900 shadow-xs cursor-pointer text-xs shrink-0 flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Re-open Search</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MANDATE HERO STRIP WITH CONSOLIDATED JOB ACTIONS (ASHBY PATTERN)         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          {/* Top Row: Breadcrumb + Title + Consolidated Actions */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Left: Breadcrumb + Title, Client, Openings & SLA */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                <Link
                  href="/cockpit?tab=mandates"
                  className="hover:text-slate-900 inline-flex items-center space-x-1 font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Mandates</span>
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{mandate.client.name}</span>
              </div>

              <div className="flex items-center space-x-3 flex-wrap gap-y-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsJdDrawerOpen(true)}
                  className="group flex items-center space-x-2 text-left cursor-pointer focus:outline-none"
                >
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                    {mandate.title}
                  </h1>
                  <span className="text-slate-400 group-hover:text-blue-600 transition-colors text-xs font-semibold underline underline-offset-2 flex items-center space-x-0.5">
                    <span>(Full JD)</span>
                  </span>
                </button>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-semibold text-slate-500">
                  {mandate.openings} {mandate.openings === 1 ? "Opening" : "Openings"}
                </span>
                {/* SLA bulb dot indicator */}
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    mandate.slaStatus === "BREACHED"
                      ? "bg-rose-500 animate-pulse"
                      : mandate.slaStatus === "WARNING" || mandate.slaStatus === "AT_RISK"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`} />
                  <span>SLA: {mandate.slaStatus.replace("_", " ")}</span>
                </span>
              </div>
            </div>

            {/* Right: Sourcing Actions */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {/* 1. Talent Pool */}
              <button
                onClick={() => setIsPoolModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Talent Pool</span>
                {matchingPool.length > 0 && (
                  <span className="bg-white text-slate-700 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-slate-200">
                    {matchingPool.length}
                  </span>
                )}
              </button>

              {/* 2. Ingest Resumes */}
              <button
                onClick={() => {
                  setIsIngestModalOpen(true);
                  setUploadFiles([]);
                  setBatchResults([]);
                  setParseError(null);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>+ Ingest Resumes</span>
              </button>

              {/* 3. Mandate Lifecycle Options (Kebab Menu) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Mandate Actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {isActionsMenuOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    {mandate.status !== "CLOSED_FULFILLED" && mandate.status !== "CLOSED_CANCELLED" && mandate.status !== "CLOSED_ON_HOLD" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          setIsCloseMandateModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-amber-50 text-slate-700 hover:text-amber-900 flex items-center space-x-2 font-medium cursor-pointer"
                      >
                        <Archive className="h-3.5 w-3.5 text-amber-600" />
                        <span>Close / Retire Mandate</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          handleExecuteCloseMandate("ACTIVE_ASSIGNED");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-center space-x-2 font-medium cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Re-open Mandate</span>
                      </button>
                    )}
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        setIsDeleteMandateModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 flex items-center space-x-2 font-medium cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      <span>Delete to Trash Bin</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Key Specs Icon Bar + Skills */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {/* Exp */}
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Exp: <strong className="text-slate-800">{mandate.minExp && mandate.maxExp ? `${mandate.minExp}-${mandate.maxExp} Yrs` : mandate.minExp ? `${mandate.minExp}+ Yrs` : "Open"}</strong>
                </span>
              </div>

              {/* CTC */}
              <div className="flex items-center space-x-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Target CTC: <strong className="text-slate-800">{mandate.minCtc ? `₹${(mandate.minCtc / 100000).toFixed(1)}L` : "Open"} - {mandate.maxCtc ? `₹${(mandate.maxCtc / 100000).toFixed(1)}L` : "Open"}</strong>
                </span>
              </div>

              {/* Location & Mode */}
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  <strong className="text-slate-800">{mandate.location || "Remote / Flexible"}</strong> ({mandate.workMode})
                </span>
              </div>

              {/* Fee & Guarantee */}
              <div className="flex items-center space-x-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Fee: <strong className="text-slate-800">{mandate.feePercentage}%</strong> • Guarantee: <strong className="text-slate-800">{mandate.guaranteeDays}d</strong>
                </span>
              </div>
            </div>

            {/* Top Skills Badges */}
            {mandate.skills.length > 0 && (
              <div className="flex items-center space-x-1 flex-wrap">
                {mandate.skills.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
                {mandate.skills.length > 3 && (
                  <button
                    onClick={() => setIsJdDrawerOpen(true)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 font-bold px-1.5 py-0.5 hover:underline cursor-pointer"
                  >
                    +{mandate.skills.length - 3} more
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CANDIDATES DESK (TABS + DELIVERY ACTIONS)                                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Tabs + Delivery Actions Bar */}
          <div className="px-5 pt-3 pb-2.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Sleek Underline Tabs */}
            <div className="flex items-center space-x-6 overflow-x-auto -mb-2.5">
              <button
                onClick={() => setActiveQuickTab("ALL")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeQuickTab === "ALL"
                    ? "border-slate-900 text-slate-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <span>All Candidates</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeQuickTab === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {candidates.length}
                </span>
              </button>

              <button
                onClick={() => setActiveQuickTab("CALLBACKS_TODAY")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeQuickTab === "CALLBACKS_TODAY"
                    ? "border-amber-600 text-amber-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Callbacks Due Today</span>
                {callbacksDueCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                    {callbacksDueCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveQuickTab("READY_TO_SHARE")}
                className={`pb-3 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 border-b-2 -mb-px ${
                  activeQuickTab === "READY_TO_SHARE"
                    ? "border-blue-600 text-blue-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-blue-600" />
                <span>Ready to Share</span>
                {readyToShareCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                    {readyToShareCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Client Delivery Actions (Share Shortlist + Chase Client) */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => {
                  setIsShareModalOpen(true);
                  setGeneratedPortalUrl(null);
                  setCopiedPortalUrl(false);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Send className="h-3 w-3" />
                <span>Share Shortlist</span>
                {readyToShareCount > 0 && (
                  <span className="bg-white text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                    {readyToShareCount}
                  </span>
                )}
              </button>

              {sharedWithClientCount > 0 && (
                <button
                  type="button"
                  onClick={handleChaseClient}
                  disabled={chasingClient}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <BellRing className="h-3 w-3 text-amber-600" />
                  <span>{chasingClient ? "Chasing..." : "Chase"}</span>
                  <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                    {sharedWithClientCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Table Filters & Search */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
            <div className="flex items-center space-x-3 flex-1 max-w-lg">
              <div className="relative rounded-lg shadow-sm flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by candidate name, company, title, phone..."
                  className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-700"
              >
                <option value="ALL">All Statuses ({candidates.length})</option>
                <option value="NOT_SHARED">Not Shared with Company</option>
                <option value="SHARED_WITH_COMPANY">Shared with Company</option>
                <option value="SELECTED_FOR_NEXT_ROUND">Selected for Next Round</option>
                <option value="OFFERED">Offered</option>
                <option value="HOLD">Hold</option>
                <option value="REJECTED">Rejected</option>
                <option value="JOINED">Joined</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredCandidates.length}</strong> candidates in this job
            </div>
          </div>

          {/* Candidates Cards Stack (Matching Talent Bank Architecture) */}
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No candidates in this mandate yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Click <strong>"Talent Pool"</strong> or <strong>"+ Ingest Resumes"</strong> above!
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50/50 space-y-3">
              {/* Batch Selection Bar */}
              {filteredCandidates.length > 0 && (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium shadow-2xs">
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      checked={
                        selectedCandidateIds.length > 0 &&
                        filteredCandidates.every((c) => selectedCandidateIds.includes(c.candidateId))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = Array.from(
                            new Set([...selectedCandidateIds, ...filteredCandidates.map((c) => c.candidateId)])
                          );
                          setSelectedCandidateIds(allIds);
                        } else {
                          const displayedSet = new Set(filteredCandidates.map((c) => c.candidateId));
                          setSelectedCandidateIds((prev) => prev.filter((id) => !displayedSet.has(id)));
                        }
                      }}
                      aria-label="Select all candidates in this view"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800">
                      Showing {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? "" : "s"}
                    </span>
                    {selectedCandidateIds.length > 0 && (
                      <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[11px] border border-amber-300">
                        {selectedCandidateIds.length} selected
                      </span>
                    )}
                  </div>

                  {selectedCandidateIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateIds([])}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              )}

              {/* Candidate Cards Stack */}
              {filteredCandidates.map((c, idx) => (
                <CandidateCard
                  key={c.submissionId}
                  candidate={{
                    ...c,
                    id: c.candidateId,
                    lastCallDisposition: c.lastCallOutcome,
                  }}
                  index={idx}
                  isSelected={selectedCandidateIds.includes(c.candidateId)}
                  onToggleSelect={(id) => {
                    setSelectedCandidateIds((prev) =>
                      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                    );
                  }}
                  onOpenModal={() => handleOpenCandidateModal(c)}
                  onScheduleInterview={() => {
                    setSelectedCandidate(null);
                    setScheduleCandidate(c);
                  }}
                  statusOptions={CANDIDATE_STATUSES}
                  currentStatus={c.status}
                  onStatusChange={(_, newStatus) => handleUpdateStatus(c.submissionId, newStatus)}
                  onRemoveFromMandate={() => setCandidateToRemove(c)}
                  onDeleteCandidate={() => setCandidateToDelete(c)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* CENTERED CANDIDATE DETAIL & CALL SCREENING MODAL                          */}
      {/* ========================================================================= */}
      <CandidateDetailModal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
        mandateContext={{
          id: mandate.id,
          title: mandate.title,
          clientName: mandate.client.name,
        }}
        onCallLogged={(data) => {
          if (selectedCandidate) {
            const newLog = {
              id: data.callLog.id,
              calledAt: data.callLog.calledAt,
              disposition: data.callLog.disposition,
              notes: data.callLog.notes,
              callbackAt: data.callLog.callbackAt,
              recruiterName: "You",
            };
            setSelectedCandidate({
              ...selectedCandidate,
              lastCallOutcome: data.callLog.disposition,
              lastCallNotes: data.callLog.notes,
              lastCallAt: data.callLog.calledAt,
              nextCallbackAt: data.callLog.callbackAt,
              thisJobCallLogs: [newLog, ...selectedCandidate.thisJobCallLogs],
            });
          }
          fetchWorkspace();
        }}
        onOpenSchedule={(cand) => {
          setSelectedCandidate(null);
          setScheduleCandidate(cand);
        }}
        onRemoveFromMandate={() => {
          setCandidateToRemove(selectedCandidate);
          setSelectedCandidate(null);
        }}
        onDeleteCandidate={() => {
          setCandidateToDelete(selectedCandidate);
          setSelectedCandidate(null);
        }}
      />

      {/* SCHEDULE INTERVIEW MODAL (RC-04) */}
      <ScheduleInterviewModal
        isOpen={!!scheduleCandidate}
        onClose={() => setScheduleCandidate(null)}
        candidate={scheduleCandidate}
        submissionId={scheduleCandidate?.submissionId || null}
        mandateTitle={mandate.title}
        onSuccess={(data: any) => {
          setSuccessMessage(
            `⚡ Interview locked for ${scheduleCandidate?.fullName}! ${
              data.dispatched?.whatsApp ? "WhatsApp candidate brief sent." : ""
            } ${data.dispatched?.email ? "Calendar invite dispatched." : ""}`
          );
          fetchWorkspace();
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 1: BROWSE MATCHING CANDIDATES IN POOL (HIGH TO LOW SKILL MATCH)     */}
      {/* ========================================================================= */}
      {isPoolModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Matching Candidates in Existing Pool</h3>
                  <p className="text-[10px] text-purple-800">
                    Sorted by Skill Match % against '{mandate.title}'
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPoolModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {matchingPool.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  All agency pool candidates are already attached to this mandate!
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingPool.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-purple-50/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <strong className="text-slate-900 text-sm">{p.fullName}</strong>
                          <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-300">
                            {p.matchScore}% Match
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.currentTitle} • {p.totalExpYears}y Exp • {p.noticePeriodDays}d Notice
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.skills.slice(0, 4).map((s, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAttachFromPool(p.id)}
                        disabled={attachingId === p.id}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap text-xs disabled:opacity-50 flex items-center space-x-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{attachingId === p.id ? "Attaching..." : "+ Add to this Mandate"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsPoolModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 2: INGEST RESUMES DIRECTLY TO THIS JOB (BATCH UP TO 5 CVS) - RC-02   */}
      {/* ========================================================================= */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div
            className={`bg-white rounded-2xl shadow-2xl border border-slate-200 ${
              batchResults.length > 0 && !parsing ? "max-w-5xl" : "max-w-2xl"
            } w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs flex flex-col max-h-[92vh]`}
          >
            {/* Modal Header - Clean Enterprise White */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between text-slate-900 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <UploadCloud className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      CV Intake Engine
                    </h3>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                      Mandate Direct
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {mandate.title} ({mandate.client.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsIngestModalOpen(false);
                  setBatchResults([]);
                  setUploadFiles([]);
                  setParseError(null);
                  setExpandedEditIndex(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none cursor-pointer w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                  <div className="flex-1">
                    <strong className="block font-bold">Upload / Parsing Issue</strong>
                    <span className="text-xs">{parseError}</span>
                  </div>
                </div>
              )}

              {/* State 1: Dropzone */}
              {batchResults.length === 0 && !parsing && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Target Job Mandate</span>
                        <span className="text-xs font-bold text-slate-900">{mandate.title} ({mandate.client.name})</span>
                      </div>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ✓ Auto-Attach Enabled
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-10 text-center bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt"
                      onChange={handleMultiFileSelect}
                      id="mandate-resume-upload-batch"
                      className="hidden"
                    />
                    <label htmlFor="mandate-resume-upload-batch" className="cursor-pointer block">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 mx-auto mb-3 shadow-xs">
                        <UploadCloud className="h-7 w-7 text-slate-700" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm hover:underline block">
                        Click to Select Resumes (PDF, DOCX)
                      </span>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Select <strong>up to 5 resumes</strong> at once. Each file must be under <strong>10MB</strong>.
                      </p>
                      <div className="mt-4 inline-flex items-center space-x-2 text-[11px] font-medium text-slate-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                        <span>✓ Concurrency optimized</span>
                        <span>•</span>
                        <span>✓ Deduplication radar</span>
                        <span>•</span>
                        <span>✓ Auto-attach to pipeline</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* State 2: Active Parsing Progress Indicator */}
              {parsing && (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
                  <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                    <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    <Sparkles className="w-5 h-5 text-slate-700 absolute inset-0 m-auto" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center space-x-2 text-sm font-bold text-slate-900">
                      <span>Processing {parseProgress.total === 1 ? "Resume" : `Resumes (${Math.min(parseProgress.current, parseProgress.total)} of ${parseProgress.total})`}</span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">({parseProgress.percent}%)</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-md mx-auto">
                      File: <span className="font-mono text-slate-900 font-semibold">{parseProgress.currentFileName}</span>
                    </p>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></span>
                      <span>{parseProgress.stageText || "AI extracting candidate profile & qualifications..."}</span>
                    </div>
                  </div>

                  <div className="max-w-md mx-auto space-y-1.5 pt-1">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.max(6, parseProgress.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium font-mono">
                      <span>{parseProgress.total === 1 ? "1 file" : `${Math.min(parseProgress.current, parseProgress.total)}/${parseProgress.total} processed`}</span>
                      <span>{parseProgress.percent}% Complete</span>
                    </div>
                  </div>
                </div>
              )}

              {/* State 3: Executive Review Summary Table */}
              {batchResults.length > 0 && !parsing && (
                <div className="space-y-3">
                  {/* Top Bar: Count & Actions */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-900 text-xs">
                        {batchResults.length} Candidate Profile{batchResults.length > 1 ? "s" : ""} Extracted
                      </span>
                      {batchResults.some((r) => r.isMandateDuplicate) && (
                        <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                          {batchResults.filter((r) => r.isMandateDuplicate).length} already in this job
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchResults([]);
                        setUploadFiles([]);
                        setParseError(null);
                        setExpandedEditIndex(null);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Upload Different Files</span>
                    </button>
                  </div>

                  {/* Candidate List Cards / Rows */}
                  <div className="space-y-2">
                    {batchResults.map((r, idx) => {
                      const p = r.parsed || {};
                      const isExpanded = expandedEditIndex === idx;

                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border transition-all ${
                            isExpanded
                              ? "border-slate-800 bg-white shadow-xs"
                              : "border-slate-200 bg-slate-50/50 hover:bg-white"
                          }`}
                        >
                          {/* Row Summary */}
                          <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Candidate Identity */}
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                {p.fullName
                                  ? p.fullName
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()
                                  : "CV"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {p.fullName || r.fileName}
                                  </span>
                                  {/* Dynamic Duplicate Badge */}
                                  {r.isMandateDuplicate ? (
                                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium px-2 py-0.5 rounded-md inline-flex items-center space-x-1">
                                      <span>⚠️ Duplicate in this Job ({r.existingStage ? r.existingStage.replace(/_/g, " ") : "Active"})</span>
                                    </span>
                                  ) : r.isDuplicate ? (
                                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-md inline-flex items-center space-x-1">
                                      <span>Duplicate Entry Detected (Profile will update)</span>
                                    </span>
                                  ) : r.success ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded-md inline-flex items-center space-x-1">
                                      <span>✓ New Candidate</span>
                                    </span>
                                  ) : (
                                    <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium px-2 py-0.5 rounded-md inline-flex items-center space-x-1">
                                      <span>Failed to Parse</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2 flex-wrap">
                                  <span className="font-medium text-slate-700">
                                    {p.currentTitle || "Title not specified"}
                                    {p.currentCompany ? ` @ ${p.currentCompany}` : ""}
                                  </span>
                                  {p.totalExpYears !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span>{p.totalExpYears} yrs exp</span>
                                    </>
                                  )}
                                  {p.phone && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono">{p.phone}</span>
                                    </>
                                  )}
                                  {p.email && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[160px]">{p.email}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Row Action Buttons */}
                            <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                              {r.resumeUrl && (
                                <a
                                  href={r.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center space-x-1 transition-colors"
                                  title="View Original CV"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>CV</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {r.success && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedEditIndex(isExpanded ? null : idx)}
                                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer inline-flex items-center space-x-1 ${
                                    isExpanded
                                      ? "bg-slate-900 text-white border-slate-900"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  <span>{isExpanded ? "Close" : "Edit"}</span>
                                  <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveBatchItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove from batch"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expandable Inline Edit Form */}
                          {isExpanded && r.parsed && (
                            <div className="p-4 border-t border-slate-200 bg-slate-50/80 rounded-b-xl space-y-3">
                              <div className="flex items-center justify-between pb-1">
                                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                                  Quick Edit Extracted Fields
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Original file: {r.fileName}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Full Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={p.fullName || ""}
                                    onChange={(e) => updateCandidateField(idx, "fullName", e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Current Title
                                  </label>
                                  <input
                                    type="text"
                                    value={p.currentTitle || ""}
                                    onChange={(e) => updateCandidateField(idx, "currentTitle", e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Current Company
                                  </label>
                                  <input
                                    type="text"
                                    value={p.currentCompany || ""}
                                    onChange={(e) => updateCandidateField(idx, "currentCompany", e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Total Exp (Yrs)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={p.totalExpYears ?? 0}
                                    onChange={(e) => updateCandidateField(idx, "totalExpYears", parseFloat(e.target.value) || 0)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Notice Period (Days)
                                  </label>
                                  <input
                                    type="number"
                                    value={p.noticePeriodDays ?? 30}
                                    onChange={(e) => updateCandidateField(idx, "noticePeriodDays", parseInt(e.target.value, 10) || 0)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Current CTC
                                  </label>
                                  <input
                                    type="text"
                                    value={p.currentCtc || ""}
                                    onChange={(e) => updateCandidateField(idx, "currentCtc", e.target.value)}
                                    placeholder="e.g. 24,00,000"
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Expected CTC
                                  </label>
                                  <input
                                    type="text"
                                    value={p.expectedCtc || ""}
                                    onChange={(e) => updateCandidateField(idx, "expectedCtc", e.target.value)}
                                    placeholder="e.g. 32,00,000"
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-mono font-bold text-emerald-800 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Phone / WhatsApp
                                  </label>
                                  <input
                                    type="text"
                                    value={p.phone || ""}
                                    onChange={(e) => updateCandidateField(idx, "phone", e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    value={p.email || ""}
                                    onChange={(e) => updateCandidateField(idx, "email", e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Skills */}
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Skills
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2 bg-white p-2 rounded-lg border border-slate-200 min-h-[36px]">
                                  {Array.isArray(p.skills) && p.skills.length > 0 ? (
                                    p.skills.map((sk: string, sIdx: number) => (
                                      <span
                                        key={sIdx}
                                        className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded flex items-center space-x-1"
                                      >
                                        <span>{sk}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSkill(sk, idx)}
                                          className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1 leading-none font-bold"
                                        >
                                          &times;
                                        </button>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[11px] italic">No skill tags extracted</span>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={newSkillInput}
                                    onChange={(e) => setNewSkillInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddSkill(idx);
                                      }
                                    }}
                                    placeholder="Add skill tag (press Enter)..."
                                    className="flex-1 px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddSkill(idx)}
                                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                  >
                                    + Add
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setExpandedEditIndex(null)}
                                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  Done Editing
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Action Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 gap-3">
                    <div className="text-[11px] text-slate-600 flex items-center space-x-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        {batchResults.filter((r) => r.success).length} Profile(s) ready to attach to '{mandate.title}'
                        {batchResults.some((r) => r.isMandateDuplicate) && (
                          <span className="text-amber-700 ml-1">
                            ({batchResults.filter((r) => r.isMandateDuplicate).length} existing profiles will be updated)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsIngestModalOpen(false);
                          setBatchResults([]);
                          setUploadFiles([]);
                          setParseError(null);
                          setExpandedEditIndex(null);
                        }}
                        className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBatchIngest}
                        disabled={savingBatch || batchResults.filter((r) => r.success).length === 0}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 text-xs"
                      >
                        {savingBatch ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                            <span>Attaching to Pipeline...</span>
                          </>
                        ) : (
                          <span>
                            Attach {batchResults.filter((r) => r.success).length} Candidate(s) to Mandate
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SHARE WITH CLIENT PORTAL (SMART HELPER)                         */}
      {/* ========================================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-blue-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Share Shortlist with Client Portal</h3>
                  <p className="text-[10px] text-blue-800">Initiates 48-Hour Feedback SLA Countdown</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]">
                <strong>⚡ Smart Sharing Filter:</strong> Candidates with call outcome <strong>"Connected — Interested & Profile Matched"</strong> and status <strong>"Not Shared with Company"</strong> are automatically highlighted.
              </div>

              <span className="font-bold text-slate-900 text-xs block">
                Select Candidates to Include in Shortlist Presentation:
              </span>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {candidates.map((c) => {
                  const isChecked = selectedForSharing.includes(c.candidateId);
                  const isReady = c.lastCallOutcome === "CONNECTED_INTERESTED" && c.status === "NOT_SHARED";

                  return (
                    <div
                      key={c.candidateId}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedForSharing(selectedForSharing.filter((id) => id !== c.candidateId));
                        } else {
                          setSelectedForSharing([...selectedForSharing, c.candidateId]);
                        }
                      }}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? "bg-blue-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{c.fullName}</span>
                          {isReady && (
                            <span className="bg-emerald-100 text-emerald-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300">
                              READY TO SHARE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.currentTitle} • Call Outcome: {c.lastCallOutcome ? c.lastCallOutcome.replace(/_/g, " ") : "Not Called"}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-600 h-4 w-4"
                      />
                    </div>
                  );
                })}
              </div>

              {generatedPortalUrl && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="font-extrabold text-emerald-900 text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Presentation Link Ready!</span>
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
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={generatingPortal || selectedForSharing.length === 0}
                  onClick={handleGenerateSharePortal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {generatingPortal ? "Generating..." : `Generate Link (${selectedForSharing.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER: FULL JD & SPECIFICATIONS                              */}
      {/* ========================================================================= */}
      {isJdDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mandate Specifications</span>
                <h2 className="text-base font-extrabold text-slate-900">{mandate.title}</h2>
                <p className="text-xs text-slate-600 font-medium">{mandate.client.name}</p>
              </div>
              <button
                onClick={() => setIsJdDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Commercial Terms Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {mandate.minExp && mandate.maxExp ? `${mandate.minExp}-${mandate.maxExp} Yrs` : mandate.minExp ? `${mandate.minExp}+ Yrs` : "Open"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target CTC</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {mandate.minCtc ? `₹${(mandate.minCtc / 100000).toFixed(1)}L` : "Open"} - {mandate.maxCtc ? `₹${(mandate.maxCtc / 100000).toFixed(1)}L` : "Open"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Work Mode</span>
                  <span className="font-extrabold text-slate-800 text-sm">{mandate.workMode}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
                  <span className="font-extrabold text-slate-800 text-sm">{mandate.location || "Flexible"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Recruiter Fee</span>
                  <span className="font-extrabold text-slate-800 text-sm">{mandate.feePercentage}% CTC</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Guarantee</span>
                  <span className="font-extrabold text-slate-800 text-sm">{mandate.guaranteeDays} Days</span>
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Required Skills & Competencies ({mandate.skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {mandate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-brand-surfaceLight border border-brand-surface text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Full JD Description */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Full Job Description
                </span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {mandate.description || "No full JD text provided for this mandate."}
                </div>
              </div>

              {/* Client Organization & Contact */}
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Client Organization & Hiring Lead
                </span>
                <div className="space-y-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 font-medium">Company:</span>{" "}
                    <strong>{mandate.client.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Industry:</span>{" "}
                    <strong>{mandate.client.industry || "Corporate / Technology"}</strong>
                  </div>
                  {mandate.contact ? (
                    <div className="border-t border-slate-200 pt-2 space-y-1.5">
                      <div>
                        <span className="text-slate-500 font-medium">Hiring Lead:</span>{" "}
                        <strong>{mandate.contact.name}</strong> ({mandate.contact.designation || "Lead"})
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{mandate.contact.email}</span>
                      </div>
                      {mandate.contact.phone && (
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{mandate.contact.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">No direct hiring contact assigned.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsJdDrawerOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsJdDrawerOpen(false);
                  setIsIngestModalOpen(true);
                }}
                className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center space-x-1.5"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>+ Ingest Resumes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. REMOVE CANDIDATE FROM MANDATE MODAL                                    */}
      {/* ========================================================================= */}
      {candidateToRemove && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Remove from Search Mandate</h3>
                  <p className="text-[10px] text-amber-800">Detaches candidate from this specific pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setCandidateToRemove(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-bold text-slate-900 text-sm">
                Remove <strong>{candidateToRemove.fullName}</strong> from <em>{mandate?.title}</em>?
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                <strong>Safety guarantee:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Candidate profile stays safe in your master <strong>Talent Bank pool</strong>.</li>
                  <li>Can be redeployed or attached to other searches anytime.</li>
                  <li>Any scheduled interview rounds for this mandate will be cancelled.</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCandidateToRemove(null)}
                  disabled={removingFromMandate}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRemoveFromMandate}
                  disabled={removingFromMandate}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {removingFromMandate ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Remove from Search</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOVE CANDIDATE TO TRASH BIN MODAL                                      */}
      {/* ========================================================================= */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-rose-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Move Candidate to Trash Bin</h3>
                  <p className="text-[10px] text-rose-700">Safely archives candidate profile and releases unique identifiers</p>
                </div>
              </div>
              <button
                onClick={() => setCandidateToDelete(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-bold text-slate-900 text-sm">
                Are you sure you want to permanently delete <strong>{candidateToDelete.fullName}</strong>?
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>What happens next:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Profile and timeline are moved to the <strong>Trash Bin</strong>.</li>
                  <li>Email and phone constraints are freed for future re-entries.</li>
                  <li>You can restore this profile anytime from the Trash Bin.</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCandidateToDelete(null)}
                  disabled={deletingCandidate}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteCandidate}
                  disabled={deletingCandidate}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {deletingCandidate ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Moving to Bin...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Move to Trash Bin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CLOSE / RETIRE MANDATE MODAL                                           */}
      {/* ========================================================================= */}
      {isCloseMandateModalOpen && mandate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Close / Retire Mandate</h3>
                  <p className="text-[10px] text-amber-800">Archive this search and recycle candidates</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloseMandateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-2">Select Close Reason / Status *</label>
                <div className="space-y-2">
                  <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    closeStatus === "CLOSED_FULFILLED" ? "bg-emerald-50/80 border-emerald-300" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="closeStatus"
                      value="CLOSED_FULFILLED"
                      checked={closeStatus === "CLOSED_FULFILLED"}
                      onChange={() => setCloseStatus("CLOSED_FULFILLED")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Position Fulfilled / Closed</span>
                      <span className="text-[11px] text-slate-500">Successfully hired candidate(s) for this position.</span>
                    </div>
                  </label>

                  <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    closeStatus === "CLOSED_CANCELLED" ? "bg-rose-50/80 border-rose-300" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="closeStatus"
                      value="CLOSED_CANCELLED"
                      checked={closeStatus === "CLOSED_CANCELLED"}
                      onChange={() => setCloseStatus("CLOSED_CANCELLED")}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Search Cancelled by Client</span>
                      <span className="text-[11px] text-slate-500">Hiring freeze, budget cancelled, or closed internally.</span>
                    </div>
                  </label>

                  <label className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    closeStatus === "CLOSED_ON_HOLD" ? "bg-amber-50/80 border-amber-300" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="closeStatus"
                      value="CLOSED_ON_HOLD"
                      checked={closeStatus === "CLOSED_ON_HOLD"}
                      onChange={() => setCloseStatus("CLOSED_ON_HOLD")}
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
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="e.g. Candidate joined on Sep 28. Search completed on target SLA."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recycleCandidates}
                    onChange={(e) => setRecycleCandidates(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-700 text-xs">
                    Tag unplaced candidates as <strong>Silver Medalists</strong> in Talent Bank
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCloseMandateModalOpen(false)}
                  disabled={updatingMandateStatus}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCloseMandate()}
                  disabled={updatingMandateStatus}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {updatingMandateStatus ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
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
      {/* 4. MOVE MANDATE TO TRASH BIN MODAL                                        */}
      {/* ========================================================================= */}
      {isDeleteMandateModalOpen && mandate && (
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
                onClick={() => setIsDeleteMandateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="font-bold text-slate-900 text-sm">
                Move mandate <strong>{mandate.title}</strong> ({mandate.client.name}) to Trash Bin?
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
                  onClick={() => setIsDeleteMandateModalOpen(false)}
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

