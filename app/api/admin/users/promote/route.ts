import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { getOrigin, sendInviteEmail } from "@/lib/invite";
import { promoteRosterMember } from "@/lib/roster";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/errors";

// Give a roster-only member a login once their email is known, then invite them.
export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, email } = await request.json().catch(() => ({}));
  if (!id || !email?.trim()) {
    return NextResponse.json({ error: "A member and an email are required" }, { status: 400 });
  }

  try {
    const { error } = await promoteRosterMember(id, email.trim());
    if (error) return NextResponse.json({ error }, { status: 400 });

    // Look the name back up rather than trusting the client for the greeting.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("email", email.trim())
      .single();

    const { error: inviteError } = await sendInviteEmail({
      origin: getOrigin(request),
      email: email.trim(),
      fullName: profile?.full_name ?? "",
    });

    // The account exists either way; the admin can resend from the users page.
    if (inviteError) console.error("Invite email error:", inviteError);

    return NextResponse.json({ ok: true, inviteError: inviteError ?? null });
  } catch (e) {
    console.error("Failed to promote roster member:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
