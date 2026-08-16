import { supabase } from "./supabase";
import { getTrainingCountsByMember, getMemberTrainingStats } from "./trainings";

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
  const [callTypes, complaints, mutualAidDepts, respondedNames, rosterNames] =
    await Promise.all([
      getDistinctValues("runs", "call_type"),
      getDistinctValues("runs", "complaint"),
      getDistinctValues("runs", "mutual_aid"),
      getDistinctValues("run_responses", "member_name"),
      getRosterNames(),
    ]);

  // The roster is the source of truth for who can be marked as responding —
  // without it a member who has never responded (including anyone added
  // without an email) would never appear in the picker. Names only seen on
  // historical responses are kept so old records stay editable.
  const memberNames = [...new Set([...rosterNames, ...respondedNames])].sort((a, b) =>
    a.localeCompare(b)
  );

  return { callTypes, complaints, mutualAidDepts, memberNames };
}

/** Roster names in alphabetical order, used for the run log export columns. */
export async function getRosterNames(): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name")
    .order("full_name");

  if (error) throw error;
  return (data ?? []).map((p) => p.full_name).filter(Boolean);
}

/** A run's date, for month-lock checks. Null if the run or its date is missing. */
export async function getRunDate(runId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("runs")
    .select("date")
    .eq("id", runId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data.date ?? null;
}

/** Whether a name belongs to someone on the roster — for validating assignments. */
export async function isRosterName(name: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("full_name", name)
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
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

// Admin: remove a run outright. Its run_responses cascade-delete via FK.
export async function deleteRun(runId: string) {
  const { error } = await supabase.from("runs").delete().eq("id", runId);
  if (error) throw error;
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
  trainings: number;
};

export async function getAllMemberCallCounts(): Promise<MemberCallCounts[]> {
  // Get call counts from run_responses
  const { data, error } = await supabase
    .from("run_responses")
    .select("member_name, runs(call_type)")
    .not("member_name", "is", null);

  if (error) throw error;

  const map = new Map<string, MemberCallCounts>();
  const ensureEntry = (name: string) => {
    let entry = map.get(name);
    if (!entry) {
      entry = { name, rank: null, number: null, total: 0, fire: 0, medical: 0, mvc: 0, trainings: 0 };
      map.set(name, entry);
    }
    return entry;
  };

  for (const row of data ?? []) {
    const name = row.member_name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callType = (row as any).runs?.call_type ?? null;
    const entry = ensureEntry(name);
    entry.total++;
    if (callType === "Fire") entry.fire++;
    else if (callType === "Medical") entry.medical++;
    else if (callType === "MVC") entry.mvc++;
  }

  // Merge in trainings attended — including members who have only attended
  // trainings and never responded to a call.
  const trainingCounts = await getTrainingCountsByMember();
  for (const [name, count] of trainingCounts) {
    ensureEntry(name).trainings = count;
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
  trainingsAttended: number;
  totalTrainings: number;
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

  const training = await getMemberTrainingStats(name);

  // Show a profile for anyone with call responses or training attendance.
  if (responded === 0 && training.attended === 0) return null;

  return {
    name,
    rank: profile?.rank ?? null,
    number: profile?.number ?? null,
    totalCalls,
    responded,
    fire,
    medical,
    mvc,
    trainingsAttended: training.attended,
    totalTrainings: training.total,
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
