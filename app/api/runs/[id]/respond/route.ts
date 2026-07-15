import { NextRequest, NextResponse } from "next/server";
import { getTokenUser } from "@/lib/auth";
import { toggleRespondedMember } from "@/lib/notion";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const memberName = user.full_name || user.email;
  await toggleRespondedMember(id, memberName);
  return NextResponse.json({ ok: true });
}
