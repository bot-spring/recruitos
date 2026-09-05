"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Clock,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface AgencyData {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  jobMandates: Array<{
    id: string;
    title: string;
    department: string | null;
    location: string | null;
    workMode: string;
    minExp: number;
    maxExp: number;
    skills: string[];
    createdAt: string;
  }>;
}

export default function StorefrontLandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStorefront() {
      try {
        setLoading(true);
        const res = await fetch(`/api/storefront/${slug}`);
        if (!res.ok) {
          throw new Error("Agency storefront not found or currently inactive.");
        }
        const data = await res.json();
        setAgency(data.agency);
      } catch (err: any) {
        setError(err.message || "Failed to load storefront");
      } finally {
        setLoading(false);
      }
    }

    if (slug) loadStorefront();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Loading Agency Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md text-center">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Agency Portal Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">{error || "This storefront is unavailable."}</p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-yellow text-slate-900 font-bold text-xs rounded-lg shadow-sm hover:bg-brand-yellowHover transition-all"
          >
            <span>Go to RecruitOS Login</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center font-bold text-slate-800 text-sm shadow-sm">
              {agency.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">{agency.name}</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Talent Advisory
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/storefront/${slug}/hire`}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              <span>Submit Hiring Mandate</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-brand-surfaceLight border border-brand-surface px-3 py-1 rounded-full text-xs font-bold text-slate-800 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-slate-700" />
            <span>Dedicated Executive Search & Staffing Partner</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            {agency.tagline || "Elite Talent Delivered with Velocity & Precision."}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed">
            {agency.description ||
              "We partner with high-growth enterprises and technology disruptors to identify, evaluate, and place game-changing leaders and specialized talent."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/storefront/${slug}/hire`}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-brand-yellow hover:bg-brand-yellowHover text-slate-900 font-extrabold text-sm rounded-xl shadow-md transition-all"
            >
              <span>Engage Us to Hire</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#active-roles"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl shadow-sm transition-all"
            >
              <span>Explore Practice Roles</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Agency Value Guarantee Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-surfaceDark transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-surfaceLight border border-brand-surface flex items-center justify-center mb-4 text-slate-800">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">72-Hour Shortlist Velocity</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We eliminate recruiter latency. Verified candidate profiles delivered to your inbox with zero-login 1-click review links.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-surfaceDark transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-surfaceLight border border-brand-surface flex items-center justify-center mb-4 text-slate-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">90-Day Placement Guarantee</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every placement is backed by our full 90-day replacement commitment to protect your organization’s investment.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-surfaceDark transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-surfaceLight border border-brand-surface flex items-center justify-center mb-4 text-slate-800">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Active Notice Period Radar</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our automated candidate retention engine prevents 30–90 day counter-offer drop-offs before Day 1 start dates.
            </p>
          </div>
        </div>

        {/* Active Practice Mandates Section */}
        <div id="active-roles" className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Executive & Search Mandates</h2>
              <p className="text-xs text-slate-500">Sample open searches managed by {agency.name}</p>
            </div>

            <Link
              href={`/storefront/${slug}/hire`}
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-800 hover:text-slate-950"
            >
              <span>Need to hire for a custom role?</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {agency.jobMandates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Currently accepting new bespoke hiring mandates</p>
              <p className="text-xs text-slate-400 mt-1">Submit your requirement to initiate a dedicated talent search.</p>
              <Link
                href={`/storefront/${slug}/hire`}
                className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-brand-yellow text-slate-900 font-bold text-xs rounded-lg shadow-sm hover:bg-brand-yellowHover"
              >
                <span>Submit Mandate Now</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {agency.jobMandates.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-surfaceLight text-slate-700 px-2 py-0.5 rounded border border-brand-surface">
                        {job.department || "General"}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center">
                        <MapPin className="h-3 w-3 inline mr-1 text-slate-400" />
                        {job.location || job.workMode}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mb-1">{job.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Experience: {job.minExp}–{job.maxExp} Years • Work Mode: {job.workMode}
                    </p>

                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Search Active</span>
                    <Link
                      href={`/storefront/${slug}/hire`}
                      className="font-bold text-slate-800 hover:text-slate-950 flex items-center space-x-1"
                    >
                      <span>Inquire</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">{agency.name}</span>
            <span>•</span>
            <span>Recruitment & Executive Search</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[11px] text-slate-400">Powered by RecruitOS Multi-Tenant Architecture</span>
            <Link href="/login" className="font-semibold text-slate-600 hover:text-slate-900">
              Agency Staff Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

