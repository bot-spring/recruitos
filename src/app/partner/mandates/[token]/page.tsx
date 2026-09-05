"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  Building2,
  AlertCircle,
  Share2,
  ArrowRight,
  Eye,
  UploadCloud,
  FileText,
  User,
  Mail,
  Phone,
  Lock,
} from "lucide-react";

interface PartnerMandateData {
  shareToken: string;
  maskedClientTitle: string;
  maskedLocation: string;
  sponsoringAgency: {
    name: string;
    slug: string;
  };
  mandate: {
    id: string;
    title: string;
    department: string | null;
    openings: number;
    minExp: number;
    maxExp: number;
    workMode: string;
    location: string | null;
    skills: string[];
    description: string | null;
    maxNoticeDays: number | null;
    currency: string;
    minCtc: number | null;
    maxCtc: number | null;
  };
  commercialTerms: {
    splitFeePercentage: number;
    effectivePartnerFeePct: number;
    guaranteeDays: number;
    estimatedMinPayout: number | null;
    estimatedMaxPayout: number | null;
    currency: string;
    payoutTerms: string;
  };
}

interface PartnerSubmission {
  id: string;
  candidateName: string;
  currentTitle: string | null;
  totalExpYears: number;
  stage: string;
  splitFeePercentage: number;
  splitPayoutEstimated: number | null;
  submittedAt: string;
}

