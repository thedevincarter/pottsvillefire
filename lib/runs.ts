import { supabase } from "./supabase";

export type RunLogEntry = {
  id: string;
  date: string | null;
  callType: string | null;
  complaint: string | null;
  address: string | null;
  mutualAid: string | null;
  respondedMembers: string[];
};

export type RunLogInput = {
  date?: string;
  callType?: string;
  complaint?: string;
  address?: string;
  mutualAid?: string;
  respondingMembers?: string[];
};

export type RunFormOptions = {
  callTypes: string[];
  complaints: string[];
  mutualAidDepts: string[];
  memberNames: string[];
};

async function getDistinctValues(table: string, column: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .not(column, "is", null)
    .order(column);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [...new Set((data ?? []).map((r: any) => r[column] as string).filter(Boolean))];
}

export async function getRunFormOptions(): Promise<RunFormOptions> {
  const [callTypes, complaints, mutualAidDepts, memberRows] = await Promise.all([
    getDistinctValues("runs", "call_type"),
    getDistinctValues("runs", "complaint"),
    getDistinctValues("runs", "mutual_aid"),
    getDistinctValues("run_responses", "member_name"),
  ]);
  return { callTypes, complaints, mutualAidDepts, memberNames: memberRows };
}

export async function getRunLog(): Promise<RunLogEntry[]> {
  const { data: runs, error } = await supabase
    .from("runs")
    .select("*, run_responses(member_name)")
    .order("date", { ascending: false });

  if (error) throw error;

  return (runs ?? []).map((run) => ({
    id: run.id,
    date: run.date,
    callType: run.call_type,
    complaint: run.complaint,
    address: run.address,
    mutualAid: run.mutual_aid,
    respondedMembers: (run.run_responses ?? []).map(
      (r: { member_name: string }) => r.member_name
    ),
  }));
}

