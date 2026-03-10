import { Client, isFullPageOrDataSource } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export type RunLogEntry = {
  id: string;
  date: string | null;
  callType: string | null;
  complaint: string | null;
  address: string | null;
  response: string | null;
  mutualAid: string | null;
};

function selectName(prop: { type: string; select?: unknown } | undefined): string | null {
  if (prop?.type !== "select") return null;
  const s = prop.select;
  if (s && typeof s === "object" && "name" in s && typeof s.name === "string") {
    return s.name;
  }
  return null;
}

export async function getRunLog(): Promise<RunLogEntry[]> {
  const response = await notion.dataSources.query({
    data_source_id: process.env.NOTION_RUN_LOG_DATABASE_ID!,
    sorts: [{ property: "Date", direction: "descending" }],
  });

  return response.results.filter(isFullPageOrDataSource).map((page) => {
    const props = page.properties;

    const date =
      props.Date?.type === "date" ? props.Date.date?.start ?? null : null;

    const callType = selectName(props["Call Type"] as { type: string; select?: unknown });
    const complaint = selectName(props.Complaint as { type: string; select?: unknown });
    const response = selectName(props.Response as { type: string; select?: unknown });
    const mutualAid = selectName(props["Mutual Aid"] as { type: string; select?: unknown });

    const address =
      props.Address?.type === "rich_text"
        ? props.Address.rich_text.map((t) => t.plain_text).join("") || null
        : null;

    return { id: page.id, date, callType, complaint, address, response, mutualAid };
  });
}
