import { auth } from "@/auth";
import { getBalances } from "@/lib/credits";
import { isWhitelistedEmail } from "@/lib/credits/whitelist";
import { NextResponse } from "next/server";

const INFINITE_BALANCE = { image: 999_999, video: 999_999 };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isWhitelistedEmail(session.user.email)) {
    return NextResponse.json(INFINITE_BALANCE);
  }

  const balances = await getBalances(session.user.id);
  return NextResponse.json(balances);
}
