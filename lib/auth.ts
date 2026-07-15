import { NextRequest } from "next/server";

export type TokenUser = {
  sub: string;
  email: string;
  full_name?: string;
  roles: string[];
};

export function getTokenUser(request: NextRequest): TokenUser | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  try {
    // Decode the JWT payload (Netlify Identity token)
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    return {
      sub: payload.sub,
      email: payload.email,
      full_name:
        payload.user_metadata?.full_name ??
        payload.user_metadata?.name ??
        payload.full_name ??
        payload.name,
      roles: payload.app_metadata?.roles ?? [],
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: TokenUser): boolean {
  return user.roles.includes("admin");
}