export async function createRun(data: RunLogInput) {
  const { data: run, error } = await supabase
    .from("runs")
    .insert({
      date: data.date || null,
      call_type: data.callType || null,
      complaint: data.complaint || null,
      address: data.address || null,
      mutual_aid: data.mutualAid || null,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (data.respondingMembers?.length) {
    await syncRespondingMembers(run.id, data.respondingMembers);
  }
}

export async function updateRun(runId: string, data: RunLogInput) {
  const { error } = await supabase
    .from("runs")
    .update({
      date: data.date || null,
      call_type: data.callType || null,
      complaint: data.complaint || null,
      address: data.address || null,
      mutual_aid: data.mutualAid || null,
    })
    .eq("id", runId);

  if (error) throw error;

  if (data.respondingMembers !== undefined) {
    await syncRespondingMembers(runId, data.respondingMembers);
  }
}

async function syncRespondingMembers(runId: string, memberNames: string[]) {
  // Remove all existing responses for this run
  await supabase.from("run_responses").delete().eq("run_id", runId);

  if (memberNames.length === 0) return;

  // Look up existing emails for known members
  const { data: known } = await supabase
    .from("run_responses")
    .select("member_name, member_email")
    .in("member_name", memberNames);

  const emailMap = new Map<string, string>();
  for (const row of known ?? []) {
    emailMap.set(row.member_name, row.member_email);
  }

  const rows = memberNames.map((name) => ({
    run_id: runId,
    member_name: name,
    member_email:
      emailMap.get(name) ??
      name.toLowerCase().replace(/\s+/g, ".") + "@member",
  }));

  const { error } = await supabase.from("run_responses").insert(rows);
  if (error) throw error;
}

export type MemberStats = {
  name: string;
  rank: string | null;
  number: string | null;
  totalCalls: number;
};

export type MemberCallCounts = {
  name: string;
  rank: string | null;
  number: string | null;
  total: number;
  fire: number;
  medical: number;
  mvc: number;
};

export async function getAllMemberCallCounts(): Promise<MemberCallCounts[]> {
  // Get call counts from run_responses
  const { data, error } = await supabase
    .from("run_responses")
    .select("member_name, runs(call_type)")
    .not("member_name", "is", null);

  if (error) throw error;

  const map = new Map<string, MemberCallCounts>();
  for (const row of data ?? []) {
    const name = row.member_name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callType = (row as any).runs?.call_type ?? null;
    let entry = map.get(name);
    if (!entry) {
      entry = { name, rank: null, number: null, total: 0, fire: 0, medical: 0, mvc: 0 };
      map.set(name, entry);
    }
    entry.total++;
    if (callType === "Fire") entry.fire++;
    else if (callType === "Medical") entry.medical++;
    else if (callType === "MVC") entry.mvc++;
  }

  // Enrich with rank/number from profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("full_name, rank, number");

  for (const p of profiles ?? []) {
    const entry = map.get(p.full_name);
    if (entry) {
      entry.rank = p.rank;
      entry.number = p.number;
    }
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

export async function getMemberStats(name: string): Promise<MemberStats | null> {
  const { count, error } = await supabase
    .from("run_responses")
    .select("id", { count: "exact", head: true })
    .eq("member_name", name);

  if (error) throw error;
  if (count === null || count === 0) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("rank, number")
    .eq("full_name", name)
    .single();

  return {
    name,
    rank: profile?.rank ?? null,
    number: profile?.number ?? null,
    totalCalls: count,
  };
}

export type ChartData = {
  callsByMonth: { month: string; count: number }[];
  callsByComplaint: { complaint: string; count: number }[];
  callsByType: { type: string; count: number; color: string }[];
  callTypeByMonth: { month: string; Fire: number; Medical: number; MVC: number }[];
};

const typeColors: Record<string, string> = {
  Fire: "red.6",
  Medical: "blue.6",
  MVC: "yellow.6",
};

export async function getChartData(): Promise<ChartData> {
  const { data: runs, error } = await supabase
    .from("runs")
    .select("date, call_type, complaint")
    .not("date", "is", null)
    .order("date");

  if (error) throw error;

  const monthMap = new Map<string, number>();
  const complaintMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  const typeByMonthMap = new Map<string, { Fire: number; Medical: number; MVC: number }>();

  for (const run of runs ?? []) {
    const d = new Date(run.date);
    const monthKey = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);

    if (run.complaint) {
      complaintMap.set(run.complaint, (complaintMap.get(run.complaint) || 0) + 1);
    }

    if (run.call_type) {
      typeMap.set(run.call_type, (typeMap.get(run.call_type) || 0) + 1);
    }

    if (!typeByMonthMap.has(monthKey)) {
      typeByMonthMap.set(monthKey, { Fire: 0, Medical: 0, MVC: 0 });
    }
    const entry = typeByMonthMap.get(monthKey)!;
    if (run.call_type === "Fire") entry.Fire++;
    else if (run.call_type === "Medical") entry.Medical++;
    else if (run.call_type === "MVC") entry.MVC++;
  }

  return {
    callsByMonth: [...monthMap.entries()].map(([month, count]) => ({ month, count })),
    callsByComplaint: [...complaintMap.entries()]
      .map(([complaint, count]) => ({ complaint, count }))
      .sort((a, b) => b.count - a.count),
    callsByType: [...typeMap.entries()].map(([type, count]) => ({
      type,
      count,
      color: typeColors[type] || "gray.6",
    })),
    callTypeByMonth: [...typeByMonthMap.entries()].map(([month, counts]) => ({
      month,
      ...counts,
    })),
  };
}

export type MemberResponseStats = {
  name: string;
  rank: string | null;
  number: string | null;
  totalCalls: number;
  responded: number;
  fire: { total: number; responded: number };
  medical: { total: number; responded: number };
  mvc: { total: number; responded: number };
};

export async function getMemberResponseStats(name: string): Promise<MemberResponseStats | null> {
  // Get all runs with their responses
  const { data: runs, error } = await supabase
    .from("runs")
    .select("id, call_type, run_responses(member_name)")
    .not("date", "is", null);

  if (error) throw error;

  const { data: profile } = await supabase
    .from("profiles")
    .select("rank, number")
    .eq("full_name", name)
    .single();

  let totalCalls = 0;
  let responded = 0;
  const fire = { total: 0, responded: 0 };
  const medical = { total: 0, responded: 0 };
  const mvc = { total: 0, responded: 0 };

  for (const run of runs ?? []) {
    totalCalls++;
    const didRespond = (run.run_responses ?? []).some(
      (r: { member_name: string }) => r.member_name === name
    );
    if (didRespond) responded++;

    if (run.call_type === "Fire") {
      fire.total++;
      if (didRespond) fire.responded++;
    } else if (run.call_type === "Medical") {
      medical.total++;
      if (didRespond) medical.responded++;
    } else if (run.call_type === "MVC") {
      mvc.total++;
      if (didRespond) mvc.responded++;
    }
  }

  if (responded === 0) return null;

  return {
    name,
    rank: profile?.rank ?? null,
    number: profile?.number ?? null,
    totalCalls,
    responded,
    fire,
    medical,
    mvc,
  };
}

export async function toggleRespondedMember(
  runId: string,
  memberName: string,
  memberEmail: string
) {
  // Check if already responded
  const { data: existing } = await supabase
    .from("run_responses")
    .select("id")
    .eq("run_id", runId)
    .eq("member_email", memberEmail)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("run_responses")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("run_responses").insert({
      run_id: runId,
      member_name: memberName,
      member_email: memberEmail,
    });
    if (error) throw error;
  }
}
