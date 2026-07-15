import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { createRun, type RunLogInput } from "@/lib/runs";

export async function POST(request: NextRequest) {
  const user = getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data: RunLogInput = await request.json();
  await createRun(data);
  return NextResponse.json({ ok: true });
}
