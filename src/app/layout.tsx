import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "RecruitOS — Recruitment Agency Operating System",
  description: "Operational Intelligence, Multi-Tenant Governance, and Recruitment Pipeline Radar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-brand-surface selection:text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

