import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "recruitos_super_secret_jwt_key_botspring_2026" });

  // Public paths that do not require authentication
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/storefront") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico");

  // If user is logged in and tries to access /login, redirect to appropriate dashboard
  if (token && pathname === "/login") {
    if (token.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin", req.url));
    }
    return NextResponse.redirect(new URL("/cockpit", req.url));
  }

  // Super Admin specific route protection
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/super-admin")) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login?callbackUrl=" + encodeURIComponent(pathname), req.url));
    }
    if (token.role !== "SUPER_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Super Admin privileges required." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/cockpit", req.url));
    }
    return NextResponse.next();
  }

  // Protected Agency routes (Cockpit, Mandates, Candidates, etc.)
  if (!isPublicPath) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized: Authentication required." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login?callbackUrl=" + encodeURIComponent(pathname), req.url));
    }

    // Attach agency_id to request headers for downstream API route consumption
    const requestHeaders = new Headers(req.headers);
    if (token.agencyId) {
      requestHeaders.set("x-agency-id", token.agencyId as string);
    }
    requestHeaders.set("x-user-id", token.id as string);
    requestHeaders.set("x-user-role", token.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/api/super-admin/:path*",
    "/cockpit/:path*",
    "/mandates/:path*",
    "/candidates/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/login",
  ],
};

