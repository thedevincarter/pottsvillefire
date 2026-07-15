import { NextRequest, NextResponse } from "next/server";
import { getTokenUser } from "@/lib/auth";
import { toggleRespondedMember } from "@/lib/runs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const memberName = body.memberName || user.full_name || user.email;
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
