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
};

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
  const { error } = await supabase.from("runs").insert({
    date: data.date || null,
    call_type: data.callType || null,
    complaint: data.complaint || null,
    address: data.address || null,
    mutual_aid: data.mutualAid || null,
  });

  if (error) throw error;
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
