import { auth } from "@/auth";

// Next.js 16 uses "proxy" instead of "middleware" — must be a named const export
export const proxy = auth;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|register|$).*)",
  ],
};
