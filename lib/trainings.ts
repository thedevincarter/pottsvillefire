import { supabase } from "./supabase";

// Preset sub-group options. Admins can also add their own on the form; any
// custom ones that get saved are merged into the suggestions via form options.
export const SUB_GROUP_OPTIONS = [
  "Multi-Department Training",
  "Driver/Operator",
  "Building Inspections",
  "Officer Training (Leadership)",
  "Pre-Fire Planning",
  "Pump Training",
  "HAZ-MAT",
  "Hose Training",
  "Recruit Training",
];

export type TrainingEntry = {
  id: string;
  date: string | null;
  totalHours: number | null;
  subjects: string[];
  automaticAid: boolean;
  dayNight: string | null;
  subGroups: string[];
  instructors: string | null;
  additionalDepartments: string | null;
  notes: string | null;
  attendees: string[];
};

export type TrainingInput = {
  date?: string;
  totalHours?: number | null;
  subjects?: string[];
  automaticAid?: boolean;
  dayNight?: string | null;
  subGroups?: string[];
  instructors?: string | null;
  additionalDepartments?: string | null;
  notes?: string;
  attendees?: string[];
};

export type TrainingFormOptions = {
  memberNames: string[];
  subjects: string[];
  subGroups: string[];
};

function flatUnique(rows: (string[] | null)[]): string[] {
  return [...new Set(rows.flatMap((r) => r ?? []).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function getTrainingFormOptions(): Promise<TrainingFormOptions> {
  const [memberRows, trainingRows] = await Promise.all([
    supabase.from("profiles").select("full_name").order("full_name"),
    supabase.from("trainings").select("subjects, sub_groups"),
  ]);

  if (memberRows.error) throw memberRows.error;
  if (trainingRows.error) throw trainingRows.error;

  const memberNames = [
    ...new Set(
      (memberRows.data ?? []).map((r) => r.full_name as string).filter(Boolean)
    ),
  ];
  const subjects = flatUnique((trainingRows.data ?? []).map((r) => r.subjects));
  // Merge saved sub-groups with the presets so both show as suggestions.
  const subGroups = [
    ...new Set([
      ...SUB_GROUP_OPTIONS,
      ...flatUnique((trainingRows.data ?? []).map((r) => r.sub_groups)),
    ]),
  ];

  return { memberNames, subjects, subGroups };
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
    totalHours: t.total_hours,
    subjects: t.subjects ?? [],
    automaticAid: t.automatic_aid ?? false,
    dayNight: t.day_night,
    subGroups: t.sub_groups ?? [],
    instructors: t.instructors,
    additionalDepartments: t.additional_departments,
    notes: t.notes,
    attendees: (t.training_attendees ?? [])
      .map((a: { member_name: string }) => a.member_name)
      .sort((a: string, b: string) => a.localeCompare(b)),
  }));
}

// Maps the API input to database columns. Shared by create and update.
function toRow(data: TrainingInput) {
  return {
    date: data.date || null,
    total_hours: data.totalHours ?? null,
    subjects: data.subjects ?? [],
    automatic_aid: data.automaticAid ?? false,
    day_night: data.dayNight || null,
    sub_groups: data.subGroups ?? [],
    instructors: data.instructors || null,
    additional_departments: data.additionalDepartments || null,
    notes: data.notes || null,
  };
}

export async function createTraining(data: TrainingInput) {
  const { data: training, error } = await supabase
    .from("trainings")
    .insert(toRow(data))
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
    .update(toRow(data))
    .eq("id", trainingId);

  if (error) throw error;

  if (data.attendees !== undefined) {
    await syncAttendees(trainingId, data.attendees);
  }
}

// Admin: remove a training. Attendee rows cascade via FK.
export async function deleteTraining(trainingId: string) {
  const { error } = await supabase.from("trainings").delete().eq("id", trainingId);
  if (error) throw error;
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
