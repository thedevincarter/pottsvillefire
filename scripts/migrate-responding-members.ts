import { Client, isFullPageOrDataSource } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function selectName(
  prop: { type: string; select?: unknown } | undefined
): string | null {
  if (prop?.type !== "select") return null;
  const s = prop.select;
  if (s && typeof s === "object" && "name" in s && typeof s.name === "string") {
    return s.name;
  }
  return null;
}

async function migrate() {
  console.log("Fetching runs from Notion...");

  const allResults: Awaited<
    ReturnType<typeof notion.dataSources.query>
  >["results"] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_RUN_LOG_DATABASE_ID!,
      sorts: [{ property: "Date", direction: "ascending" }],
      start_cursor: cursor,
    });
    allResults.push(...response.results);
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  const pages = allResults.filter(isFullPageOrDataSource);

  // Extract runs that have responding members
  const notionRuns = pages
    .map((page) => {
      const props = page.properties;
      const date =
        props.Date?.type === "date"
          ? (props.Date.date?.start ?? null)
          : null;
      const complaint = selectName(
        props.Complaint as { type: string; select?: unknown }
      );
      const respondingMembers =
        props["Responding Members"]?.type === "multi_select"
          ? (
              props["Responding Members"].multi_select as { name: string }[]
            ).map((s) => s.name)
          : [];
      return { date, complaint, respondingMembers };
    })
    .filter((r) => r.date && r.respondingMembers.length > 0);

  console.log(
    `Found ${notionRuns.length} runs with responding members in Notion`
  );

  if (notionRuns.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  // Fetch all Supabase runs to match by date
  const { data: supabaseRuns, error } = await supabase
    .from("runs")
    .select("id, date, complaint");
  if (error) throw error;

  let inserted = 0;
  let skipped = 0;

  for (const notionRun of notionRuns) {
    // Compare dates as UTC timestamps to handle timezone differences
    const notionTs = new Date(notionRun.date!).getTime();
    const match = supabaseRuns?.find(
      (sr) =>
        new Date(sr.date).getTime() === notionTs &&
        sr.complaint === notionRun.complaint
    );

    if (!match) {
      console.warn(
        `  No Supabase match for: ${notionRun.date} - ${notionRun.complaint}`
      );
      skipped++;
      continue;
    }

    const rows = notionRun.respondingMembers.map((name) => ({
      run_id: match.id,
      member_name: name,
      member_email: name.toLowerCase().replace(/\s+/g, ".") + "@imported",
    }));

    const { error: insertError } = await supabase
      .from("run_responses")
      .upsert(rows, { onConflict: "run_id,member_email" });

    if (insertError) {
      console.error(
        `  Error inserting for ${notionRun.date}:`,
        insertError.message
      );
    } else {
      inserted += rows.length;
    }
  }

  console.log(
    `Migration complete! Inserted ${inserted} responses, skipped ${skipped} unmatched runs.`
  );
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
