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
};

export async function getRunLog(): Promise<RunLogEntry[]> {
  const response = await notion.dataSources.query({
    data_source_id: process.env.NOTION_RUN_LOG_DATABASE_ID!,
    sorts: [{ property: "Date", direction: "descending" }],
  });

  return response.results.filter(isFullPageOrDataSource).map((page) => {
    const props = page.properties;

    const date =
      props.Date?.type === "date" ? props.Date.date?.start ?? null : null;

    const callType =
      props["Call Type"]?.type === "select"
        ? props["Call Type"].select?.name ?? null
        : null;

    const complaint =
      props.Complaint?.type === "select"
        ? props.Complaint.select?.name ?? null
        : null;

    const address =
      props.Address?.type === "rich_text"
        ? props.Address.rich_text.map((t) => t.plain_text).join("") || null
        : null;

    const response =
      props.Response?.type === "select"
        ? props.Response.select?.name ?? null
        : null;

    return { id: page.id, date, callType, complaint, address, response };
  });
}
