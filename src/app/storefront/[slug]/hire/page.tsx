"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  DollarSign,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
} from "lucide-react";

export default function ClientMandateIntakeWizard() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{ mandateId: string; companyName: string; title: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Company Profile & Contact
    companyName: "",
    website: "",
    industry: "",
    companyLocation: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactDesignation: "",

    // Step 2: Role Details
    title: "",
    department: "",
    openings: 1,
    minExp: 3,
    maxExp: 8,
    workMode: "HYBRID",
    location: "",
    skills: "",
    description: "",

    // Step 3: Compensation & Notice
    minCtc: "",
    maxCtc: "",
    currency: "INR",
    maxNoticeDays: 60,

    // Step 4: Engagement & Commercials
    feePercentage: 8.33,
    guaranteeDays: 90,
    priority: "MEDIUM",
    specialInstructions: "",
    agreedToTerms: true,
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for Step 1
    if (step === 1) {
      if (!formData.companyName.trim() || !formData.contactName.trim() || !formData.contactEmail.trim()) {
        setError("Please complete all required fields: Company Name, Contact Name, and Work Email.");
        return;
      }
    }

    // Validation for Step 2
    if (step === 2) {
      if (!formData.title.trim() || !formData.skills.trim()) {
        setError("Please provide a Job Title and at least one Primary Skill.");
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/storefront/${slug}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit hiring requirement.");
      }

      setSubmittedData({
        mandateId: data.mandate.id,
        companyName: data.mandate.companyName,
        title: data.mandate.title,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
        <header className="bg-white border-b border-slate-200 py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href={`/storefront/${slug}`} className="font-extrabold text-slate-900 text-base">
              Recruit<span className="text-slate-500">OS</span>
            </Link>
            <span className="text-xs font-semibold text-slate-500">Intake Acknowledged</span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12 w-full">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl shadow-slate-200/40 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Hiring Mandate Received</h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mb-6">
              Your requirement for <strong>{submittedData.title}</strong> at <strong>{submittedData.companyName}</strong> has been logged into our agency operational pipeline.
            </p>

            <div className="bg-brand-surfaceLight border border-brand-surface rounded-2xl p-5 mb-6 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-brand-surface/60">
                <span className="font-semibold text-slate-600">Mandate Reference ID:</span>
                <span className="font-mono font-bold text-slate-900">{submittedData.mandateId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Confirmation Sent To:</span>
                <span className="font-medium text-slate-800">{formData.contactEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Review SLA Status:</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Under Partner Review (72h SLA Active)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/storefront/${slug}`}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <span>Return to Agency Storefront</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-400">
          Powered by RecruitOS Multi-Tenant Architecture
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href={`/storefront/${slug}`}
            className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900">Client Mandate Intake</span>
            <span className="bg-brand-surface text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-surfaceDark">
              AS-02
            </span>
          </div>
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && "Company & Contact Profile"}
              {step === 2 && "Role & Search Criteria"}
              {step === 3 && "Compensation & Notice Budget"}
              {step === 4 && "Commercial Terms & Confirmation"}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-brand-surfaceDark transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleNext} className="space-y-6 text-xs">
            {/* STEP 1: COMPANY & CONTACT PROFILE */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900">Company & Hiring Contact Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tell us about your organization and the hiring manager leading this search.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Company / Organization Name *</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => updateField("companyName", e.target.value)}
                        placeholder="e.g. Acme FinTech Corp"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company Website</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder="https://acme.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Industry Sector</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => updateField("industry", e.target.value)}
                      placeholder="e.g. SaaS, Fintech, Healthcare"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Headquarters / Primary Office</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.companyLocation}
                        onChange={(e) => updateField("companyLocation", e.target.value)}
                        placeholder="e.g. Bengaluru, India / Dubai, UAE"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                    Hiring Manager / Talent Lead
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.contactName}
                          onChange={(e) => updateField("contactName", e.target.value)}
                          placeholder="e.g. Rajiv Menon"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          required
                          value={formData.contactEmail}
                          onChange={(e) => updateField("contactEmail", e.target.value)}
                          placeholder="rajiv@acme.com"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.contactPhone}
                          onChange={(e) => updateField("contactPhone", e.target.value)}
                          placeholder="+91-9876543210"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={formData.contactDesignation}
                        onChange={(e) => updateField("contactDesignation", e.target.value)}
                        placeholder="e.g. VP Engineering / Head of HR"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ROLE & SEARCH CRITERIA */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900">Role Specifications & Sourcing Criteria</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define the position title, experience scope, and essential skill sets.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Position / Job Title *</label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="e.g. Lead Full-Stack Architect"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-surfaceDark text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department / Functional Area</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => updateField("department", e.target.value)}
                      placeholder="e.g. Engineering / Product"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Number of Openings</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.openings}
                      onChange={(e) => updateField("openings", parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Experience Range (Years)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={formData.minExp}
                        onChange={(e) => updateField("minExp", parseInt(e.target.value, 10) || 0)}
                        placeholder="Min"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                      />
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={formData.maxExp}
                        onChange={(e) => updateField("maxExp", parseInt(e.target.value, 10) || 0)}
                        placeholder="Max"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
                    <select
                      value={formData.workMode}
                      onChange={(e) => updateField("workMode", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white font-medium"
                    >
                      <option value="HYBRID">Hybrid (Office + Remote)</option>
                      <option value="REMOTE">100% Remote</option>
                      <option value="ONSITE">On-Site Office</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Must-Have Skills & Tech Stack * (Comma separated)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.skills}
                      onChange={(e) => updateField("skills", e.target.value)}
                      placeholder="React, TypeScript, Node.js, PostgreSQL, System Design"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Role Summary & Ideal Candidate Notes</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Key challenges, team size, reporting line, and candidate persona..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: COMPENSATION & NOTICE */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900">Compensation & Notice Period Budget</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Align budget expectations to ensure high candidate acceptance velocity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white font-bold"
                    >
                      <option value="INR">INR (₹ Lakhs)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AED">AED (Dirhams)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Min Target CTC</label>
                    <input
                      type="number"
                      value={formData.minCtc}
                      onChange={(e) => updateField("minCtc", e.target.value)}
                      placeholder="e.g. 2500000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Max Budget CTC</label>
                    <input
                      type="number"
                      value={formData.maxCtc}
                      onChange={(e) => updateField("maxCtc", e.target.value)}
                      placeholder="e.g. 3500000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1">Maximum Notice Period Acceptable</label>
                  <p className="text-xs text-slate-500 mb-3">
                    We enforce notice period tracking to eliminate drop-offs. Specify the longest notice period acceptable.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[30, 60, 90].map((days) => (
                      <button
                        type="button"
                        key={days}
                        onClick={() => updateField("maxNoticeDays", days)}
                        className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          formData.maxNoticeDays === days
                            ? "bg-brand-surface border-slate-600 text-slate-900 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div>{days} Days</div>
                        <div className="text-[10px] font-normal text-slate-500">
                          {days === 30 ? "Immediate / Short" : days === 60 ? "Standard" : "Extended"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ENGAGEMENT TERMS & CONFIRMATION */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-extrabold text-slate-900">Commercial Terms & Review</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review search priority and standard placement commercial parameters.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Search Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => updateField("priority", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white font-semibold"
                    >
                      <option value="MEDIUM">Standard Priority (72h SLA)</option>
                      <option value="HIGH">High Priority (48h SLA)</option>
                      <option value="URGENT">Critical / Urgent Search (24h SLA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Placement Fee Structure</label>
                    <input
                      type="text"
                      disabled
                      value={`${formData.feePercentage}% of Annual CTC (Payable upon joining)`}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 bg-slate-100 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Special Sourcing Instructions</label>
                    <textarea
                      rows={2}
                      value={formData.specialInstructions}
                      onChange={(e) => updateField("specialInstructions", e.target.value)}
                      placeholder="e.g. Target competitor companies, specific college tiers, or diversity preferences..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-brand-surfaceLight rounded-2xl border border-brand-surface">
                  <div className="flex items-start space-x-3">
                    <ShieldCheck className="h-5 w-5 text-slate-800 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">90-Day Replacement Guarantee Included</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        If any placed candidate leaves or is separated within 90 calendar days of joining, our agency provides a dedicated $0 replacement search mandate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation & Submission Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Submitting Requirement...</span>
                ) : step < 4 ? (
                  <>
                    <span>Next: {step === 1 ? "Role Specs" : step === 2 ? "Budget" : "Commercials"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Confirm & Launch Mandate</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        RecruitOS Agency Storefront & Inbound Intake Engine
      </footer>
    </div>
  );
}

