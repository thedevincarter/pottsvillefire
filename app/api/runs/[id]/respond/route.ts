import { NextRequest, NextResponse } from "next/server";
import { getTokenUser } from "@/lib/auth";
import { toggleRespondedMember, getRunDate } from "@/lib/runs";
import { isMonthLocked } from "@/lib/run-locks";
import { monthKey, monthLabel } from "@/lib/month";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Once a month is locked nobody self-serves a response change in it —
  // admins included, so the month's numbers stay put. Admins can still
  // correct a run through the edit form.
  const runDate = await getRunDate(id);
  if (runDate) {
    const month = monthKey(runDate);
    if (await isMonthLocked(month)) {
      return NextResponse.json(
        { error: `${monthLabel(month)} is locked — responses can no longer be changed.` },
        { status: 403 }
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const memberName = body.memberName || user.email;
  try {
    await toggleRespondedMember(id, memberName, user.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to toggle responded member:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
