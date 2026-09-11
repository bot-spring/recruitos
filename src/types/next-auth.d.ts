import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string | null;
      role: UserRole;
      agencyId: string | null;
      agencyName?: string | null;
      agencySlug?: string | null;
      isSandboxMode: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    role: UserRole;
    agencyId: string | null;
    agencyName?: string | null;
    agencySlug?: string | null;
    isSandboxMode: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    role: UserRole;
    agencyId: string | null;
    agencyName?: string | null;
    agencySlug?: string | null;
    isSandboxMode?: boolean;
  }
}

