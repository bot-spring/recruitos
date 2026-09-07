"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Building2,
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  LogOut,
  Sparkles,
  Layers,
  Settings,
  Globe,
  Lock,
  Mail,
  User,
  AlertCircle,
  Edit2,
  DollarSign,
  TrendingUp,
  Receipt,
  Award,
  Activity,
  ExternalLink,
  ShieldAlert,
  Calendar,
  MessageSquare,
  Phone,
  Key,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  HelpCircle,
  Check,
} from "lucide-react";

interface AgencyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface AgencyTenant {
  id: string;
  name: string;
  slug: string;
  tier: "STARTER" | "GROWTH" | "ENTERPRISE";
  maxSeats: number;
  isActive: boolean;
  customDomain: string | null;
  createdAt: string;
  users: AgencyUser[];
  _count: {
    users: number;
  };
}

interface MasterMetrics {
  totalPlatformGmv: number;
  totalBaseFeeEarned: number;
  totalInvoicesCount: number;
  totalAgencies: number;
  activeAgencies: number;
  totalAllocatedSeats: number;
  totalUsedSeats: number;
  seatUtilizationRate: number;
  totalMandates: number;
  activeMandates: number;
  probationMandates: number;
  totalCandidates: number;
  silverMedalists: number;
  totalPlacements: number;
  partnerSubmissions: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  metadata: any;
  agency?: { name: string; slug: string } | null;
  user?: { name: string; email: string; role: string } | null;
}

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [agencies, setAgencies] = useState<AgencyTenant[]>([]);
  const [metrics, setMetrics] = useState<MasterMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"agencies" | "audit" | "whatsapp">("agencies");

  // Platform Environment Mode (QA Demo Sandbox vs Live Production)
  const [isProductionMode, setIsProductionMode] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);

  // WhatsApp Gateway & Whitelisting State
  const [waLoading, setWaLoading] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [waSubmittingTemplate, setWaSubmittingTemplate] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [waSuccessMsg, setWaSuccessMsg] = useState<string | null>(null);
  const [waErrorMsg, setWaErrorMsg] = useState<string | null>(null);
  const [metaHealth, setMetaHealth] = useState<any>(null);
  const [waTemplates, setWaTemplates] = useState<any[]>([]);
  const [waConnectionError, setWaConnectionError] = useState<string | null>(null);
  const [waForm, setWaForm] = useState({
    token: "",
    phoneNumberId: "",
    businessAccountId: "",
    devOverridePhone: "919818352440",
  });
  const [testForm, setTestForm] = useState({
    recipientPhone: "919818352440",
    type: "template" as "template" | "text",
    templateName: "interview_slot_invitation",
    customText: "",
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "UTILITY",
    language: "en_US",
    headerText: "",
    bodyText: "",
    footerText: "RecruitOS Automated Scheduling",
    buttonText: "Confirm Slot",
    buttonUrl: "",
    exampleVar1: "Saurabh Prajapati",
    exampleVar2: "Node Js Developer",
  });

  // Modal State for New Tenant Provisioning
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    tier: "STARTER",
    maxSeats: 5,
    customDomain: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });

  // Edit Modal State
  const [editingAgency, setEditingAgency] = useState<AgencyTenant | null>(null);
  const [editTier, setEditTier] = useState<"STARTER" | "GROWTH" | "ENTERPRISE">("STARTER");
  const [editMaxSeats, setEditMaxSeats] = useState<number>(5);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editCustomDomain, setEditCustomDomain] = useState<string>("");
  const [updatingAgency, setUpdatingAgency] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agenciesRes, metricsRes, auditRes] = await Promise.all([
        fetch("/api/super-admin/agencies"),
        fetch("/api/super-admin/metrics"),
        fetch("/api/super-admin/audit-logs?limit=30"),
      ]);

      if (agenciesRes.ok) {
        const data = await agenciesRes.json();
        setAgencies(data.agencies || []);
      }
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData.metrics);
      }
      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditLogs(aData.logs || []);
      }
    } catch (err) {
      console.error("Failed to load super admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsAppStatus = async () => {
    try {
      setWaLoading(true);
      setWaErrorMsg(null);
      const res = await fetch("/api/super-admin/whatsapp");
      if (res.ok) {
        const data = await res.json();
        setMetaHealth(data.metaHealth);
        setWaTemplates(data.templates || []);
        setWaConnectionError(data.connectionError || null);
        if (data.config) {
          setWaForm({
            token: data.config.token || "",
            phoneNumberId: data.config.phoneNumberId || "",
            businessAccountId: data.config.businessAccountId || "",
            devOverridePhone: data.config.devOverridePhone || "919818352440",
          });
          if (data.config.devOverridePhone) {
            setTestForm((prev) => ({ ...prev, recipientPhone: data.config.devOverridePhone }));
          }
        }
      }
    } catch (err: any) {
      setWaConnectionError(err.message || "Failed to load WhatsApp configuration");
    } finally {
      setWaLoading(false);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaSaving(true);
    setWaSuccessMsg(null);
    setWaErrorMsg(null);
    try {
      const res = await fetch("/api/super-admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save WhatsApp settings");
      }
      setWaSuccessMsg(data.message || "WhatsApp credentials saved and verified with Meta!");
      await fetchWhatsAppStatus();
    } catch (err: any) {
      setWaErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setWaSaving(false);
    }
  };

  const handleTestWhatsApp = async (overrideTemplate?: string) => {
    setWaTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/super-admin/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientPhone: testForm.recipientPhone,
          type: overrideTemplate ? "template" : testForm.type,
          templateName: overrideTemplate || testForm.templateName,
          customText: testForm.customText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch test message");
      }
      setTestResult({
        success: true,
        message: data.message || "Message dispatched successfully!",
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Error dispatching test message",
      });
    } finally {
      setWaTesting(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaSubmittingTemplate(true);
    setWaErrorMsg(null);
    try {
      const examples: string[] = [];
      if (newTemplate.exampleVar1?.trim()) examples.push(newTemplate.exampleVar1.trim());
      if (newTemplate.exampleVar2?.trim()) examples.push(newTemplate.exampleVar2.trim());

      const res = await fetch("/api/super-admin/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplate.name,
          category: newTemplate.category,
          language: newTemplate.language,
          headerText: newTemplate.headerText,
          bodyText: newTemplate.bodyText,
          footerText: newTemplate.footerText,
          buttonText: newTemplate.buttonText,
          buttonUrl: newTemplate.buttonUrl,
          exampleBodyValues: examples,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit template to Meta");
      }

      setWaSuccessMsg(data.message || `Template '${newTemplate.name}' submitted to Meta!`);
      setIsTemplateModalOpen(false);
      setNewTemplate({
        name: "",
        category: "UTILITY",
        language: "en_US",
        headerText: "",
        bodyText: "",
        footerText: "RecruitOS Automated Scheduling",
        buttonText: "Confirm Slot",
        buttonUrl: "",
        exampleVar1: "Saurabh Prajapati",
        exampleVar2: "Node Js Developer",
      });
      await fetchWhatsAppStatus();
    } catch (err: any) {
      alert(err.message || "Failed to submit template");
    } finally {
      setWaSubmittingTemplate(false);
    }
  };

  const fetchSystemMode = async () => {
    try {
      const res = await fetch("/api/system/mode");
      if (res.ok) {
        const data = await res.json();
        setIsProductionMode(Boolean(data.isProductionMode));
      }
    } catch (e) {
      console.error("Failed to load system mode", e);
    }
  };

  const handleToggleMode = async (targetMode: boolean) => {
    try {
      setTogglingMode(true);
      const res = await fetch("/api/system/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isProductionMode: targetMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to switch mode");
      setIsProductionMode(targetMode);
      setSuccessMessage(data.message);
      await fetchWhatsAppStatus();
    } catch (err: any) {
      alert(err.message || "Failed to switch mode");
    } finally {
      setTogglingMode(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchWhatsAppStatus();
    fetchSystemMode();
  }, []);

  const handleSlugAutoFill = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/super-admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to provision agency");
      }

      setSuccessMessage(`Agency '${formData.name}' provisioned successfully with Admin account (${formData.ownerEmail}).`);
      setIsModalOpen(false);
      setFormData({
        name: "",
        slug: "",
        tier: "STARTER",
        maxSeats: 5,
        customDomain: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (agency: AgencyTenant) => {
    setEditingAgency(agency);
    setEditTier(agency.tier);
    setEditMaxSeats(agency.maxSeats);
    setEditIsActive(agency.isActive);
    setEditCustomDomain(agency.customDomain || "");
  };

  const handleUpdateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency) return;
    setUpdatingAgency(true);

    try {
      const res = await fetch(`/api/super-admin/agencies/${editingAgency.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: editTier,
          maxSeats: editMaxSeats,
          isActive: editIsActive,
          customDomain: editCustomDomain,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update agency");
      }

      setSuccessMessage(`Agency '${editingAgency.name}' configuration updated.`);
      setEditingAgency(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setUpdatingAgency(false);
    }
  };

  const filteredAgencies = agencies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.customDomain && a.customDomain.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = tierFilter === "ALL" || a.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Super Admin Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-extrabold text-slate-800 text-base shadow-sm">
                R
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight">RecruitOS</span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-purple-200 uppercase tracking-wide">
                    Super Admin Console (SA-01, SA-02)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Platform Environment Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleMode(false)}
                  disabled={togglingMode}
                  title="Test Mode: Login credentials visible & test safe routing active"
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    !isProductionMode
                      ? "bg-white text-purple-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>🧪 QA Sandbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode(true)}
                  disabled={togglingMode}
                  title="Production Mode: Clean login & real candidate/client message delivery"
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    isProductionMode
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>🚀 Live Production</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center space-x-2 bg-brand-surfaceLight px-3 py-1.5 rounded-lg border border-brand-surface text-xs font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>{session?.user?.name || "Platform Owner (Ankur)"}</span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* PLATFORM ENVIRONMENT MODE BANNER */}
        <div
          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            isProductionMode
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              : "bg-purple-50/80 border-purple-200 text-purple-950"
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isProductionMode
                  ? "bg-emerald-600 text-white"
                  : "bg-purple-600 text-white"
              }`}
            >
              {isProductionMode ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-sm">
                  {isProductionMode
                    ? "🚀 Live Production Mode (External Client & Candidate Ready)"
                    : "🧪 Internal QA & Demo Sandbox Mode Active"}
                </h2>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isProductionMode
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-purple-100 text-purple-800 border border-purple-300"
                  }`}
                >
                  {isProductionMode ? "Live Engine" : "Safe Test Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isProductionMode
                  ? "Login page test credentials are completely hidden. Outbound WhatsApp candidate invitations and email notifications route directly to real candidates and client hiring managers."
                  : "Login page displays 1-click persona quick-fill buttons. Outbound candidate WhatsApp briefings route to your test handset (+91 9818352440) and emails route to ankur@botspring.in."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={togglingMode}
            onClick={() => handleToggleMode(!isProductionMode)}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto disabled:opacity-50 flex items-center space-x-1.5 ${
              isProductionMode
                ? "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {togglingMode ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Switching Mode...</span>
              </>
            ) : isProductionMode ? (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Revert to Sandbox</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Switch to Live Production</span>
              </>
            )}
          </button>
        </div>

        {/* Success Alert */}
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

        {/* MACRO MASTER METRICS GRID (SA-02) */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Platform Invoiced GMV */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Invoiced GMV (PL-02)
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    ₹{(metrics.totalPlatformGmv / 100000).toFixed(1)}L
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                <span className="text-emerald-700 font-bold">{metrics.totalPlacements} Placements Confirmed</span>
                <span>•</span>
                <span>{metrics.totalInvoicesCount} Invoices</span>
              </div>
            </div>

            {/* KPI 2: Active Agencies & Seats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Agencies & Seats
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {metrics.activeAgencies}{" "}
                    <span className="text-sm font-semibold text-slate-400">/ {metrics.totalAgencies} Active</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                <span className="text-purple-700 font-bold">{metrics.totalUsedSeats} / {metrics.totalAllocatedSeats} Seats</span>
                <span>•</span>
                <span>{metrics.seatUtilizationRate}% Utilization</span>
              </div>
            </div>

            {/* KPI 3: Mandates & Probation Velocity */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Mandates in Pipeline
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {metrics.activeMandates}{" "}
                    <span className="text-sm font-semibold text-slate-400">/ {metrics.totalMandates} Total</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                <span className="text-blue-700 font-bold">{metrics.probationMandates} in 90-Day Guarantee</span>
              </div>
            </div>

            {/* KPI 4: Talent Bank & Silver Medalists */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Talent Ingested
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {metrics.totalCandidates}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                <span className="text-amber-800 font-bold">{metrics.silverMedalists} Silver Medalists</span>
                <span>•</span>
                <span>{metrics.partnerSubmissions} Partner Splits</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs: Agency Tenants vs Global Audit Stream vs WhatsApp Gateway */}
        <div className="flex border-b border-slate-200 space-x-6">
          <button
            onClick={() => setActiveTab("agencies")}
            className={`pb-3 text-xs font-extrabold flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === "agencies"
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Provisioned Agency Tenants ({agencies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 text-xs font-extrabold flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === "audit"
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Live Platform Audit Stream (SA-02)</span>
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`pb-3 text-xs font-extrabold flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === "whatsapp"
                ? "border-b-2 border-emerald-600 text-emerald-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp Gateway & Whitelisting</span>
            {metaHealth ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Connected
              </span>
            ) : waConnectionError ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                Action Req
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                Config
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: AGENCY TENANTS TABLE & PROVISIONING */}
        {activeTab === "agencies" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="relative rounded-lg shadow-sm flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by agency name, slug, domain..."
                  className="block w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-surfaceDark bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-700"
                >
                  <option value="ALL">All Tiers</option>
                  <option value="STARTER">Starter (5 Seats)</option>
                  <option value="GROWTH">Growth (20 Seats)</option>
                  <option value="ENTERPRISE">Enterprise (50+ Seats)</option>
                </select>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Provision New Agency</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs font-medium">Loading tenants...</p>
                </div>
              ) : filteredAgencies.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No agency tenants found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-brand-surfaceLight text-slate-700 uppercase font-semibold tracking-wider">
                      <tr>
                        <th scope="col" className="px-6 py-3.5">Agency Tenant</th>
                        <th scope="col" className="px-6 py-3.5">Tier & Seats</th>
                        <th scope="col" className="px-6 py-3.5">Primary Owner</th>
                        <th scope="col" className="px-6 py-3.5">Custom Domain</th>
                        <th scope="col" className="px-6 py-3.5">Status</th>
                        <th scope="col" className="px-6 py-3.5 text-right">Governance Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredAgencies.map((a) => {
                        const owner = a.users.find((u) => u.role === "AGENCY_OWNER") || a.users[0];
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-extrabold text-slate-800 text-xs">
                                  {a.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{a.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">/{a.slug}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                                {a.tier}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {a._count.users} / {a.maxSeats} Seats Used
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {owner ? (
                                <div>
                                  <div className="font-bold text-slate-800">{owner.name}</div>
                                  <div className="text-[10px] text-slate-500">{owner.email}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No owner assigned</span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {a.customDomain ? (
                                <span className="inline-flex items-center space-x-1 text-slate-700 font-mono text-[11px]">
                                  <Globe className="h-3 w-3 text-emerald-600" />
                                  <span>{a.customDomain}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">Standard Subdomain</span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {a.isActive ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  <span>ACTIVE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                  <XCircle className="h-2.5 w-2.5" />
                                  <span>SUSPENDED</span>
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                              <Link
                                href={`/storefront/${a.slug}`}
                                target="_blank"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Storefront</span>
                              </Link>

                              <button
                                onClick={() => handleOpenEdit(a)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-brand-surfaceLight hover:bg-brand-surface border border-brand-surfaceDark text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Configure</span>
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
          </div>
        )}

        {/* TAB 2: LIVE GLOBAL PLATFORM AUDIT STREAM (SA-02) */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Global Platform Activity Audit Trail
                </h3>
                <p className="text-[10px] text-slate-500">
                  Real-time immutable audit logs across all search agency tenants and recruiters.
                </p>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Refresh Stream
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No audit events recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start space-x-3 text-xs">
                    <div className="h-7 w-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold flex-shrink-0 mt-0.5">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <strong className="font-bold text-slate-900">{log.action.replace(/_/g, " ")}</strong>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {log.agency?.name || "Global"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          by {log.user?.name || "System"} ({log.user?.role || "SYSTEM"})
                        </span>
                      </div>
                      {log.metadata && (
                        <div className="mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 max-w-2xl overflow-x-auto">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WHATSAPP GATEWAY & TEMPLATES HUB */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            {/* Status & Feedback Banners */}
            {waSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">{waSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setWaSuccessMsg(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {waErrorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span className="font-semibold">{waErrorMsg}</span>
                </div>
                <button
                  onClick={() => setWaErrorMsg(null)}
                  className="text-rose-700 hover:text-rose-900 font-bold px-2 py-0.5 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {waConnectionError && !waErrorMsg && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Meta Graph API Connection Warning</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">{waConnectionError}</div>
                  <div className="text-[10px] text-amber-700 mt-1">
                    💡 If your temporary token expired, enter a permanent Meta System User token below and click <strong>Save & Verify with Meta</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* TOP METRICS / RADAR CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Cloud API Health */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Meta Cloud API Gateway
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="text-xl font-black text-slate-900">
                        {metaHealth ? metaHealth.verifiedName : "Disconnected"}
                      </div>
                      {metaHealth ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      metaHealth
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                        : "bg-rose-50 border border-rose-200 text-rose-600"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-600 font-medium">
                  <span className="text-slate-500">Number:</span>{" "}
                  <strong className="text-slate-900 font-mono">
                    {metaHealth?.displayPhoneNumber || waForm.phoneNumberId || "Not Configured"}
                  </strong>
                </div>
              </div>

              {/* Card 2: Quality & Policy Rating */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Sender Quality & Quota
                    </span>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {metaHealth?.qualityRating === "GREEN" ? (
                        <span className="text-emerald-700 font-bold">🟢 High Quality</span>
                      ) : metaHealth?.qualityRating === "YELLOW" ? (
                        <span className="text-amber-700 font-bold">🟡 Medium Quality</span>
                      ) : metaHealth?.qualityRating === "RED" ? (
                        <span className="text-rose-700 font-bold">🔴 Low Quality</span>
                      ) : (
                        <span className="text-slate-500">{metaHealth?.qualityRating || "UNKNOWN"}</span>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-600 font-medium">
                  <span className="text-slate-500">Throughput:</span>{" "}
                  <strong className="text-slate-800">{metaHealth?.throughput || "Standard Cloud API"}</strong>
                </div>
              </div>

              {/* Card 3: Safe Mode Dev Override */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Development Safe Routing
                    </span>
                    <div className="text-xl font-black text-blue-700 mt-1">
                      +{waForm.devOverridePhone || "919818352440"}
                    </div>
                  </div>
                  <button
                    onClick={fetchWhatsAppStatus}
                    disabled={waLoading}
                    title="Refresh Meta Connection"
                    className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${waLoading ? "animate-spin text-purple-600" : ""}`} />
                  </button>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 font-medium">
                  All candidate dispatches route to developer phone in test mode.
                </div>
              </div>
            </div>

            {/* TWO-COLUMN WORKBENCH */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT: DYNAMIC CREDENTIALS & HOT-SWAP (7 COLS) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <Key className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Dynamic Gateway Credentials (Hot Swap)
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Updates PostgreSQL configuration immediately with zero downtime or redeployments
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                    Global Config
                  </span>
                </div>

                <form onSubmit={handleSaveWhatsApp} className="p-6 space-y-4 text-xs">
                  {/* API Token */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">Meta WhatsApp Access Token *</label>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        <span>{showToken ? "Hide" : "Show"} Token</span>
                      </button>
                    </div>
                    <input
                      type={showToken ? "text" : "password"}
                      required
                      value={waForm.token}
                      onChange={(e) => setWaForm({ ...waForm, token: e.target.value })}
                      placeholder="EAAG... (System User Permanent Token)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Recommended: Use a <strong>System User Token</strong> from Meta Business Suite (Holiday Cleaners) with <code className="bg-slate-100 px-1 py-0.5 rounded">whatsapp_business_messaging</code> to prevent 24h expiration.
                    </p>
                  </div>

                  {/* Phone Number ID & WABA ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Phone Number ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={waForm.phoneNumberId}
                        onChange={(e) => setWaForm({ ...waForm, phoneNumberId: e.target.value })}
                        placeholder="1260219273830307"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        From WhatsApp &gt; API Setup in Meta Console.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        WhatsApp Business Account ID (WABA)
                      </label>
                      <input
                        type="text"
                        value={waForm.businessAccountId}
                        onChange={(e) => setWaForm({ ...waForm, businessAccountId: e.target.value })}
                        placeholder="1356487366545010"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Required to whitelist and fetch message templates.
                      </p>
                    </div>
                  </div>

                  {/* Dev Override Phone */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Development Safe Override Phone (E.164 without +)
                    </label>
                    <input
                      type="text"
                      value={waForm.devOverridePhone}
                      onChange={(e) => setWaForm({ ...waForm, devOverridePhone: e.target.value })}
                      placeholder="919818352440"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      During testing, all interview briefings and invitations are diverted to this phone number.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[10px] text-slate-500">
                      ⚡ Validates credentials with Meta Graph API before saving.
                    </div>
                    <button
                      type="submit"
                      disabled={waSaving}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                    >
                      {waSaving ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Verifying & Saving...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Save & Verify with Meta</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT: 1-CLICK TEST DISPATCHER (5 COLS) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <Send className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          1-Click WhatsApp Live Tester
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          Verify message deliverability directly to your physical handset
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 text-xs">
                    {/* Test Phone */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Recipient Mobile (E.164 format)
                      </label>
                      <input
                        type="text"
                        value={testForm.recipientPhone}
                        onChange={(e) => setTestForm({ ...testForm, recipientPhone: e.target.value })}
                        placeholder="919818352440"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    {/* Mode selector */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Message Payload Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTestForm({ ...testForm, type: "template" })}
                          className={`py-2 px-3 rounded-xl font-bold text-[11px] border transition cursor-pointer ${
                            testForm.type === "template"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          📋 Whitelisted Template
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestForm({ ...testForm, type: "text" })}
                          className={`py-2 px-3 rounded-xl font-bold text-[11px] border transition cursor-pointer ${
                            testForm.type === "text"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          💬 Free Text (24h Window)
                        </button>
                      </div>
                    </div>

                    {/* Template selection or text prompt */}
                    {testForm.type === "template" ? (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Select Template
                        </label>
                        <select
                          value={testForm.templateName}
                          onChange={(e) => setTestForm({ ...testForm, templateName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-semibold"
                        >
                          <option value="interview_slot_invitation">interview_slot_invitation (RecruitOS Native)</option>
                          <option value="hello_world">hello_world (Meta Default)</option>
                          {waTemplates
                            .filter((t) => t.name !== "interview_slot_invitation" && t.name !== "hello_world")
                            .map((t) => (
                              <option key={t.id} value={t.name}>
                                {t.name} ({t.status})
                              </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Templates are whitelisted by Meta and can be sent anytime without candidate opt-in.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Custom Message Text
                        </label>
                        <textarea
                          rows={3}
                          value={testForm.customText}
                          onChange={(e) => setTestForm({ ...testForm, customText: e.target.value })}
                          placeholder="Type a test message... Note: Requires candidate to have sent 'Hi' within the last 24 hours."
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Dispatch Button */}
                    <button
                      type="button"
                      onClick={() => handleTestWhatsApp()}
                      disabled={waTesting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {waTesting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Dispatching to +{testForm.recipientPhone}...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Dispatch Live WhatsApp Test</span>
                        </>
                      )}
                    </button>

                    {/* Test Result Feedback */}
                    {testResult && (
                      <div
                        className={`p-3 rounded-xl border text-[11px] ${
                          testResult.success
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        <div className="font-bold flex items-center space-x-1">
                          {testResult.success ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                          )}
                          <span>{testResult.success ? "Delivered to Meta" : "Dispatch Failed"}</span>
                        </div>
                        <div className="mt-1 font-mono text-[10px] break-all">{testResult.message}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-[10px] text-slate-500">
                  Tip: To receive free-form text messages, send <strong className="text-slate-800">Hi</strong> to <strong className="text-slate-800 font-mono">+{waForm.phoneNumberId || "1203254976"}</strong> from your WhatsApp.
                </div>
              </div>
            </div>

            {/* FULL-WIDTH SECTION: META MESSAGE TEMPLATES & WHITELISTING HUB */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Meta Message Templates & Whitelisting Hub
                    </h3>
                    <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                      {waTemplates.length} Synced
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Outbound cold communications (e.g. interview invitations) must use Meta-approved templates.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchWhatsAppStatus}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                    <span>Sync from Meta</span>
                  </button>

                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Submit New Template</span>
                  </button>
                </div>
              </div>

              {/* Template Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50/75">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Template Name
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Language
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Meta Approval Status
                      </th>
                      <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Message Body Structure
                      </th>
                      <th className="px-6 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {waTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                          {waLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                              <span>Loading templates from Meta Graph API...</span>
                            </div>
                          ) : (
                            <div>
                              <div>No Meta templates found for this WABA account.</div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                Click <strong>Submit New Template</strong> to register your first interview invitation template with Meta.
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      waTemplates.map((template) => {
                        const bodyComponent = template.components?.find((c: any) => c.type === "BODY");
                        const buttonComponent = template.components?.find((c: any) => c.type === "BUTTONS");
                        const isApproved = template.status === "APPROVED";
                        const isPending = template.status === "PENDING";

                        return (
                          <tr key={template.id || template.name} className="hover:bg-slate-50/60 transition">
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              <div className="font-extrabold text-slate-900 font-mono text-xs">
                                {template.name}
                              </div>
                              {template.id && (
                                <div className="text-[10px] text-slate-400 font-mono">ID: {template.id}</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {template.category}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                              {template.language}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {isApproved ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>APPROVED</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <RefreshCw className="h-3 w-3 text-amber-600" />
                                  <span>IN REVIEW</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="h-3 w-3 text-rose-600" />
                                  <span>{template.status || "REJECTED"}</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 max-w-xs">
                              <div className="text-slate-600 line-clamp-2 text-[11px]">
                                {bodyComponent?.text || "—"}
                              </div>
                              {buttonComponent?.buttons?.length > 0 && (
                                <div className="mt-1 flex items-center space-x-1 text-[10px] text-purple-700 font-medium">
                                  <span>🔘 {buttonComponent.buttons[0].text}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleTestWhatsApp(template.name)}
                                disabled={waTesting || !isApproved}
                                title={isApproved ? "Send immediate test to test phone" : "Template must be APPROVED by Meta first"}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-purple-700 border border-slate-200 hover:border-purple-300 font-bold rounded-xl text-[11px] transition cursor-pointer disabled:opacity-40 flex items-center space-x-1 ml-auto"
                              >
                                <Sparkles className="h-3 w-3 text-purple-600" />
                                <span>⚡ Test Dispatch</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Helpful footer */}
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700">Interview Notification Engine:</span>
                  <span>Dispatches automatically consume the whitelisted <code>interview_slot_invitation</code> template with candidate deep-link buttons.</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  WABA: {waForm.businessAccountId || "Not set"}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: PROVISION NEW AGENCY TENANT (SA-01) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Provision New Agency Tenant (SA-01)</h3>
                  <p className="text-[10px] text-purple-800">Setup dedicated search tenant & initial Managing Director</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAgency} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3">
                <span className="block font-bold text-slate-900 text-xs uppercase tracking-wider">
                  1. Agency Brand & Capacity
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-0.5">Agency Legal / Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleSlugAutoFill(e.target.value)}
                      placeholder="e.g. Apex Search Partners"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Subdomain Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="apex-search"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Subscription Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => {
                        const tier = e.target.value;
                        const seats = tier === "STARTER" ? 5 : tier === "GROWTH" ? 20 : 50;
                        setFormData({ ...formData, tier, maxSeats: seats });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                    >
                      <option value="STARTER">Starter (5 Seats)</option>
                      <option value="GROWTH">Growth (20 Seats)</option>
                      <option value="ENTERPRISE">Enterprise (50+ Seats)</option>
                    </select>
                  </div>
                </div>

                <span className="block font-bold text-slate-900 text-xs uppercase tracking-wider pt-2">
                  2. Managing Director / Owner Account
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-0.5">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="Vikram Malhotra"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Owner Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="vikram@apexsearch.in"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Provisioning..." : "Provision Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE / EDIT AGENCY (SA-01) */}
      {editingAgency && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-brand-surfaceLight px-6 py-4 border-b border-brand-surface flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-slate-800" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Configure Tenant: {editingAgency.name}</h3>
                  <p className="text-[10px] text-slate-500">Update tier, seat quota, and operational status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAgency(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateAgency} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subscription Tier</label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="STARTER">Starter (5 Seats)</option>
                  <option value="GROWTH">Growth (20 Seats)</option>
                  <option value="ENTERPRISE">Enterprise (50+ Seats)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Seat Quota</label>
                <input
                  type="number"
                  value={editMaxSeats}
                  onChange={(e) => setEditMaxSeats(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Domain (e.g. search.apex.com)</label>
                <input
                  type="text"
                  value={editCustomDomain}
                  onChange={(e) => setEditCustomDomain(e.target.value)}
                  placeholder="search.apex.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Tenant Status</label>
                <select
                  value={editIsActive ? "active" : "suspended"}
                  onChange={(e) => setEditIsActive(e.target.value === "active")}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="active">🟢 Active & Provisioned</option>
                  <option value="suspended">🔴 Suspended / Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAgency(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAgency}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {updatingAgency ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT NEW META WHATSAPP TEMPLATE */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Submit New WhatsApp Template for Meta Whitelisting
                  </h3>
                  <p className="text-[10px] text-purple-800">
                    Direct submission to Meta Graph API for WABA: {waForm.businessAccountId || "Not set"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Form Fields (7 cols) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Template Name (Snake Case) *</label>
                      <input
                        type="text"
                        required
                        value={newTemplate.name}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                          })
                        }
                        placeholder="interview_prep_guide"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Category *</label>
                      <select
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                      >
                        <option value="UTILITY">UTILITY (Recommended for Interviews)</option>
                        <option value="MARKETING">MARKETING</option>
                        <option value="AUTHENTICATION">AUTHENTICATION</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Language</label>
                      <select
                        value={newTemplate.language}
                        onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
                      >
                        <option value="en_US">English (US)</option>
                        <option value="en_GB">English (UK)</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Header (Optional)</label>
                      <input
                        type="text"
                        value={newTemplate.headerText}
                        onChange={(e) => setNewTemplate({ ...newTemplate, headerText: e.target.value })}
                        placeholder="Interview Invitation"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">
                      Body Message Text * (Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for variables)
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newTemplate.bodyText}
                      onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
                      placeholder="Hi {{1}}, you have been shortlisted for {{2}}. Please confirm your preferred interview slot."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                    <div>
                      <label className="block font-bold text-purple-900 mb-0.5 text-[10px]">
                        Example for &#123;&#123;1&#125;&#125; (Meta Requirement)
                      </label>
                      <input
                        type="text"
                        value={newTemplate.exampleVar1}
                        onChange={(e) => setNewTemplate({ ...newTemplate, exampleVar1: e.target.value })}
                        placeholder="Saurabh Prajapati"
                        className="w-full px-2.5 py-1 border border-purple-200 rounded-lg text-xs bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-900 mb-0.5 text-[10px]">
                        Example for &#123;&#123;2&#125;&#125; (Meta Requirement)
                      </label>
                      <input
                        type="text"
                        value={newTemplate.exampleVar2}
                        onChange={(e) => setNewTemplate({ ...newTemplate, exampleVar2: e.target.value })}
                        placeholder="Node Js Developer"
                        className="w-full px-2.5 py-1 border border-purple-200 rounded-lg text-xs bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Footer Text (Optional)</label>
                      <input
                        type="text"
                        value={newTemplate.footerText}
                        onChange={(e) => setNewTemplate({ ...newTemplate, footerText: e.target.value })}
                        placeholder="RecruitOS Automated Scheduling"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">CTA Button Label</label>
                      <input
                        type="text"
                        value={newTemplate.buttonText}
                        onChange={(e) => setNewTemplate({ ...newTemplate, buttonText: e.target.value })}
                        placeholder="Confirm Slot"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">
                      CTA Button Target URL (Use &#123;&#123;1&#125;&#125; for dynamic deep-link token)
                    </label>
                    <input
                      type="text"
                      value={newTemplate.buttonUrl}
                      onChange={(e) => setNewTemplate({ ...newTemplate, buttonUrl: e.target.value })}
                      placeholder="https://recruitos.app/interviews/confirm/{{1}}"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Simulated WhatsApp Phone Bubble (5 cols) */}
                <div className="md:col-span-5 bg-slate-100 rounded-2xl p-4 flex flex-col justify-between border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Live Candidate Phone Preview
                    </span>

                    <div className="bg-[#EFEAE2] p-3 rounded-2xl shadow-inner">
                      {/* WhatsApp Message Bubble */}
                      <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-200/50 space-y-2">
                        {newTemplate.headerText && (
                          <div className="font-extrabold text-slate-900 text-xs border-b border-slate-100 pb-1">
                            {newTemplate.headerText}
                          </div>
                        )}
                        <div className="text-slate-800 text-[11px] whitespace-pre-line leading-relaxed">
                          {(newTemplate.bodyText || "Hi {{1}}, you have been shortlisted for {{2}}.")
                            .replace(/\{\{1\}\}/g, newTemplate.exampleVar1 || "Candidate Name")
                            .replace(/\{\{2\}\}/g, newTemplate.exampleVar2 || "Role Title")}
                        </div>
                        {newTemplate.footerText && (
                          <div className="text-[9px] text-slate-400">
                            {newTemplate.footerText}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-400 text-right">
                          12:00 PM ✓✓
                        </div>
                      </div>

                      {/* WhatsApp Button */}
                      {newTemplate.buttonText && (
                        <div className="mt-1 bg-white rounded-xl py-2 px-3 text-center text-purple-700 font-bold text-[11px] shadow-sm border border-slate-200 flex items-center justify-center space-x-1.5">
                          <ExternalLink className="h-3 w-3" />
                          <span>{newTemplate.buttonText}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-800">
                    💡 Utility templates with variable examples typically receive Meta automated approval in <strong>1 to 5 minutes</strong>.
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waSubmittingTemplate}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {waSubmittingTemplate ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting to Meta...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Submit to Meta for Approval</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
