import { auth } from "@/auth";
import { getBalances } from "@/lib/credits";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balances = await getBalances(session.user.id);
  return NextResponse.json(balances);
}
