import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { createCheckItem, updateCheckItem, deleteCheckItem } from "@/lib/apparatus";

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { apparatusId, label, sortOrder, parentId } = await request.json();
  if (!apparatusId || !label) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  await createCheckItem(apparatusId, label, sortOrder ?? 0, parentId ?? null);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, label, sortOrder, active } = await request.json();
  await updateCheckItem(id, label, sortOrder ?? 0, active ?? true);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await deleteCheckItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete item";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
