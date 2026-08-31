import { NextRequest, NextResponse } from "next/server";
import { getTokenUser } from "@/lib/auth";
import { startCheck } from "@/lib/apparatus";
import { isCheckMonthOpen } from "@/lib/check-months";
import { currentMonthKey, isMonthKey, monthLabel } from "@/lib/month";

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { apparatusId, month, memberName } = body;

  if (!apparatusId || !month || !memberName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!isMonthKey(month)) {
    return NextResponse.json({ error: "Expected a YYYY-MM month" }, { status: 400 });
  }

  // Checks belong to the current month unless an admin opened a later one
  // early. Past months stay closed — they're history.
  const current = currentMonthKey();
  if (month !== current && !(month > current && (await isCheckMonthOpen(month)))) {
    return NextResponse.json(
      { error: `${monthLabel(month)} checks aren't open yet. Ask an admin to open them.` },
      { status: 403 }
    );
  }

  try {
    const checkId = await startCheck(apparatusId, month, memberName);
    return NextResponse.json({ checkId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to start check";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
