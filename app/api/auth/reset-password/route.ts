import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;

    // Generate a recovery link (doesn't send email with admin API)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });

    // Don't reveal whether the user exists
    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ ok: true });
    }

    const tokenHash = linkData.properties.hashed_token;
    const resetUrl = `${origin}/reset-password?token_hash=${tokenHash}&type=recovery`;

    await getResend().emails.send({
      from: "Pottsville Fire <noreply@pottsvillefd.org>",
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Password Reset</h2>
        <p>We received a request to reset your Pottsville Fire Department account password.</p>
        <p>Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#c92a2a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a></p>
        <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.<br><br>If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ ok: true });
  }
}
