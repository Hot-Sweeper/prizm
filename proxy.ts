import { NextResponse, type NextRequest } from "next/server";

// Keep proxy lightweight while debugging request stalls.
// Auth guards run at route/page level.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|$).*)",
  ],
};
