import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: responses, error } = await supabase
    .from("run_responses")
    .select("id, member_name");

  if (error) throw error;

  let updated = 0;

  for (const row of responses ?? []) {
    const parts = row.member_name.split(" ");
    if (parts.length < 2) continue;

    // "Last First" -> "First Last"
    const last = parts[0];
    const first = parts.slice(1).join(" ");
    const newName = `${first} ${last}`;

    if (newName === row.member_name) continue;

    const { error: updateError } = await supabase
      .from("run_responses")
      .update({
        member_name: newName,
        member_email: newName.toLowerCase().replace(/\s+/g, ".") + "@imported",
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`Error updating ${row.member_name}:`, updateError.message);
    } else {
      updated++;
    }
  }

  console.log(`Updated ${updated} of ${responses?.length ?? 0} entries.`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
