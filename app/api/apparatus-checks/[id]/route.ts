import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import {
  updateCheckResult,
  completeCheck,
  cancelCheck,
  resetCheck,
  deleteCheck,
} from "@/lib/apparatus";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "updateResult") {
    const { resultId, checked, notes, status } = body;
    await updateCheckResult(resultId, checked, notes ?? null, status ?? undefined);
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

  // Reset and delete rewrite or destroy a completed check, so they're admin-only.
  if (action === "reset" || action === "delete") {
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (action === "reset") {
      await resetCheck(id);
    } else {
      await deleteCheck(id);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
