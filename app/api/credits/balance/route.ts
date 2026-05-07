import { auth } from "@/auth";
import { getBalances } from "@/lib/credits";
import { isWhitelistedForRequest } from "@/lib/credits/whitelist";
import { NextResponse } from "next/server";

const INFINITE_BALANCE = { image: 999_999, video: 999_999 };

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

export async function GET(request: Request) {
  const isLocalDev = isWhitelistedForRequest(undefined, request.url);
  let session;
  try {
    session = await withTimeout(auth(), 5000, "auth");
  } catch (error) {
    console.error("[PRIZM][API] /api/credits/balance auth failed", error);
    if (isLocalDev) {
      return NextResponse.json(INFINITE_BALANCE);
    }
    return NextResponse.json({ error: "Auth timeout" }, { status: 503 });
  }

  if (!session?.user?.id) {
    if (isLocalDev) {
      return NextResponse.json(INFINITE_BALANCE);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isWhitelistedForRequest(session.user.email, request.url)) {
    return NextResponse.json(INFINITE_BALANCE);
  }

  let balances;
  try {
    balances = await withTimeout(getBalances(session.user.id), 5000, "getBalances");
  } catch (error) {
    console.error("[PRIZM][API] /api/credits/balance getBalances failed", error);
    return NextResponse.json({ error: "Balance fetch timeout" }, { status: 503 });
  }

  return NextResponse.json(balances);
}
