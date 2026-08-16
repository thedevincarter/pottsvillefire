import { supabase } from "./supabase";

// Run responses are keyed by member_email, so a member with no email needs a
// stand-in. This mirrors the placeholder syncRespondingMembers has always
// generated for names it didn't recognise, so existing rows keep matching.
export function placeholderEmail(fullName: string): string {
  return `${fullName.toLowerCase().replace(/\s+/g, ".")}@member`;
}

export function isPlaceholderEmail(email: string | null): boolean {
  return !!email && email.endsWith("@member");
}

/**
 * Add someone to the roster without a login. Returns the new profile id.
 * Fails if the name is already taken — names are how responses, assignments
 * and export columns identify a member, so duplicates would be ambiguous.
 */
export async function createRosterOnlyMember(fields: {
  fullName: string;
  role?: string;
  rank?: string | null;
  number?: string | null;
}): Promise<{ id: string | null; error: string | null }> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("full_name", fields.fullName)
    .limit(1);

  if (existing?.length) {
    return { id: null, error: "Someone with that name is already on the roster" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      full_name: fields.fullName,
      email: null,
      role: fields.role ?? "member",
      rank: fields.rank ?? null,
      number: fields.number ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

/**
 * Give a roster-only member a real login once their email is known.
 *
 * Creating the auth user fires the handle_new_user trigger, which inserts its
 * own profile row keyed to the auth id. Rather than repoint the roster row's
 * primary key — which other tables reference — the roster row's details are
 * copied onto the new profile and the roster row is dropped.
 */
export async function promoteRosterMember(
  profileId: string,
  email: string
): Promise<{ error: string | null }> {
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (readError || !profile) return { error: "Member not found" };
  if (profile.email) return { error: "This member already has an email" };

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    user_metadata: { full_name: profile.full_name },
    email_confirm: true,
  });
  if (createError || !created?.user) {
    return { error: createError?.message ?? "Could not create the login" };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: profile.full_name,
      role: profile.role,
      rank: profile.rank,
      number: profile.number,
      phone: profile.phone,
    })
    .eq("id", created.user.id);
  if (updateError) return { error: updateError.message };

  // Their history was recorded under a placeholder address; repoint it so the
  // member can toggle those responses themselves instead of double-adding.
  await repointResponses(profile.full_name, email);

  const { error: deleteError } = await supabase.from("profiles").delete().eq("id", profileId);
  if (deleteError) return { error: deleteError.message };

  return { error: null };
}

// unique(run_id, member_email) means a row already recorded under the real
// address blocks the update, so those are dropped rather than repointed.
async function repointResponses(fullName: string, email: string) {
  const { data: rows } = await supabase
    .from("run_responses")
    .select("id, run_id, member_email")
    .eq("member_name", fullName);

  if (!rows?.length) return;

  const runsWithRealEmail = new Set(
    rows.filter((r) => r.member_email === email).map((r) => r.run_id)
  );

  for (const row of rows) {
    if (row.member_email === email) continue;
    if (runsWithRealEmail.has(row.run_id)) {
      await supabase.from("run_responses").delete().eq("id", row.id);
    } else {
      await supabase.from("run_responses").update({ member_email: email }).eq("id", row.id);
    }
  }
}
