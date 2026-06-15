import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "insufarma-secret-key-change-in-prod"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("auth-token");
      return res;
    }
  }

  // Affiliate area protection
  if (pathname.startsWith("/afiliado/dashboard")) {
    const token = req.cookies.get("affiliate-token")?.value;
    if (!token) return NextResponse.redirect(new URL("/afiliado/login", req.url));

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (!payload.affiliateId) {
        return NextResponse.redirect(new URL("/afiliado/login", req.url));
      }
    } catch {
      const res = NextResponse.redirect(new URL("/afiliado/login", req.url));
      res.cookies.delete("affiliate-token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/afiliado/dashboard/:path*", "/afiliado/dashboard"] };
