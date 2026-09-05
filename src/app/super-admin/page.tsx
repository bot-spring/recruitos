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
  const [activeTab, setActiveTab] = useState<"agencies" | "audit">("agencies");

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

  useEffect(() => {
    fetchData();
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

            <div className="flex items-center space-x-4">
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

        {/* Tabs: Agency Tenants vs Global Audit Stream */}
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
    </div>
  );
}
