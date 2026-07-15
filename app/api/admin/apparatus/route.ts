import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { createApparatus, updateApparatus } from "@/lib/apparatus";

export async function POST(request: NextRequest) {
  const user = getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, sortOrder } = await request.json();
  await createApparatus(name, sortOrder ?? 0);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const user = getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, name, sortOrder, active } = await request.json();
  await updateApparatus(id, name, sortOrder ?? 0, active ?? true);
  return NextResponse.json({ ok: true });
}
