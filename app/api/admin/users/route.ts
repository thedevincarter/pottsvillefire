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

    // Create user with email confirmed (no email sent)
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

    // Update profile with role if specified
    if (role && role !== "member") {
      await supabase
        .from("profiles")
        .update({ role, full_name: fullName })
        .eq("id", newUser.user.id);
    }

    // Generate a magic link the admin can share
    const origin = request.nextUrl.origin;
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/set-password` },
    });

    return NextResponse.json({
      ok: true,
      userId: newUser.user.id,
      inviteLink: linkData?.properties?.action_link ?? null,
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
