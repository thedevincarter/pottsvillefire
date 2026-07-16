import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { email, fullName, role } = await request.json();
    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and full name are required" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;

    // Invite user via email — Supabase sends the invite through SMTP
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName },
        redirectTo: `${origin}/auth/callback?next=/set-password`,
      }
    );

    if (inviteError || !inviteData?.user) {
      return NextResponse.json(
        { error: inviteError?.message || "Failed to invite user" },
        { status: 400 }
      );
    }

    // Update profile with role if specified
    if (role && role !== "member") {
      await supabase
        .from("profiles")
        .update({ role, full_name: fullName })
        .eq("id", inviteData.user.id);
    }

    return NextResponse.json({
      ok: true,
      userId: inviteData.user.id,
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

  const { id, fullName, role, phone } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (fullName !== undefined) updates.full_name = fullName;
  if (role !== undefined) updates.role = role;
  if (phone !== undefined) updates.phone = phone;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
