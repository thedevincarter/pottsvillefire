import { NextRequest, NextResponse } from "next/server";
import { getTokenUser } from "@/lib/auth";
import { startCheck } from "@/lib/apparatus";

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

  try {
    const checkId = await startCheck(apparatusId, month, memberName);
    return NextResponse.json({ checkId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to start check";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