export default function PublicPartnerMandatePage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PartnerMandateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"DETAILS" | "SUBMIT" | "TRACKER">("DETAILS");

  // Candidate Submission State (PO-02)
  const [file, setFile] = useState<File | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerAgency, setPartnerAgency] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // My Submissions Tracker State (PO-04)
  const [mySubmissions, setMySubmissions] = useState<PartnerSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    async function loadPartnerMandate() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/partner-mandates/${token}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Partner mandate link is invalid or expired.");
        }
        const json = await res.json();
        setData(json.partnerMandate);
      } catch (err: any) {
        setError(err.message || "Failed to load partner mandate.");
      } finally {
        setLoading(false);
      }
    }

    if (token) loadPartnerMandate();
  }, [token]);

  // Load Partner Submissions for Real-Time Stage Tracker (PO-04)
  const loadMySubmissions = async (emailToFetch: string) => {
    if (!emailToFetch.trim()) return;
    try {
      setLoadingSubmissions(true);
      const res = await fetch(`/api/partner/${token}/submissions?email=${encodeURIComponent(emailToFetch.trim())}`);
      if (res.ok) {
        const json = await res.json();
        setMySubmissions(json.submissions || []);
      }
    } catch (err) {
      console.error("Failed to load submissions tracker:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSubmitError(null);
    }
  };

  const handleSubmitCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setSubmitError("Please attach the candidate resume document (PDF or DOCX).");
      return;
    }
    if (!partnerName.trim() || !partnerEmail.trim()) {
      setSubmitError("Partner Name and Partner Work Email are required for attribution lock.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partnerName", partnerName.trim());
      formData.append("partnerEmail", partnerEmail.toLowerCase().trim());
      if (partnerPhone) formData.append("partnerPhone", partnerPhone.trim());
      if (partnerAgency) formData.append("partnerAgency", partnerAgency.trim());

      const res = await fetch(`/api/partner/${token}/submit`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit candidate.");
      }

      setSubmitSuccess(`Candidate '${json.candidate.fullName}' submitted with attribution lock!`);
      setFile(null);
      loadMySubmissions(partnerEmail);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit candidate.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
            Loading Anonymized Partner Mandate...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Partner Link Unavailable</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">{error || "This shared mandate has expired or was removed."}</p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-yellow text-slate-900 font-bold text-xs rounded-lg shadow-sm hover:bg-brand-yellowHover"
          >
            <span>RecruitOS Login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-bold text-slate-800 text-sm shadow-sm">
              {data.sponsoringAgency.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm">{data.sponsoringAgency.name}</span>
                <span className="bg-brand-surfaceLight text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-brand-surface uppercase">
                  Split-Fee Partner Network (PO-01)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Authorized B2B Split-Recruiter Workspace</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Client Confidentiality Active</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs gap-1">
          <button
            onClick={() => setActiveTab("DETAILS")}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === "DETAILS"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Mandate & Split Terms</span>
          </button>

          <button
            onClick={() => setActiveTab("SUBMIT")}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === "SUBMIT"
                ? "bg-brand-yellow text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>+ Submit Matching Candidate (PO-02)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("TRACKER");
              if (partnerEmail) loadMySubmissions(partnerEmail);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === "TRACKER"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>My Stage Tracker (PO-04)</span>
          </button>
        </div>

        {/* TAB 1: MANDATE DETAILS */}
        {activeTab === "DETAILS" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-700 mb-3">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>{data.maskedClientTitle}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {data.mandate.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                  <span className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    {data.maskedLocation} ({data.mandate.workMode})
                  </span>
                  <span>•</span>
                  <span>Experience: {data.mandate.minExp}–{data.mandate.maxExp} Years</span>
                  <span>•</span>
                  <span>Openings: {data.mandate.openings}</span>
                  <span>•</span>
                  <span>Notice Cap: {data.mandate.maxNoticeDays} Days</span>
                </div>
              </div>

              {/* Split Commission Earnings Badge */}
              <div className="bg-brand-surfaceLight border-2 border-brand-surface rounded-2xl p-4 sm:w-80 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Partner Split Commission
                  </span>
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {data.commercialTerms.splitFeePercentage}% Split
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Effective <strong>{data.commercialTerms.effectivePartnerFeePct}% of Candidate CTC</strong>
                </div>

                {data.commercialTerms.estimatedMinPayout && data.commercialTerms.estimatedMaxPayout && (
                  <div className="mt-2.5 pt-2.5 border-t border-brand-surface text-xs text-slate-800">
                    <span className="text-slate-500">Est. Payout per Placement:</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {data.commercialTerms.currency === "INR" ? "₹" : "$"}
                      {(data.commercialTerms.estimatedMinPayout / 100000).toFixed(2)}L –{" "}
                      {data.commercialTerms.currency === "INR" ? "₹" : "$"}
                      {(data.commercialTerms.estimatedMaxPayout / 100000).toFixed(2)}L
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Skill Chips */}
            {data.mandate.skills && data.mandate.skills.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Mandatory Skill Sets & Tech Stack
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.mandate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-1 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Responsibilities */}
            {data.mandate.description && (
              <div className="pt-4 border-t border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Role Brief & Sourcing Guidance
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {data.mandate.description}
                </p>
              </div>
            )}

            {/* Commercial & Payout Rules */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>Split-Fee Payout Guarantee Terms</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {data.commercialTerms.payoutTerms} Standard {data.commercialTerms.guaranteeDays}-day replacement protection applies. Candidate submissions will be arbitrated under strict first-touch duplicate protection.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setActiveTab("SUBMIT")}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <span>Submit Candidate for {data.mandate.title}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATE SUBMISSION FORM (PO-02) */}
        {activeTab === "SUBMIT" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-brand-surfaceLight border border-brand-surface px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 mb-2">
                <Lock className="h-3 w-3" />
                <span>Partner Attribution Locked (PO-02)</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Submit Candidate for {data.mandate.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your split commission ({data.commercialTerms.splitFeePercentage}%) will be permanently bound to this candidate profile upon submission.
              </p>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCandidate} className="space-y-4 text-xs">
              {/* Partner Sourcer Contact Identification */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="block font-bold text-slate-900 text-xs">
                  Your Sourcer / Partner Identity (For Attribution & Split Payout)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Work Email *</label>
                    <input
                      type="email"
                      required
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="rahul@partneragency.com"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your WhatsApp / Phone</label>
                    <input
                      type="text"
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Agency / Firm Name (Optional)</label>
                    <input
                      type="text"
                      value={partnerAgency}
                      onChange={(e) => setPartnerAgency(e.target.value)}
                      placeholder="e.g. TalentHive Advisory"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Resume File Upload Dropzone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Resume (PDF / DOCX) *</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-brand-surfaceDark rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
                  <input
                    type="file"
                    required
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    id="partner-resume-upload"
                    className="hidden"
                  />
                  <label htmlFor="partner-resume-upload" className="cursor-pointer block">
                    <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    {file ? (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 text-xs flex items-center justify-center space-x-1">
                          <FileText className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{file.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • Click to replace</span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-bold text-slate-800 text-xs hover:underline">
                          Click to upload candidate resume document
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          AI will extract work history and contact details automatically
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Parsing & Locking Attribution with Gemini AI...</span>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Submit Candidate with Attribution Lock (PO-02)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: REAL-TIME STAGE TRACKER (PO-04) */}
        {activeTab === "TRACKER" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Your Candidate Stage Tracker</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isolated pipeline view of candidates submitted by you for this mandate.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="Enter your partner email..."
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                />
                <button
                  onClick={() => loadMySubmissions(partnerEmail)}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-slate-800 cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {loadingSubmissions ? (
              <div className="p-8 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs">Loading your submissions...</p>
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                <Users className="h-7 w-7 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700 text-xs">No active submissions found for this email</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Submit a candidate above or enter the work email you used during submission.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {mySubmissions.map((sub) => (
                  <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                        <span>{sub.candidateName}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          {sub.splitFeePercentage}% Split Locked
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {sub.currentTitle || "Professional"} • {sub.totalExpYears} Years Exp • Submitted:{" "}
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        {sub.stage.replace(/_/g, " ")}
                      </span>
                      {sub.splitPayoutEstimated && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Est. Payout</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ₹{(sub.splitPayoutEstimated / 100000).toFixed(2)}L
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        RecruitOS Partner & Split-Fee Collaboration Vault
      </footer>
    </div>
  );
}
