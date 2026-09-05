"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  User,
  Users,
  Search,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Briefcase,
  MapPin,
  Eye,
  ShieldCheck,
  Building2,
  Check,
  LogOut,
  ChevronRight,
  Filter,
  Lock,
  Award,
  Zap,
  RotateCcw,
  MessageSquare,
  Calendar,
  PhoneCall,
  Video,
  Send,
  ShieldAlert,
  FileCheck,
  Copy,
  AlertTriangle,
  Receipt,
  DollarSign,
  Shield,
  RefreshCw,
} from "lucide-react";

interface CandidateRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentCompany: string | null;
  currentTitle: string | null;
  totalExpYears: number;
  currentCtc: number | null;
  expectedCtc: number | null;
  currency: string;
  noticePeriodDays: number;
  location: string | null;
  skills: string[];
  summary: string | null;
  source: string;
  isSilverMedalist: boolean;
  silverMedalistReason: string | null;
  createdAt: string;
  submissions: Array<{
    id: string;
    stage: string;
    clientDecision?: string | null;
    clientQuestionText?: string | null;
    clientFeedbackNotes?: string | null;
    preferredInterviewTimes?: string | null;
    rejectionReason?: string | null;
    partnerSourcerName?: string | null;
    partnerSourcerEmail?: string | null;
    splitFeePercentage?: number | null;
    splitPayoutEstimated?: number | null;
    offeredCtc?: number | null;
    offeredJoiningDate?: string | null;
    resignationDate?: string | null;
    resignationConfirmed?: boolean;
    resignationLetterDraft?: string | null;
    counterOfferRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    counterOfferRiskReason?: string | null;
    lastRetentionPulseAt?: string | null;
    actualJoiningDate?: string | null;
    probationDays?: number;
    probationEndDate?: string | null;
    probationStatus?: "ACTIVE_TRACKING" | "CLEARED_SUCCESSFUL" | "EARLY_EXIT_REPLACEMENT";
    mandate: {
      id: string;
      title: string;
      feePercentage: number;
      guaranteeDays: number;
      client: { name: string };
    };
  }>;
}

interface ActiveMandateOption {
  id: string;
  title: string;
  client: { name: string };
}

