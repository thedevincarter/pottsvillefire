import { NextRequest, NextResponse } from "next/server";

// Handle Supabase auth redirects (magic links, password resets)
// Forwards the hash fragment to the appropriate page
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/members/run-log";
  return NextResponse.redirect(new URL(next, request.url));
}
