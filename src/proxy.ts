import { NextResponse, type NextRequest } from "next/server";

// Lightweight guard: if there's no session cookie at all, bounce to /login
// before rendering a protected page. Full verification happens server-side
// in requireUser(); this just improves UX and avoids a flash of content.
const PROTECTED = ["/dashboard", "/deals", "/invoices", "/insights", "/media-kit", "/settings"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has("pp_session");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/deals/:path*", "/invoices/:path*", "/insights/:path*", "/media-kit/:path*", "/settings/:path*"],
};
