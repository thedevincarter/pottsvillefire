import { NextRequest } from "next/server";
import { supabase } from "./supabase";

export type TokenUser = {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
};

// The display name we store on records (e.g. apparatus check member_name).
// Mirrors the client's `profile?.fullName || user?.email`.
export function displayName(user: TokenUser): string {
  return user.fullName || user.email;
}

export async function getTokenUser(request: NextRequest): Promise<TokenUser | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Supabase validates the token signature but never checks ban status, so a
  // disabled user's unexpired token still passes above. Check it ourselves.
  const [{ data: authUser }, { data: profile }] = await Promise.all([
    supabase.auth.admin.getUserById(user.id),
    supabase.from("profiles").select("role, full_name").eq("id", user.id).single(),
  ]);

  const bannedUntil = authUser?.user?.banned_until;
  if (bannedUntil && new Date(bannedUntil) > new Date()) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "member",
    fullName: profile?.full_name ?? null,
  };
}

export function isAdmin(user: TokenUser): boolean {
  return user.role === "admin";
}
