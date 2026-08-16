import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { getOrigin, sendInviteEmail } from "@/lib/invite";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!profile.email) {
    return NextResponse.json(
      { error: "This member has no email yet — add one to send an invite" },
      { status: 400 }
    );
  }

  const { error: inviteError } = await sendInviteEmail({
    origin: getOrigin(request),
    email: profile.email,
    fullName: profile.full_name,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
