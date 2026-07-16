import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Handles the auth code exchange from Supabase email links (invites, password resets)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/members/run-log";

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Redirect to the target page with the session tokens in the hash
      // so the browser-side Supabase client can pick them up
      const redirectUrl = new URL(next, request.url);
      redirectUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=invite`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If no code or exchange failed, redirect with error
  const errorUrl = new URL("/set-password?error=invalid", request.url);
  return NextResponse.redirect(errorUrl);
}
