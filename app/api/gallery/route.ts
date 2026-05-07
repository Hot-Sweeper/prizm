import { auth } from "@/auth";
import { isLocalhostRequestUrl } from "@/lib/credits/whitelist";
import { getUserJobs } from "@/lib/db/queries/jobs";
import { NextResponse } from "next/server";

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

export async function GET(request: Request) {
  const isLocalDev = isLocalhostRequestUrl(request.url);
  let session;
  try {
    session = await withTimeout(auth(), 5000, "auth");
  } catch (error) {
    console.error("[PRIZM][API] /api/gallery auth failed", error);
    if (isLocalDev) {
      return NextResponse.json({ jobs: [], page: 1, localFallback: true });
    }
    return NextResponse.json({ error: "Auth timeout" }, { status: 503 });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  let jobs;
  try {
    jobs = await withTimeout(getUserJobs(session.user.id, page), 5000, "getUserJobs");
  } catch (error) {
    console.error("[PRIZM][API] /api/gallery getUserJobs failed", error);
    if (isLocalDev) {
      return NextResponse.json({ jobs: [], page, localFallback: true });
    }
    return NextResponse.json({ error: "Gallery fetch timeout" }, { status: 503 });
  }

  return NextResponse.json({ jobs, page });
}
