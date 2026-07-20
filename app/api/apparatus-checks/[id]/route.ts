import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin, displayName } from "@/lib/auth";
import {
  updateCheckResult,
  completeCheck,
  cancelCheck,
  resetCheck,
  deleteCheck,
  getCheckMemberName,
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

  // Checking items off, completing, and cancelling an in-progress check are
  // limited to the member who started it (or an admin).
  if (action === "updateResult" || action === "complete" || action === "cancel") {
    const memberName = await getCheckMemberName(id);
    if (memberName === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!isAdmin(user) && memberName !== displayName(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
