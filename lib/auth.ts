import { NextRequest } from "next/server";
import { supabase } from "./supabase";

export type TokenUser = {
  id: string;
  email: string;
  role: string;
};

export async function getTokenUser(request: NextRequest): Promise<TokenUser | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Fetch profile for role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "member",
  };
}

export function isAdmin(user: TokenUser): boolean {
  return user.role === "admin";
}
