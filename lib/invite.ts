import { NextRequest } from "next/server";
import { Resend } from "resend";
import { supabase } from "./supabase";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export function getOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function sendInviteEmail({
  origin,
  email,
  fullName,
}: {
  origin: string;
  email: string;
  fullName: string;
}): Promise<{ error: string | null }> {
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/set-password` },
  });

  // Supabase rate limits link generation to one per 60s per address.
  if (linkError) return { error: linkError.message };

  const tokenHash = linkData?.properties?.hashed_token;
  if (!tokenHash) return { error: "Could not generate an invite link" };

  const inviteUrl = `${origin}/set-password?token_hash=${tokenHash}&type=magiclink`;

  const { error: emailError } = await getResend().emails.send({
    from: "Pottsville Fire <noreply@pottsvillefd.org>",
    to: email,
    subject: "You've been invited to Pottsville Fire",
    html: `
        <h2>Welcome to Pottsville Fire, ${fullName}!</h2>
        <p>You've been invited to the Pottsville Fire Department members area.</p>
        <p>Click the link below to set your password and get started:</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#c92a2a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Set Your Password</a></p>
        <p style="color:#666;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br>${inviteUrl}</p>
      `,
  });

  if (emailError) return { error: emailError.message };

  return { error: null };
}
