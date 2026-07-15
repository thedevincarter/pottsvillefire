import { NextRequest, NextResponse } from "next/server";
import { getTokenUser } from "@/lib/auth";
import { updateCheckResult, completeCheck, cancelCheck } from "@/lib/apparatus";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "updateResult") {
    const { resultId, checked, notes } = body;
    await updateCheckResult(resultId, checked, notes ?? null);
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    const { generalNotes } = body;
    await completeCheck(id, generalNotes ?? null);
    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    await cancelCheck(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
