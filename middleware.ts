import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  const token = process.env.ADMIN_SESSION_TOKEN;

  if (!session || !token || session.value !== token) {
    // API routes → 401
    if (req.nextUrl.pathname.startsWith("/api/admin/bookings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Admin pages → redirect to login
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/api/admin/bookings/:path*", "/api/admin/desks/:path*", "/api/admin/closed-dates", "/api/admin/closed-weekdays", "/api/admin/open-date-overrides", "/api/admin/floor", "/api/admin/upcoming"],
};
