"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";

/**
 * UserSandboxToggle
 * Passive status badge rendered in the header when the user is designated as a Demo / Sandbox user by Super Admin.
 * When in live production mode, this renders null to preserve a clean, uncluttered enterprise experience.
 */
export function UserSandboxToggle() {
  const { data: session } = useSession();

  if (!session?.user?.isSandboxMode) {
    return null;
  }

  return (
    <div
      title="Demo Sandbox is Active. Outbound communications are safely diverted to your account."
      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold select-none shadow-2xs"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
      <span>Demo Sandbox Active</span>
    </div>
  );
}

/**
 * UserSandboxBanner
 * Persistent top notification banner displayed only when the logged-in user is a Demo / Sandbox account.
 * Clearly informs the user where outbound communications are being safely routed.
 * Normal live users see nothing (returns null).
 */
export function UserSandboxBanner() {
  const { data: session } = useSession();

  if (!session?.user?.isSandboxMode) return null;

  const userEmail = session.user.email;
  const userPhone = session.user.phone || "+91 98183 52440";

  return (
    <aside className="h-9 bg-[#ffddb8] text-[#2a1700] px-4 sm:px-6 border-b border-[#ffb95f]/50 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)] sticky top-0 z-40">
      <div className="flex items-center gap-2 truncate">
        <span className="text-amber-800 animate-pulse text-xs font-black">⚡</span>
        <span className="font-mono text-[11px] font-semibold tracking-wide uppercase truncate">
          DEMO SANDBOX ACTIVE · Outbound client emails route safely to {userEmail} &amp; WhatsApp briefings to {userPhone}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 text-[#2a1700] font-mono text-[11px] font-medium border border-amber-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Active Sync: Protected
        </span>
        <span className="font-mono text-[11px] text-[#653e00] font-medium hidden sm:inline">
          Mode managed by Super Admin
        </span>
      </div>
    </aside>
  );
}