export default function CandidateBankPage() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [mandates, setMandates] = useState<ActiveMandateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [silverFilter, setSilverFilter] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState(false);
  const [probationFilter, setProbationFilter] = useState(false);

  // Ingestion Modal State (RC-02)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rawTextSummary, setRawTextSummary] = useState<string>("");
  const [isDuplicate, setIsDuplicate] = useState(false);

  const [candidateForm, setCandidateForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    currentCompany: "",
    currentTitle: "",
    totalExpYears: 0,
    currentCtc: "",
    expectedCtc: "",
    currency: "INR",
    noticePeriodDays: 30,
    location: "",
    skills: "",
    summary: "",
    mandateId: "",
  });

  const [savingCandidate, setSavingCandidate] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Silver Medalist Tagging Modal State (RC-07)
  const [silverModalCandidate, setSilverModalCandidate] = useState<CandidateRecord | null>(null);
  const [silverReason, setSilverReason] = useState("");
  const [updatingSilver, setUpdatingSilver] = useState(false);

  // 1-Click Redeployment Modal State (RC-07)
  const [redeployCandidate, setRedeployCandidate] = useState<CandidateRecord | null>(null);
  const [redeployMandateId, setRedeployMandateId] = useState("");
  const [redeployNotes, setRedeployNotes] = useState("");
  const [redeploying, setRedeploying] = useState(false);

  // Multi-Channel Interview Scheduling Modal State (RC-04)
  const [scheduleModalCandidate, setScheduleModalCandidate] = useState<CandidateRecord | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: "",
    durationMinutes: 60,
    interviewType: "TECHNICAL_ROUND",
    meetingLink: "https://meet.google.com/xyz-rec-live",
    panelistNames: "Tech Lead, Engineering Manager",
    sendWhatsApp: true,
    sendEmail: true,
    instructions: "Please join with webcam enabled in a quiet room.",
  });
  const [scheduling, setScheduling] = useState(false);

  // Post-Interview Debrief Modal State (RC-05)
  const [debriefCandidate, setDebriefCandidate] = useState<CandidateRecord | null>(null);
  const [debriefForm, setDebriefForm] = useState({
    debriefNotes: "",
    candidateSentiment: "HIGH_ENTHUSIASM",
    salaryAlignmentNotes: "Expected compensation is firmly within agreed band.",
    noticePeriodConfirmed: 30,
    nextAction: "MOVE_TO_OFFER",
  });
  const [savingDebrief, setSavingDebrief] = useState(false);

  // Offer Lockdown & Resignation Playbook Modal State (RC-06)
  const [offerModalCandidate, setOfferModalCandidate] = useState<CandidateRecord | null>(null);
  const [offerForm, setOfferForm] = useState({
    offeredCtc: "",
    offeredJoiningDate: "",
    resignationDate: "",
    currentManagerName: "Reporting Manager",
    noticePeriodDays: 30,
    customResignationNotes: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [lockingOffer, setLockingOffer] = useState(false);

  // Retention Pulse Check Modal State (RC-06)
  const [pulseModalCandidate, setPulseModalCandidate] = useState<CandidateRecord | null>(null);
  const [pulseForm, setPulseForm] = useState({
    resignationConfirmed: true,
    counterOfferReceived: false,
    counterOfferAmount: "",
    counterOfferRiskLevel: "LOW" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    counterOfferRiskReason: "Candidate completed project handover docs and confirmed Day 1 joining.",
    candidateSentimentScore: 5,
    recruiterNotes: "Candidate in high spirits, no retention attempts made by manager.",
  });
  const [savingPulse, setSavingPulse] = useState(false);

  // Day-1 Physical Joining & Invoicing Modal State (PL-01, PL-02, RC-07)
  const [joiningCandidate, setJoiningCandidate] = useState<CandidateRecord | null>(null);
  const [joiningForm, setJoiningForm] = useState({
    actualJoiningDate: new Date().toISOString().slice(0, 10),
    agreedCtc: "",
    clientBillingName: "",
    clientBillingEmail: "billing@client.com",
    clientGstin: "27AABCU9603R1ZM",
    paymentTermsDays: 30,
  });
  const [confirmingPlacement, setConfirmingPlacement] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any | null>(null);

  // Early Exit $0 Replacement Modal State (RC-07)
  const [exitCandidate, setExitCandidate] = useState<CandidateRecord | null>(null);
  const [exitReason, setExitReason] = useState("Candidate resigned during probation to pursue alternative opportunity.");
  const [triggeringReplacement, setTriggeringReplacement] = useState(false);

  // Sanitized Client Profile Preview Modal
  const [previewCandidate, setPreviewCandidate] = useState<CandidateRecord | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/candidates?query=${encodeURIComponent(searchQuery)}&silver=${silverFilter}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          try {
            const data = JSON.parse(text);
            setCandidates(data.candidates || []);
          } catch (e) {
            console.error("Candidates JSON parse error:", e);
          }
        }
      }

      // Fetch active mandates for submission dropdown
      const mRes = await fetch("/api/mandates?scope=all");
      if (mRes.ok) {
        const mText = await mRes.text();
        if (mText && mText.trim()) {
          try {
            const mData = JSON.parse(mText);
            setMandates(mData.mandates || []);
            if (mData.mandates?.length > 0 && !redeployMandateId) {
              setRedeployMandateId(mData.mandates[0].id);
            }
          } catch (e) {
            console.error("Mandates JSON parse error:", e);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load candidates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [searchQuery, silverFilter]);

  // Filter candidates based on active view tab
  const displayedCandidates = candidates.filter((c) => {
    const stage = c.submissions[0]?.stage;
    if (noticeFilter) {
      return stage === "OFFER_ISSUED" || stage === "OFFER_ACCEPTED" || stage === "NOTICE_PERIOD_ACTIVE";
    }
    if (probationFilter) {
      return stage === "JOINED_DAY_1_ACTIVE";
    }
    return true;
  });

  // Handle Resume File Selection & AI Parsing
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadFile(file);
    setParsing(true);
    setParseError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/candidates/parse", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`Server returned invalid response: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse resume document.");
      }

      const p = data.parsed;
      setCandidateForm({
        fullName: p.fullName || "",
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
        skills: Array.isArray(p.skills) ? p.skills.join(", ") : "",
        summary: p.summary || "",
        mandateId: mandates[0]?.id || "",
      });

      setRawTextSummary(data.rawTextSummary || "");
      setIsDuplicate(data.isDuplicate || false);
    } catch (err: any) {
      setParseError(err.message || "Failed to parse resume with Gemini AI.");
    } finally {
      setParsing(false);
    }
  };

  // Save Candidate Profile
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCandidate(true);
    setParseError(null);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidateForm),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`Server returned invalid response: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to save candidate.");
      }

      setSuccessMessage(`Candidate '${data.candidate?.fullName || candidateForm.fullName}' ingested and parsed successfully!`);
      setIsImportModalOpen(false);
      setUploadFile(null);
      fetchCandidates();
    } catch (err: any) {
      setParseError(err.message || "Failed to save candidate.");
    } finally {
      setSavingCandidate(false);
    }
  };

  // Toggle Silver Medalist Tag (RC-07)
  const handleToggleSilver = async (candidate: CandidateRecord) => {
    const nextStatus = !candidate.isSilverMedalist;
    if (nextStatus) {
      setSilverModalCandidate(candidate);
      setSilverReason(candidate.silverMedalistReason || "Final round finalist pre-vetted in client interview rounds.");
    } else {
      try {
        const res = await fetch(`/api/candidates/${candidate.id}/silver-medalist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isSilverMedalist: false }),
        });
        if (res.ok) {
          setSuccessMessage(`Candidate '${candidate.fullName}' removed from Silver Medalist Vault.`);
          fetchCandidates();
        }
      } catch (err) {
        console.error("Error untagging silver medalist:", err);
      }
    }
  };

  const handleSaveSilverModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!silverModalCandidate) return;
    setUpdatingSilver(true);

    try {
      const res = await fetch(`/api/candidates/${silverModalCandidate.id}/silver-medalist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSilverMedalist: true, reason: silverReason }),
      });

      if (res.ok) {
        setSuccessMessage(`Candidate '${silverModalCandidate.fullName}' added to Silver Medalist Recycling Vault!`);
        setSilverModalCandidate(null);
        fetchCandidates();
      }
    } catch (err) {
      console.error("Error updating silver medalist:", err);
    } finally {
      setUpdatingSilver(false);
    }
  };

  // 1-Click Redeployment to Active Mandate (RC-07)
  const handleRedeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeployCandidate || !redeployMandateId) return;
    setRedeploying(true);

    try {
      const res = await fetch(`/api/candidates/${redeployCandidate.id}/redeploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMandateId: redeployMandateId,
          recruiterNotes: redeployNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to redeploy candidate.");
      }

      setSuccessMessage(`⚡ '${redeployCandidate.fullName}' instantly redeployed to '${json.mandate.title}' in stage SCREENED QUALIFIED!`);
      setRedeployCandidate(null);
      setRedeployNotes("");
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Redeployment failed.");
    } finally {
      setRedeploying(false);
    }
  };

  // Open Schedule Interview Modal (RC-04)
  const handleOpenScheduleModal = (candidate: CandidateRecord) => {
    setScheduleModalCandidate(candidate);
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
  };

  // Submit Schedule Interview (RC-04)
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalCandidate || scheduleModalCandidate.submissions.length === 0) return;
    setScheduling(true);

    try {
      const primarySub = scheduleModalCandidate.submissions[0];
      const res = await fetch("/api/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: primarySub.id,
          scheduledAt: scheduleForm.scheduledAt,
          durationMinutes: scheduleForm.durationMinutes,
          interviewType: scheduleForm.interviewType,
          meetingLink: scheduleForm.meetingLink,
          panelistNames: scheduleForm.panelistNames.split(",").map((s) => s.trim()).filter(Boolean),
          sendWhatsApp: scheduleForm.sendWhatsApp,
          sendEmail: scheduleForm.sendEmail,
          instructions: scheduleForm.instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule interview.");
      }

      setSuccessMessage(
        `📅 Interview confirmed for '${scheduleModalCandidate.fullName}'. WhatsApp briefing & calendar invites dispatched!`
      );
      setScheduleModalCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Scheduling failed.");
    } finally {
      setScheduling(false);
    }
  };

  // Open Debrief Modal (RC-05)
  const handleOpenDebriefModal = (candidate: CandidateRecord) => {
    setDebriefCandidate(candidate);
    setDebriefForm({
      debriefNotes: "Candidate demonstrated strong technical grasp, solid communication, and high cultural alignment.",
      candidateSentiment: "HIGH_ENTHUSIASM",
      salaryAlignmentNotes: "Salary expectations confirmed within client budget.",
      noticePeriodConfirmed: candidate.noticePeriodDays || 30,
      nextAction: "MOVE_TO_OFFER",
    });
  };

  // Submit Debrief (RC-05)
  const handleDebriefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debriefCandidate || debriefCandidate.submissions.length === 0) return;
    setSavingDebrief(true);

    try {
      const primarySub = debriefCandidate.submissions[0];
      const iRes = await fetch(`/api/interviews`);
      const iData = await iRes.json();
      const interview = (iData.interviews || []).find((i: any) => i.candidate?.id === debriefCandidate.id);

      if (!interview) {
        throw new Error("No active interview record found for this candidate.");
      }

      const res = await fetch(`/api/interviews/${interview.id}/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(debriefForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save debrief.");
      }

      setSuccessMessage(
        `📝 Debrief recorded for '${debriefCandidate.fullName}'. Candidate stage advanced to ${data.stage}!`
      );
      setDebriefCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to save debrief.");
    } finally {
      setSavingDebrief(false);
    }
  };

  // Open Offer Lockdown & Resignation Playbook Modal (RC-06)
  const handleOpenOfferModal = (candidate: CandidateRecord) => {
    setOfferModalCandidate(candidate);
    const sub = candidate.submissions[0];
    const defaultJoining = new Date();
    defaultJoining.setDate(defaultJoining.getDate() + (candidate.noticePeriodDays || 30));

    setOfferForm({
      offeredCtc: sub?.offeredCtc ? String(sub.offeredCtc) : candidate.expectedCtc ? String(candidate.expectedCtc) : "3200000",
      offeredJoiningDate: sub?.offeredJoiningDate ? new Date(sub.offeredJoiningDate).toISOString().slice(0, 10) : defaultJoining.toISOString().slice(0, 10),
      resignationDate: new Date().toISOString().slice(0, 10),
      currentManagerName: "Reporting Manager",
      noticePeriodDays: candidate.noticePeriodDays || 30,
      customResignationNotes: "",
    });
    setGeneratedLetter(sub?.resignationLetterDraft || null);
  };

  // Submit Pre-Offer Lockdown (RC-06)
  const handleOfferLockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModalCandidate || offerModalCandidate.submissions.length === 0) return;
    setLockingOffer(true);

    try {
      const sub = offerModalCandidate.submissions[0];
      const res = await fetch(`/api/offers/${sub.id}/pre-offer-lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredCtc: parseFloat(offerForm.offeredCtc),
          offeredJoiningDate: offerForm.offeredJoiningDate,
          resignationDate: offerForm.resignationDate,
          currentManagerName: offerForm.currentManagerName,
          noticePeriodDays: offerForm.noticePeriodDays,
          customResignationNotes: offerForm.customResignationNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to lock offer.");
      }

      setGeneratedLetter(data.resignationDraft);
      setSuccessMessage(
        `🎯 Offer locked for '${offerModalCandidate.fullName}' at ${(parseFloat(offerForm.offeredCtc) / 100000).toFixed(1)}L. Resignation draft generated!`
      );
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to lock offer.");
    } finally {
      setLockingOffer(false);
    }
  };

  // Open Retention Pulse Modal (RC-06)
  const handleOpenPulseModal = (candidate: CandidateRecord) => {
    setPulseModalCandidate(candidate);
    const sub = candidate.submissions[0];
    setPulseForm({
      resignationConfirmed: sub?.resignationConfirmed ?? true,
      counterOfferReceived: false,
      counterOfferAmount: "",
      counterOfferRiskLevel: sub?.counterOfferRiskLevel || "LOW",
      counterOfferRiskReason: sub?.counterOfferRiskReason || "Candidate completed project handover docs and confirmed Day 1 joining.",
      candidateSentimentScore: 5,
      recruiterNotes: "Candidate in high spirits, fully aligned on start date.",
    });
  };

  // Submit Retention Pulse (RC-06)
  const handlePulseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pulseModalCandidate || pulseModalCandidate.submissions.length === 0) return;
    setSavingPulse(true);

    try {
      const sub = pulseModalCandidate.submissions[0];
      const res = await fetch(`/api/offers/${sub.id}/retention-pulse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pulseForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log retention pulse.");
      }

      setSuccessMessage(
        `🛡️ Notice period check-in logged for '${pulseModalCandidate.fullName}'. Counter-offer risk: ${pulseForm.counterOfferRiskLevel}.`
      );
      setPulseModalCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to log pulse.");
    } finally {
      setSavingPulse(false);
    }
  };

  // Open Day-1 Joining & Invoicing Modal (PL-01, PL-02, RC-07)
  const handleOpenJoiningModal = (candidate: CandidateRecord) => {
    setJoiningCandidate(candidate);
    const sub = candidate.submissions[0];
    setJoiningForm({
      actualJoiningDate: new Date().toISOString().slice(0, 10),
      agreedCtc: sub?.offeredCtc ? String(sub.offeredCtc) : "3200000",
      clientBillingName: sub?.mandate?.client?.name || "Client Accounts",
      clientBillingEmail: "billing@client.com",
      clientGstin: "27AABCU9603R1ZM",
      paymentTermsDays: 30,
    });
    setGeneratedInvoice(null);
  };

  // Submit Day-1 Joining & Invoicing (PL-01, PL-02, RC-07)
  const handleConfirmJoiningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningCandidate || joiningCandidate.submissions.length === 0) return;
    setConfirmingPlacement(true);

    try {
      const sub = joiningCandidate.submissions[0];
      const res = await fetch(`/api/placements/${sub.id}/confirm-joining`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joiningForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm placement.");
      }

      setGeneratedInvoice(data.invoice);
      setSuccessMessage(
        `🎉 Day 1 Joining Confirmed for '${joiningCandidate.fullName}'. Tax invoice '${data.invoice?.invoiceNumber}' generated and 90-day guarantee started!`
      );
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to confirm joining.");
    } finally {
      setConfirmingPlacement(false);
    }
  };

  // Open Early Exit $0 Replacement Modal (RC-07)
  const handleOpenExitModal = (candidate: CandidateRecord) => {
    setExitCandidate(candidate);
    setExitReason("Candidate left organization during 90-day guarantee period. Initiating $0 replacement mandate.");
  };

  // Submit $0 Free Replacement Mandate (RC-07)
  const handleTriggerReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitCandidate || exitCandidate.submissions.length === 0) return;
    setTriggeringReplacement(true);

    try {
      const sub = exitCandidate.submissions[0];
      const res = await fetch(`/api/placements/${sub.id}/trigger-replacement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ earlyExitReason: exitReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger replacement.");
      }

      setSuccessMessage(
        `⚡ $0 Free Replacement Mandate '${data.replacementMandate.title}' activated! Silver Medalist Vault unlocked.`
      );
      setExitCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      alert(err.message || "Failed to trigger replacement.");
    } finally {
      setTriggeringReplacement(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Cockpit Navigation Bar */}
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
                    <span className="bg-brand-surfaceLight text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-brand-surface uppercase">
                      {session?.user?.agencyName || "Agency Cockpit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-2">
                <Link
                  href="/cockpit"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Mandates & SLA Radar
                </Link>
                <Link
                  href="/cockpit/candidates"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-xs"
                >
                  Candidate Bank & Placements (PL-01, PL-02)
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-brand-surfaceLight px-3 py-1.5 rounded-lg border border-brand-surface text-xs font-semibold text-slate-800">
                <span>{session?.user?.name}</span>
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
        {/* Success Banner */}
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

        {/* Candidate Bank Header & Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-slate-800" />
              <h1 className="text-base font-extrabold text-slate-900">Permanent Agency Talent Bank</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Day-1 Physical Verification (PL-01), Auto-Invoicing (PL-02), and 90-Day Probation Guarantee Vault (RC-07).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setUploadFile(null);
                setParseError(null);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>+ Import & Parse Resumes (Gemini AI)</span>
            </button>
          </div>
        </div>

        {/* Table Filters & Views */}
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
                placeholder="Search candidate name, skill, company, title..."
                className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center space-x-2.5">
              {/* 90-Day Probation Vault Filter (RC-07, PL-01) */}
              <button
                onClick={() => {
                  setProbationFilter(!probationFilter);
                  if (!probationFilter) {
                    setNoticeFilter(false);
                    setSilverFilter(false);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  probationFilter
                    ? "bg-emerald-100 border-emerald-400 text-emerald-900 shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Shield className={`h-3.5 w-3.5 ${probationFilter ? "text-emerald-700" : "text-slate-400"}`} />
                <span>90-Day Guarantee Vault (RC-07)</span>
                {probationFilter && <Check className="h-3 w-3 text-emerald-800 ml-1" />}
              </button>

              {/* Notice Period Risk Board Filter (RC-06) */}
              <button
                onClick={() => {
                  setNoticeFilter(!noticeFilter);
                  if (!noticeFilter) {
                    setProbationFilter(false);
                    setSilverFilter(false);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  noticeFilter
                    ? "bg-purple-100 border-purple-400 text-purple-900 shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ShieldAlert className={`h-3.5 w-3.5 ${noticeFilter ? "text-purple-700" : "text-slate-400"}`} />
                <span>Notice Risk Board (RC-06)</span>
                {noticeFilter && <Check className="h-3 w-3 text-purple-800 ml-1" />}
              </button>

              {/* Silver Medalist Filter (RC-07) */}
              <button
                onClick={() => {
                  setSilverFilter(!silverFilter);
                  if (!silverFilter) {
                    setProbationFilter(false);
                    setNoticeFilter(false);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  silverFilter
                    ? "bg-amber-100 border-amber-400 text-amber-900 shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Award className={`h-3.5 w-3.5 ${silverFilter ? "text-amber-700" : "text-slate-400"}`} />
                <span>Silver Vault (RC-07)</span>
                {silverFilter && <Check className="h-3 w-3 text-amber-800 ml-1" />}
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-medium">Loading candidate bank...</p>
            </div>
          ) : displayedCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No candidate profiles found</p>
              <p className="text-xs text-slate-400 mt-1">
                {probationFilter
                  ? "No placements currently under 90-day probation tracking."
                  : noticeFilter
                  ? "No candidates currently in offer or notice period stage."
                  : silverFilter
                  ? "No candidates currently tagged as Silver Medalists."
                  : "Click '+ Import & Parse Resumes' to ingest candidate CVs via the Gemini AI parser."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-brand-surfaceLight text-slate-700 uppercase font-semibold tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Candidate & Role
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Experience & Notice
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Compensation (CTC)
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Top Skills
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Pipeline & Commercial Guarantee (PL-01, RC-07)
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Stage Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {displayedCandidates.map((c) => {
                    const primarySub = c.submissions[0];
                    const isScheduled = primarySub?.stage === "INTERVIEW_SCHEDULED";
                    const isCompleted = primarySub?.stage === "INTERVIEW_COMPLETED";
                    const isShortlisted = primarySub?.stage === "CLIENT_SHORTLISTED";
                    const isOfferStage = primarySub?.stage === "OFFER_ISSUED" || primarySub?.stage === "OFFER_ACCEPTED";
                    const isNoticeStage = primarySub?.stage === "NOTICE_PERIOD_ACTIVE";
                    const isJoined = primarySub?.stage === "JOINED_DAY_1_ACTIVE";

                    const riskLevel = primarySub?.counterOfferRiskLevel || "LOW";
                    const riskColors = {
                      LOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
                      MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
                      HIGH: "bg-orange-100 text-orange-800 border-orange-300",
                      CRITICAL: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
                    };

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-extrabold text-slate-800 text-xs">
                              {c.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>{c.fullName}</span>
                                {c.isSilverMedalist && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center space-x-0.5">
                                    <Award className="h-2.5 w-2.5 text-amber-700" />
                                    <span>SILVER MEDALIST</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {c.currentTitle || "Software Professional"} {c.currentCompany ? `at ${c.currentCompany}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-slate-800 font-semibold">{c.totalExpYears} Years Exp</div>
                          <div className="text-[10px] text-slate-500">{c.noticePeriodDays} Days Notice</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {c.currentCtc ? `${(c.currentCtc / 100000).toFixed(1)}L` : "N/A"} →{" "}
                            <span className="text-emerald-700">{c.expectedCtc ? `${(c.expectedCtc / 100000).toFixed(1)}L ${c.currency}` : "N/A"}</span>
                          </div>
                          {primarySub?.offeredCtc && (
                            <div className="text-[10px] text-purple-700 font-extrabold">
                              Offered: {(primarySub.offeredCtc / 100000).toFixed(1)}L
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {c.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {c.skills.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{c.skills.length - 3}</span>
                            )}
                          </div>
                        </td>

                        {/* Pipeline Stage & Commercial 90-Day Guarantee Tracker (PL-01, RC-07) */}
                        <td className="px-6 py-4">
                          {primarySub ? (
                            <div className="space-y-1 max-w-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                  isJoined
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : isNoticeStage
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : isOfferStage
                                    ? "bg-purple-100 text-purple-800 border-purple-300"
                                    : isScheduled
                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}>
                                  {primarySub.stage.replace(/_/g, " ")}
                                </span>

                                {/* 90-Day Probation Guarantee Status */}
                                {isJoined && primarySub.probationEndDate && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                                    <Shield className="h-2.5 w-2.5 text-blue-700" />
                                    <span>
                                      {primarySub.probationStatus === "EARLY_EXIT_REPLACEMENT"
                                        ? "Replacement Triggered"
                                        : `90d Guarantee Active`}
                                    </span>
                                  </span>
                                )}

                                {/* Partner Split Pill */}
                                {primarySub.partnerSourcerName && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <Lock className="h-2.5 w-2.5 text-emerald-700" />
                                    <span>{primarySub.splitFeePercentage || 50}% Split</span>
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-500 font-medium truncate">
                                {primarySub.mandate.title} ({primarySub.mandate.client.name})
                              </div>

                              {/* Start Date & Guarantee End */}
                              {isJoined && primarySub.actualJoiningDate && (
                                <div className="text-[10px] text-emerald-800 font-bold flex items-center space-x-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>Joined: {new Date(primarySub.actualJoiningDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">In Talent Pool</span>
                          )}
                        </td>

                        {/* Stage Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                          {primarySub && (
                            <>
                              {/* Sourcing & Shortlisted stages: can schedule interview */}
                              {(primarySub.stage === "CLIENT_SHORTLISTED" ||
                                primarySub.stage === "SCREENED_QUALIFIED" ||
                                primarySub.stage === "SUBMITTED_TO_CLIENT") && (
                                <button
                                  onClick={() => handleOpenScheduleModal(c)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                >
                                  <Calendar className="h-3 w-3" />
                                  <span>Schedule Interview</span>
                                </button>
                              )}

                              {/* Interview Scheduled: Log Debrief */}
                              {primarySub.stage === "INTERVIEW_SCHEDULED" && (
                                <button
                                  onClick={() => handleOpenDebriefModal(c)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  <span>Log Debrief</span>
                                </button>
                              )}

                              {/* Interview Completed: Next Round or Move to Offer */}
                              {primarySub.stage === "INTERVIEW_COMPLETED" && (
                                <div className="inline-flex items-center space-x-1">
                                  <button
                                    onClick={() => handleOpenScheduleModal(c)}
                                    className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-lg text-xs transition-all cursor-pointer"
                                    title="Schedule Next Round"
                                  >
                                    <Calendar className="h-3 w-3" />
                                    <span>Next Round</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenOfferModal(c)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                  >
                                    <Zap className="h-3 w-3" />
                                    <span>Lock Offer & Playbook</span>
                                  </button>
                                </div>
                              )}

                              {/* Offer Stage: Manage Offer & Confirm Joining */}
                              {isOfferStage && (
                                <div className="inline-flex items-center space-x-1">
                                  <button
                                    onClick={() => handleOpenOfferModal(c)}
                                    className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-lg text-xs transition-all cursor-pointer"
                                  >
                                    <FileCheck className="h-3 w-3" />
                                    <span>Offer</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenJoiningModal(c)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                  >
                                    <Receipt className="h-3 w-3" />
                                    <span>Confirm Joining</span>
                                  </button>
                                </div>
                              )}

                              {/* Notice Period Active: Confirm Day 1 Joining or Pulse Check */}
                              {isNoticeStage && (
                                <div className="inline-flex items-center space-x-1">
                                  <button
                                    onClick={() => handleOpenPulseModal(c)}
                                    className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs transition-all cursor-pointer"
                                  >
                                    <ShieldAlert className="h-3 w-3 text-amber-700" />
                                    <span>Pulse Check</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenJoiningModal(c)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                                  >
                                    <Receipt className="h-3 w-3" />
                                    <span>Confirm Joining</span>
                                  </button>
                                </div>
                              )}

                              {/* Joined Day 1 Active: 90-Day Guarantee & Early Exit Trigger */}
                              {isJoined && (
                                <div className="inline-flex items-center space-x-1">
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold rounded-lg text-xs">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    <span>Invoiced (PL-02)</span>
                                  </span>

                                  {primarySub.probationStatus !== "EARLY_EXIT_REPLACEMENT" && (
                                    <button
                                      onClick={() => handleOpenExitModal(c)}
                                      className="inline-flex items-center space-x-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                      title="Trigger $0 Free Replacement Mandate if candidate leaves during 90-day probation"
                                    >
                                      <RefreshCw className="h-3 w-3 text-rose-600" />
                                      <span>$0 Replacement</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {c.isSilverMedalist && (
                            <button
                              onClick={() => {
                                setRedeployCandidate(c);
                                setRedeployNotes(`Redeploying Silver Medalist '${c.fullName}' with pre-vetted experience.`);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                            >
                              <Zap className="h-3 w-3" />
                              <span>1-Click Redeploy</span>
                            </button>
                          )}

                          <button
                            onClick={() => setPreviewCandidate(c)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-brand-surfaceLight hover:bg-brand-surface border border-brand-surfaceDark text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Preview</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: CONFIRM DAY-1 PHYSICAL JOINING & AUTO-INVOICE (PL-01, PL-02, RC-07) */}
      {joiningCandidate && joiningCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-emerald-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Confirm Day-1 Physical Joining & Generate Commercial Tax Invoice (PL-01, PL-02)
                  </h3>
                  <p className="text-[10px] text-emerald-800">
                    Candidate: <strong>{joiningCandidate.fullName}</strong> • {joiningCandidate.submissions[0].mandate.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setJoiningCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleConfirmJoiningSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Actual Physical Start Date *</label>
                    <input
                      type="date"
                      required
                      value={joiningForm.actualJoiningDate}
                      onChange={(e) => setJoiningForm({ ...joiningForm, actualJoiningDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Final Agreed CTC (INR) *</label>
                    <input
                      type="number"
                      required
                      value={joiningForm.agreedCtc}
                      onChange={(e) => setJoiningForm({ ...joiningForm, agreedCtc: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Client Accounts / Billing Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={joiningForm.clientBillingEmail}
                      onChange={(e) => setJoiningForm({ ...joiningForm, clientBillingEmail: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Client GSTIN / Tax ID (Optional)</label>
                    <input
                      type="text"
                      value={joiningForm.clientGstin}
                      onChange={(e) => setJoiningForm({ ...joiningForm, clientGstin: e.target.value })}
                      placeholder="27AABCU9603R1ZM"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>

                {/* Instant Placement Invoicing Breakdown */}
                {joiningForm.agreedCtc && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="font-bold text-slate-900 text-xs block">Commercial Invoice Calculation Preview</span>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Agreed Placement Fee:</span>
                        <strong className="text-slate-900">
                          {joiningCandidate.submissions[0].mandate.feePercentage || 8.33}% of Annual CTC
                        </strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Base Agency Fee:</span>
                        <strong className="text-slate-900">
                          ₹{(
                            (parseFloat(joiningForm.agreedCtc) * (joiningCandidate.submissions[0].mandate.feePercentage || 8.33)) /
                            100
                          ).toLocaleString()}
                        </strong>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-emerald-800 block text-[10px]">Total (+ 18% GST):</span>
                        <strong className="text-emerald-950 text-xs">
                          ₹{Math.round(
                            ((parseFloat(joiningForm.agreedCtc) * (joiningCandidate.submissions[0].mandate.feePercentage || 8.33)) /
                              100) *
                              1.18
                          ).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setJoiningCandidate(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirmingPlacement}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>{confirmingPlacement ? "Generating Tax Invoice..." : "Confirm Joining & Dispatch Invoice"}</span>
                  </button>
                </div>
              </form>

              {/* Generated Invoice Card */}
              {generatedInvoice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-xs flex items-center space-x-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Commercial Invoice Dispatched: {generatedInvoice.invoiceNumber}</span>
                    </span>
                    <span className="bg-emerald-200 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Due in 30 Days
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Total Invoiced Amount: <strong>₹{generatedInvoice.totalInvoiceAmount.toLocaleString()} INR</strong>. 90-Day replacement guarantee active until{" "}
                    <strong>{new Date(Date.now() + 90 * 24 * 3600 * 1000).toLocaleDateString()}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EARLY EXIT $0 FREE REPLACEMENT TRIGGER (RC-07) */}
      {exitCandidate && exitCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-rose-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Trigger $0 Free Replacement Mandate (RC-07)
                  </h3>
                  <p className="text-[10px] text-rose-800">
                    Candidate: <strong>{exitCandidate.fullName}</strong> • 90-Day Guarantee Policy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExitCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleTriggerReplacementSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <strong>🛡️ 100% Free Replacement Guarantee:</strong>
                <p>
                  Since {exitCandidate.fullName} exited during the active 90-day guarantee period, a new replacement mandate with <strong>$0 agency fee (100% fee credit)</strong> will be cloned instantly.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Reason for Early Exit / Replacement *</label>
                <textarea
                  rows={3}
                  required
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExitCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggeringReplacement}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{triggeringReplacement ? "Cloning $0 Mandate..." : "Activate $0 Free Replacement Search"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OFFER LOCKDOWN & RESIGNATION PLAYBOOK (RC-06) */}
      {offerModalCandidate && offerModalCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Pre-Offer Lockdown & Counter-Offer Immunity (RC-06)
                  </h3>
                  <p className="text-[10px] text-purple-800">
                    Candidate: <strong>{offerModalCandidate.fullName}</strong> • {offerModalCandidate.submissions[0].mandate.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOfferModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <form onSubmit={handleOfferLockSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Offered Annual CTC (INR) *</label>
                    <input
                      type="number"
                      required
                      value={offerForm.offeredCtc}
                      onChange={(e) => setOfferForm({ ...offerForm, offeredCtc: e.target.value })}
                      placeholder="3200000"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Agreed Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={offerForm.offeredJoiningDate}
                      onChange={(e) => setOfferForm({ ...offerForm, offeredJoiningDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Reporting Manager</label>
                    <input
                      type="text"
                      value={offerForm.currentManagerName}
                      onChange={(e) => setOfferForm({ ...offerForm, currentManagerName: e.target.value })}
                      placeholder="e.g. Suresh Kumar (VP Engineering)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notice Period (Days)</label>
                    <input
                      type="number"
                      value={offerForm.noticePeriodDays}
                      onChange={(e) => setOfferForm({ ...offerForm, noticePeriodDays: parseInt(e.target.value, 10) || 30 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={lockingOffer}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{lockingOffer ? "Locking & Generating..." : "Lock Offer & Generate Resignation Draft"}</span>
                  </button>
                </div>
              </form>

              {/* Generated Resignation Letter Draft */}
              {generatedLetter && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>Formal Resignation Letter Draft (Counter-Offer Immunized)</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLetter);
                        alert("Resignation draft copied to clipboard!");
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Letter</span>
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {generatedLetter}
                  </div>

                  {/* Counter-Offer Immunization Talking Points (RC-06) */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-[11px] text-amber-950">
                    <span className="font-bold block text-amber-900">
                      🛡️ Counter-Offer Immunization Talking Points for Recruiter Check-in:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-amber-900">
                      <li><strong>Remind:</strong> 80%+ of people who accept a counter-offer still leave within 6 months.</li>
                      <li><strong>Firm Boundary:</strong> "Thank you for the counter-offer, but my decision is driven by the leadership scope and long-term career direction."</li>
                      <li><strong>No Hesitation:</strong> Submit resignation in writing within 24 hours of accepting the offer.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BI-WEEKLY RETENTION PULSE CHECK (RC-06) */}
      {pulseModalCandidate && pulseModalCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Notice Period Retention Pulse Check (RC-06)</h3>
                  <p className="text-[10px] text-amber-800">Candidate: {pulseModalCandidate.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setPulseModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePulseSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Resignation Submitted?</label>
                  <select
                    value={pulseForm.resignationConfirmed ? "yes" : "no"}
                    onChange={(e) => setPulseForm({ ...pulseForm, resignationConfirmed: e.target.value === "yes" })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value="yes">✅ Yes, Resignation Formally Logged</option>
                    <option value="no">⏳ Pending / In Conversation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Counter-Offer Made?</label>
                  <select
                    value={pulseForm.counterOfferReceived ? "yes" : "no"}
                    onChange={(e) => setPulseForm({ ...pulseForm, counterOfferReceived: e.target.value === "yes" })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                  >
                    <option value="no">🛡️ No Counter-Offer (Smooth Exit)</option>
                    <option value="yes">⚠️ Yes, Current Employer Matched/Offered Perks</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-900 mb-1">Counter-Offer Risk Level *</label>
                  <select
                    value={pulseForm.counterOfferRiskLevel}
                    onChange={(e) => setPulseForm({ ...pulseForm, counterOfferRiskLevel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  >
                    <option value="LOW">🟢 LOW — Handover in progress, zero retention risk</option>
                    <option value="MEDIUM">🟡 MEDIUM — Manager requested discussion, candidate holding firm</option>
                    <option value="HIGH">🟠 HIGH — Formal counter-offer on table, needs intervention</option>
                    <option value="CRITICAL">🔴 CRITICAL — Candidate wavering, risk of back-out</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Risk Context & Observations</label>
                  <input
                    type="text"
                    value={pulseForm.counterOfferRiskReason}
                    onChange={(e) => setPulseForm({ ...pulseForm, counterOfferRiskReason: e.target.value })}
                    placeholder="e.g. Candidate confirmed KT handover schedule with team lead."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Recruiter Call Debrief Notes</label>
                  <textarea
                    rows={2}
                    value={pulseForm.recruiterNotes}
                    onChange={(e) => setPulseForm({ ...pulseForm, recruiterNotes: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPulseModalCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPulse}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingPulse ? "Logging..." : "Save Pulse Check & Update Risk Score"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MULTI-CHANNEL INTERVIEW SCHEDULING (RC-04) */}
      {scheduleModalCandidate && scheduleModalCandidate.submissions.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Schedule Interview & Multi-Channel Dispatch (RC-04)</h3>
                  <p className="text-[10px] text-purple-800">
                    Candidate: <strong>{scheduleModalCandidate.fullName}</strong> • {scheduleModalCandidate.submissions[0].mandate.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
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
                    onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(e.target.value, 10) || 60 })}
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
                    📱 <strong>WhatsApp Candidate Briefing</strong> to {scheduleModalCandidate.phone || "Candidate Phone"} (Instant Prep Guidance)
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
                    ✉️ <strong>Calendar Email Invite</strong> to {scheduleModalCandidate.email}
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {scheduling ? (
                    <span>Dispatching Logistics...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Lock Slot & Dispatch (WhatsApp + Email)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST-INTERVIEW DEBRIEF (RC-05) */}
      {debriefCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-emerald-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Post-Interview Debrief & Feedback Capture (RC-05)</h3>
                  <p className="text-[10px] text-emerald-800">Candidate: {debriefCandidate.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setDebriefCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDebriefSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Candidate Sentiment & Enthusiasm *</label>
                <select
                  value={debriefForm.candidateSentiment}
                  onChange={(e) => setDebriefForm({ ...debriefForm, candidateSentiment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                >
                  <option value="HIGH_ENTHUSIASM">🔥 High Enthusiasm (Top Choice for Candidate)</option>
                  <option value="POSITIVE_RECEPTIVE">👍 Positive & Receptive</option>
                  <option value="CAUTIOUS_CONCERNS">⚠️ Cautious / Had Counter-Offer or Commute Questions</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Debrief & Panel Feedback Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={debriefForm.debriefNotes}
                  onChange={(e) => setDebriefForm({ ...debriefForm, debriefNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirmed Notice Period (Days)</label>
                  <input
                    type="number"
                    value={debriefForm.noticePeriodConfirmed}
                    onChange={(e) => setDebriefForm({ ...debriefForm, noticePeriodConfirmed: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Next Action *</label>
                  <select
                    value={debriefForm.nextAction}
                    onChange={(e) => setDebriefForm({ ...debriefForm, nextAction: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                  >
                    <option value="MOVE_TO_OFFER">🎯 Move to Offer Stage</option>
                    <option value="NEXT_ROUND">🔁 Schedule Next Interview Round</option>
                    <option value="REJECT">❌ Reject & Auto-Recycle to Silver Vault</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDebriefCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDebrief}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingDebrief ? "Recording Debrief..." : "Save Debrief & Advance Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: SILVER MEDALIST TAGGING & REASON (RC-07) */}
      {silverModalCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Add to Silver Medalist Vault (RC-07)</h3>
                  <p className="text-[10px] text-amber-800">Tag high-caliber finalist for cross-mandate redeployment</p>
                </div>
              </div>
              <button
                onClick={() => setSilverModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSilverModal} className="p-6 space-y-4">
              <div>
                <span className="font-bold text-slate-900 text-sm block mb-1">
                  Candidate: {silverModalCandidate.fullName}
                </span>
                <p className="text-slate-500 text-[11px]">
                  {silverModalCandidate.currentTitle} • {silverModalCandidate.totalExpYears} Years Exp
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Qualification Context / Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={silverReason}
                  onChange={(e) => setSilverReason(e.target.value)}
                  placeholder="e.g. Final round finalist at FinTech Unicorn — Client selected internal candidate. Stellar system design feedback."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSilverModalCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSilver}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {updatingSilver ? "Tagging..." : "Tag as Silver Medalist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-CLICK INSTANT REDEPLOYMENT (RC-07) */}
      {redeployCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">1-Click Instant Redeployment (RC-07)</h3>
                  <p className="text-[10px] text-slate-500">Jumpstart active search pipeline with pre-vetted finalist</p>
                </div>
              </div>
              <button
                onClick={() => setRedeployCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRedeploySubmit} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 text-sm block">
                  {redeployCandidate.fullName}
                </span>
                <div className="text-[11px] text-slate-500">
                  {redeployCandidate.currentTitle} • {redeployCandidate.totalExpYears} Years Exp • {redeployCandidate.noticePeriodDays} Days Notice
                </div>
                {redeployCandidate.silverMedalistReason && (
                  <div className="mt-1 text-[10px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Vault Context:</strong> {redeployCandidate.silverMedalistReason}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Target Active Hiring Mandate *
                </label>
                <select
                  required
                  value={redeployMandateId}
                  onChange={(e) => setRedeployMandateId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                >
                  {mandates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.client.name})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Promotes candidate directly to <strong>SCREENED QUALIFIED</strong> (skips raw sourcing).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recruiter Redeployment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={redeployNotes}
                  onChange={(e) => setRedeployNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRedeployCandidate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeploying}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {redeploying ? (
                    <span>Redeploying...</span>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-slate-900" />
                      <span>Instant Redeploy (Zero Latency)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SPLIT-SCREEN RESUME INGESTION & GEMINI AI PARSER MODAL (RC-02) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 text-sm">AI Resume Parser & Clean Profile Ingestion (RC-02)</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {parseError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {!uploadFile && (
                <div className="border-2 border-dashed border-slate-300 hover:border-brand-surfaceDark rounded-3xl p-10 text-center bg-slate-50/50">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    id="modal-resume-upload"
                    className="hidden"
                  />
                  <label htmlFor="modal-resume-upload" className="cursor-pointer block">
                    <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                    <span className="font-extrabold text-slate-900 text-sm hover:underline">
                      Drag & Drop Candidate Resume (PDF / DOCX)
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Gemini AI will automatically extract full work history, skills, contact info, and notice period.
                    </p>
                  </label>
                </div>
              )}

              {parsing && (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-bold text-slate-800">
                    Extracting & Structuring Entities with Google Gemini API...
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Sanitizing contact info and checking for duplicate profiles.
                  </p>
                </div>
              )}

              {uploadFile && !parsing && (
                <form onSubmit={handleSaveCandidate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span>{uploadFile.name}</span>
                      </span>
                      <label htmlFor="replace-upload" className="text-[10px] font-bold text-slate-600 hover:underline cursor-pointer">
                        Replace File
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                        id="replace-upload"
                        className="hidden"
                      />
                    </div>

                    {isDuplicate ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-medium flex items-start space-x-1.5">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Duplicate Detected:</strong> This candidate's email or phone matches an existing record. Saving will update the candidate profile and avoid duplicate sourcing.
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-medium flex items-center space-x-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Duplicate Check Passed — New Unique Candidate</span>
                      </div>
                    )}

                    <div>
                      <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                        Raw Text Preview
                      </span>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 h-48 overflow-y-auto font-mono text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {rawTextSummary || "Raw text extracted from document."}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 text-xs mb-1">
                        Assign to Active Hiring Mandate (Optional)
                      </label>
                      <select
                        value={candidateForm.mandateId}
                        onChange={(e) => setCandidateForm({ ...candidateForm, mandateId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                      >
                        <option value="">General Talent Pool (No active mandate)</option>
                        {mandates.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title} ({m.client.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="col-span-2">
                        <label className="block font-semibold text-slate-700 mb-0.5">Candidate Full Name *</label>
                        <input
                          type="text"
                          required
                          value={candidateForm.fullName}
                          onChange={(e) => setCandidateForm({ ...candidateForm, fullName: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={candidateForm.email}
                          onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Phone / WhatsApp *</label>
                        <input
                          type="text"
                          required
                          value={candidateForm.phone}
                          onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Current Job Title</label>
                        <input
                          type="text"
                          value={candidateForm.currentTitle}
                          onChange={(e) => setCandidateForm({ ...candidateForm, currentTitle: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Current Employer</label>
                        <input
                          type="text"
                          value={candidateForm.currentCompany}
                          onChange={(e) => setCandidateForm({ ...candidateForm, currentCompany: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Total Experience (Yrs)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={candidateForm.totalExpYears}
                          onChange={(e) => setCandidateForm({ ...candidateForm, totalExpYears: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Notice Period (Days)</label>
                        <input
                          type="number"
                          value={candidateForm.noticePeriodDays}
                          onChange={(e) => setCandidateForm({ ...candidateForm, noticePeriodDays: parseInt(e.target.value, 10) || 30 })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Current CTC (Annual)</label>
                        <input
                          type="number"
                          value={candidateForm.currentCtc}
                          onChange={(e) => setCandidateForm({ ...candidateForm, currentCtc: e.target.value })}
                          placeholder="e.g. 2400000"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-0.5">Expected CTC</label>
                        <input
                          type="number"
                          value={candidateForm.expectedCtc}
                          onChange={(e) => setCandidateForm({ ...candidateForm, expectedCtc: e.target.value })}
                          placeholder="e.g. 3200000"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-semibold text-slate-700 mb-0.5">Skills (Comma separated)</label>
                        <input
                          type="text"
                          value={candidateForm.skills}
                          onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-semibold text-slate-700 mb-0.5">Executive Summary</label>
                        <textarea
                          rows={2}
                          value={candidateForm.summary}
                          onChange={(e) => setCandidateForm({ ...candidateForm, summary: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setUploadFile(null)}
                        className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingCandidate}
                        className="px-5 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        {savingCandidate ? "Ingesting..." : "Save & Ingest Candidate"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SANITIZED CLIENT PREVIEW MODAL */}
      {previewCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-slate-800" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Sanitized Client Presentation View</h3>
                  <p className="text-[10px] text-slate-500">Contact PII stripped for external client shortlist sharing</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewCandidate(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-black text-slate-900 text-base">{previewCandidate.fullName}</h4>
                <p className="text-xs text-slate-600 font-medium">
                  {previewCandidate.currentTitle || "Senior Professional"} • {previewCandidate.totalExpYears} Years Total Experience
                </p>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2 font-medium">
                  <span>Notice Period: <strong>{previewCandidate.noticePeriodDays} Days</strong></span>
                  <span>•</span>
                  <span>
                    Expected CTC:{" "}
                    <strong>
                      {previewCandidate.expectedCtc ? `${(previewCandidate.expectedCtc / 100000).toFixed(1)}L ${previewCandidate.currency}` : "Negotiable"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Client Portal Feedback / Inquiry Log */}
              {previewCandidate.submissions.length > 0 && previewCandidate.submissions[0].clientQuestionText && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-blue-800">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>Inquiry from Client Hiring Manager (CL-02):</span>
                  </div>
                  <p className="italic bg-white p-2.5 rounded-lg border border-blue-200 text-slate-800">
                    "{previewCandidate.submissions[0].clientQuestionText}"
                  </p>
                </div>
              )}

              {previewCandidate.summary && (
                <div>
                  <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                    Candidate Executive Summary
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {previewCandidate.summary}
                  </p>
                </div>
              )}

              <div>
                <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1.5">
                  Verified Skills & Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {previewCandidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="bg-brand-surfaceLight border border-brand-surface text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Phone numbers and personal emails are completely stripped for client privacy.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
