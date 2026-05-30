import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/admin-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = req.cookies.get("admin_session");
    const isValid = session ? await verifySessionCookie(session.value) : false;

    if (!isValid) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
