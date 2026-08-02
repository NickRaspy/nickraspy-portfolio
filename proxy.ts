import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  detectPreferredLocale,
  isSupportedLocale,
  localeCookieName,
  localeHeaderName,
  type SupportedLocale,
} from "@/src/i18n/config";

function localeFromPathname(pathname: string): SupportedLocale | null {
  const segment = pathname.split("/")[1];
  return isSupportedLocale(segment) ? segment : null;
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const savedLocale = request.cookies.get(localeCookieName)?.value;
    const locale = isSupportedLocale(savedLocale)
      ? savedLocale
      : detectPreferredLocale(request.headers.get("accept-language"));
    const localizedUrl = request.nextUrl.clone();
    localizedUrl.pathname = `/${locale}`;
    const response = NextResponse.redirect(localizedUrl);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Accept-Language, Cookie");
    return response;
  }

  const locale = localeFromPathname(request.nextUrl.pathname) ?? defaultLocale;
  const requestedPreference = request.nextUrl.searchParams.get("setLocale");

  if (requestedPreference === locale) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("setLocale");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(localeCookieName, locale, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/", "/en/:path*", "/ru/:path*"],
};
