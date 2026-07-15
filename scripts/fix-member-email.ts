import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map imported member names to their real emails
const emailMap: Record<string, string> = {
  "Devin Carter": "the.devin.carter@outlook.com",
};

async function main() {
  let updated = 0;

  for (const [name, email] of Object.entries(emailMap)) {
    const { data, error } = await supabase
      .from("run_responses")
      .update({ member_email: email })
      .eq("member_name", name)
      .eq("member_email", name.toLowerCase().replace(/\s+/g, ".") + "@imported")
      .select("id");

    if (error) {
      console.error(`Error updating ${name}:`, error.message);
    } else {
      updated += data?.length ?? 0;
      console.log(`Updated ${data?.length ?? 0} entries for ${name}`);
    }
  }

  console.log(`Done. Updated ${updated} total entries.`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
