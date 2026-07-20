import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, displayName } from "@/lib/auth";
import { toggleTrainingAttendance } from "@/lib/trainings";

// A member toggles their own attendance. The name is derived server-side so it
// always matches their roster name and can't be spoofed for someone else.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await toggleTrainingAttendance(id, displayName(user));
  return NextResponse.json({ ok: true });
}
