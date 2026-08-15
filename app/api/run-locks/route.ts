import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin, displayName, type TokenUser } from "@/lib/auth";
import { lockMonth, unlockMonth } from "@/lib/run-locks";
import { isMonthKey } from "@/lib/month";
import { errorMessage } from "@/lib/errors";

type Guard =
  | { ok: false; response: NextResponse }
  | { ok: true; user: TokenUser; month: string };

// Locking and unlocking a month are admin-only.
async function guard(request: NextRequest): Promise<Guard> {
  const user = await getTokenUser(request);
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isAdmin(user)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const { month } = await request.json().catch(() => ({}));
  if (!isMonthKey(month)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Expected a YYYY-MM month" }, { status: 400 }),
    };
  }
  return { ok: true, user, month };
}

export async function POST(request: NextRequest) {
  const result = await guard(request);
  if (!result.ok) return result.response;

  try {
    await lockMonth(result.month, displayName(result.user));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to lock month:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const result = await guard(request);
  if (!result.ok) return result.response;

  try {
    await unlockMonth(result.month);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to unlock month:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
