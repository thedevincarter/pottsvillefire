import { supabase } from "./supabase";

export type TrainingEntry = {
  id: string;
  date: string | null;
  type: string | null;
  notes: string | null;
  attendees: string[];
};

export type TrainingInput = {
  date?: string;
  type?: string;
  notes?: string;
  attendees?: string[];
};

export type TrainingFormOptions = {
  types: string[];
  memberNames: string[];
};

export async function getTrainingFormOptions(): Promise<TrainingFormOptions> {
  const [typeRows, memberRows] = await Promise.all([
    supabase.from("trainings").select("type").not("type", "is", null).order("type"),
    supabase.from("profiles").select("full_name").order("full_name"),
  ]);

  if (typeRows.error) throw typeRows.error;
  if (memberRows.error) throw memberRows.error;

  const types = [
    ...new Set((typeRows.data ?? []).map((r) => r.type as string).filter(Boolean)),
  ];
  const memberNames = [
    ...new Set(
      (memberRows.data ?? []).map((r) => r.full_name as string).filter(Boolean)
    ),
  ];

  return { types, memberNames };
}

// Trainings-attended count per member, for the roster.
export async function getTrainingCountsByMember(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("training_attendees")
    .select("member_name");

  if (error) throw error;

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.member_name, (map.get(row.member_name) ?? 0) + 1);
  }
  return map;
}

// A single member's attendance: how many trainings they attended out of all.
export async function getMemberTrainingStats(
  name: string
): Promise<{ attended: number; total: number }> {
  const [totalRes, attendedRes] = await Promise.all([
    supabase.from("trainings").select("id", { count: "exact", head: true }),
    supabase
      .from("training_attendees")
      .select("id", { count: "exact", head: true })
      .eq("member_name", name),
  ]);

  if (totalRes.error) throw totalRes.error;
  if (attendedRes.error) throw attendedRes.error;

  return { attended: attendedRes.count ?? 0, total: totalRes.count ?? 0 };
}

export async function getTrainings(): Promise<TrainingEntry[]> {
  const { data, error } = await supabase
    .from("trainings")
    .select("*, training_attendees(member_name)")
    .order("date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    notes: t.notes,
    attendees: (t.training_attendees ?? [])
      .map((a: { member_name: string }) => a.member_name)
      .sort((a: string, b: string) => a.localeCompare(b)),
  }));
}

export async function createTraining(data: TrainingInput) {
  const { data: training, error } = await supabase
    .from("trainings")
    .insert({ date: data.date || null, type: data.type || null, notes: data.notes || null })
    .select("id")
    .single();

  if (error) throw error;

  if (data.attendees?.length) {
    await syncAttendees(training.id, data.attendees);
  }
}

export async function updateTraining(trainingId: string, data: TrainingInput) {
  const { error } = await supabase
    .from("trainings")
    .update({ date: data.date || null, type: data.type || null, notes: data.notes || null })
    .eq("id", trainingId);

  if (error) throw error;

  if (data.attendees !== undefined) {
    await syncAttendees(trainingId, data.attendees);
  }
}

// Toggle a single member in/out of a training's attendee list. Used by the
// self-serve "Mark as attended" control (any member, for themselves).
export async function toggleTrainingAttendance(
  trainingId: string,
  memberName: string
) {
  const { data: existing } = await supabase
    .from("training_attendees")
    .select("id")
    .eq("training_id", trainingId)
    .eq("member_name", memberName)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("training_attendees")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("training_attendees")
      .insert({ training_id: trainingId, member_name: memberName });
    if (error) throw error;
  }
}

async function syncAttendees(trainingId: string, memberNames: string[]) {
  // Replace the whole attendee set each save — simplest and the lists are small.
  await supabase.from("training_attendees").delete().eq("training_id", trainingId);

  const unique = [...new Set(memberNames.filter(Boolean))];
  if (unique.length === 0) return;

  const rows = unique.map((name) => ({ training_id: trainingId, member_name: name }));
  const { error } = await supabase.from("training_attendees").insert(rows);
  if (error) throw error;
}
