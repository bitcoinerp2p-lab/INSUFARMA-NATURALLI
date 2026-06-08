import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

    try {
      const payload = verifyToken(token);
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("auth-token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
