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
  respondedMembers: string[];
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

    const respondedMembers =
      props["Responded Members"]?.type === "multi_select"
        ? (props["Responded Members"].multi_select as { name: string }[]).map((s) => s.name)
        : [];

    return { id: page.id, date, callType, complaint, address, response, mutualAid, respondedMembers };
  });
}

export type RunLogInput = {
  date?: string;
  callType?: string;
  complaint?: string;
  address?: string;
  response?: string;
  mutualAid?: string;
};

function buildProperties(data: RunLogInput) {
  const props: Record<string, unknown> = {};

  if (data.date !== undefined) {
    props.Date = { date: data.date ? { start: data.date } : null };
  }
  if (data.callType !== undefined) {
    props["Call Type"] = { select: data.callType ? { name: data.callType } : null };
  }
  if (data.complaint !== undefined) {
    props.Complaint = { select: data.complaint ? { name: data.complaint } : null };
  }
  if (data.address !== undefined) {
    props.Address = {
      rich_text: data.address ? [{ text: { content: data.address } }] : [],
    };
  }
  if (data.response !== undefined) {
    props.Response = { select: data.response ? { name: data.response } : null };
  }
  if (data.mutualAid !== undefined) {
    props["Mutual Aid"] = { select: data.mutualAid ? { name: data.mutualAid } : null };
  }

  return props;
}

export async function createRun(data: RunLogInput) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_RUN_LOG_DATABASE_ID! },
    properties: buildProperties(data) as Parameters<typeof notion.pages.create>[0]["properties"],
  });
}

export async function updateRun(pageId: string, data: RunLogInput) {
  return notion.pages.update({
    page_id: pageId,
    properties: buildProperties(data) as Parameters<typeof notion.pages.update>[0]["properties"],
  });
}

export async function toggleRespondedMember(pageId: string, memberName: string) {
  const page = await notion.pages.retrieve({ page_id: pageId });
  if (!("properties" in page)) throw new Error("Invalid page");

  const prop = page.properties["Responded Members"];
  const current =
    prop?.type === "multi_select"
      ? (prop.multi_select as { name: string }[]).map((s) => s.name)
      : [];

  const updated = current.includes(memberName)
    ? current.filter((n) => n !== memberName)
    : [...current, memberName];

  return notion.pages.update({
    page_id: pageId,
    properties: {
      "Responded Members": {
        multi_select: updated.map((name) => ({ name })),
      },
    } as Parameters<typeof notion.pages.update>[0]["properties"],
  });
}
