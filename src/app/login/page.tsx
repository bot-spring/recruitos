"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight, Sparkles, Building2, User } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!res || res.error) {
        setError(res?.error || "Invalid email or password");
        setLoading(false);
      } else {
        router.push(res.url || callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-200/80">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your credentials to access your agency dashboard
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
          <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.com"
              className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-surfaceDark focus:border-slate-500 bg-white placeholder-slate-400 text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-surfaceDark focus:border-slate-500 bg-white placeholder-slate-400 text-slate-900"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-900 bg-brand-yellow hover:bg-brand-yellowHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-yellow transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Quick Login Testing Assist */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Development Test Credentials
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("ankur@botspring.in", "Password@123")}
            className="flex items-center justify-between p-2 rounded-lg bg-brand-surfaceLight border border-brand-surface text-left hover:border-brand-surfaceDark transition-colors text-xs"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-brand-surface flex items-center justify-center text-[10px] font-bold text-slate-700">
                SA
              </div>
              <div>
                <div className="font-semibold text-slate-800">Super Admin (Ankur)</div>
                <div className="text-[10px] text-slate-500">ankur@botspring.in</div>
              </div>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
              Fill
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("owner@apexsearch.com", "Password@123")}
            className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-left hover:border-slate-300 transition-colors text-xs"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Agency Owner (Apex Search)</div>
                <div className="text-[10px] text-slate-500">owner@apexsearch.com</div>
              </div>
            </div>
            <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
              Fill
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("priya@apexsearch.com", "Password@123")}
            className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-left hover:border-slate-300 transition-colors text-xs"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Desk Recruiter (Priya)</div>
                <div className="text-[10px] text-slate-500">priya@apexsearch.com</div>
              </div>
            </div>
            <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
              Fill
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F8FAFC] to-[#edf2fa]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-brand-surface border border-brand-surfaceDark flex items-center justify-center shadow-sm">
            <span className="font-bold text-slate-800 text-xl tracking-tight">R</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Recruit<span className="text-brand-slate">OS</span>
          </h1>
        </div>
        <p className="text-center text-xs font-medium text-slate-500 uppercase tracking-widest">
          Recruitment Agency Operating System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

