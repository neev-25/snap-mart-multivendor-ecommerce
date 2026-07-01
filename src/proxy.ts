import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "./lib/safeAuth";
import { isAuthRequiredPage, isPublicPage } from "./lib/authRoutes";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const alwaysPublic = ["/login", "/register", "/forgot-password", "/reset-password", "/api/auth"];
  if (alwaysPublic.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const session = await safeAuth();

  if (isAuthRequiredPage(pathname) && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPage(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|css|js)$).*)",
  ],
};
