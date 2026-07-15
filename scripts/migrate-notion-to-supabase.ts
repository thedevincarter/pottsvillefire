import { Client, isFullPageOrDataSource } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

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
  console.log(`Found ${pages.length} runs in Notion`);

  const rows = pages
    .map((page) => {
      const props = page.properties;

      const date =
        props.Date?.type === "date"
          ? (props.Date.date?.start ?? null)
          : null;
      const callType = selectName(
        props["Call Type"] as { type: string; select?: unknown }
      );
      const complaint = selectName(
        props.Complaint as { type: string; select?: unknown }
      );
      const mutualAid = selectName(
        props["Mutual Aid"] as { type: string; select?: unknown }
      );
      const address =
        props.Address?.type === "rich_text"
          ? props.Address.rich_text.map((t) => t.plain_text).join("") || null
          : null;

      return {
        date,
        call_type: callType,
        complaint,
        address,
        mutual_aid: mutualAid,
      };
    })
    .filter((r) => r.date); // skip rows with no date

  console.log(`Inserting ${rows.length} runs into Supabase...`);

  // Insert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from("runs").insert(batch);
    if (error) {
      console.error(`Error inserting batch at offset ${i}:`, error);
      process.exit(1);
    }
    console.log(`  Inserted ${Math.min(i + 500, rows.length)}/${rows.length}`);
  }

  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
