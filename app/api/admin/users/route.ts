import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { getOrigin, sendInviteEmail } from "@/lib/invite";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Login and ban state live in auth.users, not profiles, so status has to be
  // derived by merging the two rather than stored alongside the profile.
  const [profilesResult, authResult] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });
  }
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error.message }, { status: 500 });
  }

  const authById = new Map(authResult.data.users.map((u) => [u.id, u]));

  const users = (profilesResult.data ?? []).map((profile) => {
    const authUser = authById.get(profile.id);
    const bannedUntil = authUser?.banned_until;
    const disabled = !!bannedUntil && new Date(bannedUntil) > new Date();
    const lastSignInAt = authUser?.last_sign_in_at ?? null;

    return {
      ...profile,
      last_sign_in_at: lastSignInAt,
      status: disabled ? "disabled" : lastSignInAt ? "active" : "invited",
    };
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { email, fullName, role, rank, number } = await request.json();
    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and full name are required" }, { status: 400 });
    }

    const origin = getOrigin(request);

    // Create user without sending email
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      user_metadata: { full_name: fullName },
      email_confirm: true,
    });

    if (createError || !newUser?.user) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Update profile with additional fields
    const profileUpdates: Record<string, string | null> = { full_name: fullName };
    if (role && role !== "member") profileUpdates.role = role;
    if (rank) profileUpdates.rank = rank;
    if (number) profileUpdates.number = number;

    await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", newUser.user.id);

    const { error: inviteError } = await sendInviteEmail({ origin, email, fullName });

    // The account exists either way; the admin can resend from the users page.
    if (inviteError) {
      console.error("Invite email error:", inviteError);
    }

    return NextResponse.json({
      ok: true,
      userId: newUser.user.id,
    });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, fullName, role, phone, rank, number } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (fullName !== undefined) updates.full_name = fullName;
  if (role !== undefined) updates.role = role;
  if (phone !== undefined) updates.phone = phone;
  if (rank !== undefined) updates.rank = rank;
  if (number !== undefined) updates.number = number;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
