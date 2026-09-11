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
      className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-xs select-none"
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
  const userPhone = session.user.phone || "+91 9818352440";

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-4 py-2 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between shadow-xs sticky top-0 z-40 gap-2 border-b border-amber-800">
      <div className="flex items-center space-x-2 flex-wrap">
        <span className="bg-black/30 border border-white/20 text-amber-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
          <Sparkles className="h-3 w-3 inline text-amber-300" />
          <span>Demo Sandbox Active</span>
        </span>
        <span className="text-amber-50">
          Outbound client emails route safely to <strong>{userEmail}</strong> & WhatsApp briefings to <strong>{userPhone}</strong>. Real candidates & clients are protected.
        </span>
      </div>
      <span className="text-[11px] text-amber-200/90 font-medium hidden sm:inline">
        Mode managed by Super Admin
      </span>
    </div>
  );
}
