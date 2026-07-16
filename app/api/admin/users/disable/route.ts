import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// Supabase has no permanent ban, only a duration, so ~100 years stands in.
const FOREVER = "876000h";

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, disabled } = await request.json();
  if (!id || typeof disabled !== "boolean") {
    return NextResponse.json(
      { error: "User ID and disabled flag are required" },
      { status: 400 }
    );
  }

  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot disable your own account" },
      { status: 400 }
    );
  }

  const { error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: disabled ? FOREVER : "none",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
