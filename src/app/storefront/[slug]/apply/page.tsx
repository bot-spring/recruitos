"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Building2,
  ArrowRight,
  User,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";

function CandidateApplyForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const preselectedMandateId = searchParams.get("mandateId") || "";

  const [agencyName, setAgencyName] = useState("Agency Talent Network");
  const [mandates, setMandates] = useState<Array<{ id: string; title: string; location: string | null }>>([]);
  const [selectedMandateId, setSelectedMandateId] = useState(preselectedMandateId);

  const [file, setFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadAgencyInfo() {
      try {
        const res = await fetch(`/api/storefront/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setAgencyName(data.agency?.name || "Agency");
          setMandates(data.agency?.jobMandates || []);
        }
      } catch (err) {
        console.error("Error loading agency info:", err);
      }
    }
    if (slug) loadAgencyInfo();
  }, [slug]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please attach your resume document (PDF or DOCX).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedMandateId) formData.append("mandateId", selectedMandateId);
      if (fullName) formData.append("fullName", fullName);
      if (email) formData.append("email", email);
      if (phone) formData.append("phone", phone);

      const res = await fetch(`/api/storefront/${slug}/apply`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Application Received</h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          Your profile has been ingested into <strong>{agencyName}</strong>’s candidate network. Our talent partners will review your experience and connect with matching opportunities.
        </p>
        <Link
          href={`/storefront/${slug}`}
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all"
        >
          <span>Return to Storefront</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-10 max-w-xl mx-auto">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <div className="inline-flex items-center space-x-1.5 bg-brand-surfaceLight border border-brand-surface px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 mb-2">
          <Sparkles className="h-3 w-3" />
          <span>Automated AI Intake & Parsing (AS-04)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Join the Apex Talent Network</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload your resume to apply for open roles or join our verified candidate bank.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Mandate Selection */}
        {mandates.length > 0 && (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Applying for Specific Position</label>
            <select
              value={selectedMandateId}
              onChange={(e) => setSelectedMandateId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-medium"
            >
              <option value="">General Talent Pool (All Matching Roles)</option>
              {mandates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} {m.location ? `(${m.location})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Dropzone */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Attach Resume (PDF / DOCX) *</label>
          <div className="border-2 border-dashed border-slate-300 hover:border-brand-surfaceDark rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
            <input
              type="file"
              required
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              id="resume-upload"
              className="hidden"
            />
            <label htmlFor="resume-upload" className="cursor-pointer block">
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
                    Click to browse or drag & drop resume
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">PDF or DOCX up to 10MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Quick Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Full Name (Optional if in CV)</label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Auto-extracted from resume if blank"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9876543210"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Parsing & Ingesting Profile with Gemini AI...</span>
              </span>
            ) : (
              <>
                <span>Submit Application & CV</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CandidateApplyPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/storefront/${slug}`}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </Link>
          <span className="text-xs font-bold text-slate-900">Candidate Portal</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 w-full">
        <Suspense fallback={<div className="text-center text-xs text-slate-400">Loading Application Portal...</div>}>
          <CandidateApplyForm />
        </Suspense>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        RecruitOS Candidate Ingestion & AI Parsing Engine
      </footer>
    </div>
  );
}

