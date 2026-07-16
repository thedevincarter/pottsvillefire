import { supabase } from "./supabase";

export type Apparatus = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type CheckItem = {
  id: string;
  apparatusId: string;
  label: string;
  sortOrder: number;
  active: boolean;
};

export type ApparatusCheck = {
  id: string;
  apparatusId: string;
  apparatusName: string;
  month: string;
  memberName: string;
  generalNotes: string | null;
  startedAt: string;
  completedAt: string | null;
  results: CheckResult[];
};

export type CheckResult = {
  id: string;
  checkItemId: string;
  label: string;
  checked: boolean;
  status: "pass" | "fail" | null;
  notes: string | null;
};

export type ApparatusCheckSummary = {
  apparatusId: string;
  apparatusName: string;
  checkId: string | null;
  memberName: string | null;
  completedAt: string | null;
  startedAt: string | null;
};

export async function getApparatus(): Promise<Apparatus[]> {
  const { data, error } = await supabase
    .from("apparatus")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    sortOrder: a.sort_order,
    active: a.active,
  }));
}

export async function getCheckItemsForApparatus(apparatusId: string): Promise<CheckItem[]> {
  const { data, error } = await supabase
    .from("check_items")
    .select("*")
    .eq("apparatus_id", apparatusId)
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    apparatusId: c.apparatus_id,
    label: c.label,
    sortOrder: c.sort_order,
    active: c.active,
  }));
}

export async function getAllCheckItems(): Promise<CheckItem[]> {
  const { data, error } = await supabase
    .from("check_items")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    apparatusId: c.apparatus_id,
    label: c.label,
    sortOrder: c.sort_order,
    active: c.active,
  }));
}

export async function getAllApparatus(): Promise<Apparatus[]> {
  const { data, error } = await supabase
    .from("apparatus")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    sortOrder: a.sort_order,
    active: a.active,
  }));
}

export async function getMonthChecks(month: string): Promise<ApparatusCheckSummary[]> {
  const apparatusList = await getApparatus();

  const { data: checks, error } = await supabase
    .from("apparatus_checks")
    .select("id, apparatus_id, member_name, started_at, completed_at")
    .eq("month", month);

  if (error) throw error;

  const checkMap = new Map<string, typeof checks[number]>();
  for (const c of checks ?? []) {
    checkMap.set(c.apparatus_id, c);
  }

  return apparatusList.map((a) => {
    const check = checkMap.get(a.id);
    return {
      apparatusId: a.id,
      apparatusName: a.name,
      checkId: check?.id ?? null,
      memberName: check?.member_name ?? null,
      startedAt: check?.started_at ?? null,
      completedAt: check?.completed_at ?? null,
    };
  });
}

export async function startCheck(
  apparatusId: string,
  month: string,
  memberName: string
): Promise<string> {
  // Get check items for this specific apparatus
  const checkItems = await getCheckItemsForApparatus(apparatusId);

  // Insert the check record
  const { data: check, error } = await supabase
    .from("apparatus_checks")
    .insert({ apparatus_id: apparatusId, month, member_name: memberName })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A check has already been started for this apparatus this month.");
    }
    throw error;
  }

  // Create result rows for each check item
  const rows = checkItems.map((item) => ({
    check_id: check.id,
    check_item_id: item.id,
    checked: false,
    notes: null,
  }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("apparatus_check_results")
      .insert(rows);
    if (insertError) throw insertError;
  }

  return check.id;
}

export async function getCheck(checkId: string): Promise<ApparatusCheck | null> {
  const { data, error } = await supabase
    .from("apparatus_checks")
    .select("*, apparatus(name), apparatus_check_results(*, check_items(label, sort_order))")
    .eq("id", checkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const results: CheckResult[] = (d.apparatus_check_results ?? [])
    .sort((a: { check_items: { sort_order: number } }, b: { check_items: { sort_order: number } }) =>
      a.check_items.sort_order - b.check_items.sort_order
    )
    .map((r: { id: string; check_item_id: string; check_items: { label: string }; checked: boolean; status: string | null; notes: string | null }) => ({
      id: r.id,
      checkItemId: r.check_item_id,
      label: r.check_items.label,
      checked: r.checked,
      status: (r.status as "pass" | "fail" | null) ?? (r.checked ? "pass" : null),
      notes: r.notes,
    }));

  return {
    id: d.id,
    apparatusId: d.apparatus_id,
    apparatusName: d.apparatus?.name ?? "",
    month: d.month,
    memberName: d.member_name,
    generalNotes: d.general_notes,
    startedAt: d.started_at,
    completedAt: d.completed_at,
    results,
  };
}

export async function updateCheckResult(
  resultId: string,
  checked: boolean,
  notes: string | null,
  status?: "pass" | "fail" | null
) {
  const updates: Record<string, unknown> = { checked, notes };
  if (status !== undefined) updates.status = status;
  const { error } = await supabase
    .from("apparatus_check_results")
    .update(updates)
    .eq("id", resultId);

  if (error) throw error;
}

export async function completeCheck(checkId: string, generalNotes: string | null) {
  const { error } = await supabase
    .from("apparatus_checks")
    .update({
      general_notes: generalNotes,
      completed_at: new Date().toISOString(),
    })
    .eq("id", checkId);

  if (error) throw error;
}

export async function cancelCheck(checkId: string) {
  // Results cascade-delete via FK constraint
  const { error } = await supabase
    .from("apparatus_checks")
    .delete()
    .eq("id", checkId)
    .is("completed_at", null);

  if (error) throw error;
}

export async function getCheckHistory(filters?: {
  month?: string;
  apparatusId?: string;
  search?: string;
}): Promise<ApparatusCheck[]> {
  let query = supabase
    .from("apparatus_checks")
    .select("*, apparatus(name), apparatus_check_results(*, check_items(label, sort_order))")
    .order("started_at", { ascending: false });

  if (filters?.month) {
    query = query.eq("month", filters.month);
  }
  if (filters?.apparatusId) {
    query = query.eq("apparatus_id", filters.apparatusId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results = (data ?? []).map((d: any) => ({
    id: d.id,
    apparatusId: d.apparatus_id,
    apparatusName: d.apparatus?.name ?? "",
    month: d.month,
    memberName: d.member_name,
    generalNotes: d.general_notes,
    startedAt: d.started_at,
    completedAt: d.completed_at,
    results: (d.apparatus_check_results ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.check_items.sort_order - b.check_items.sort_order)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        id: r.id,
        checkItemId: r.check_item_id,
        label: r.check_items.label,
        checked: r.checked,
        status: (r.status as "pass" | "fail" | null) ?? (r.checked ? "pass" : null),
        notes: r.notes,
      })),
  }));

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.apparatusName.toLowerCase().includes(term) ||
        c.memberName.toLowerCase().includes(term) ||
        (c.generalNotes?.toLowerCase().includes(term) ?? false)
    );
  }

  return results;
}

// Admin functions for managing apparatus and check items

export async function createApparatus(name: string, sortOrder: number) {
  const { error } = await supabase
    .from("apparatus")
    .insert({ name, sort_order: sortOrder });
  if (error) throw error;
}

export async function updateApparatus(id: string, name: string, sortOrder: number, active: boolean) {
  const { error } = await supabase
    .from("apparatus")
    .update({ name, sort_order: sortOrder, active })
    .eq("id", id);
  if (error) throw error;
}

export async function createCheckItem(apparatusId: string, label: string, sortOrder: number) {
  const { error } = await supabase
    .from("check_items")
    .insert({ apparatus_id: apparatusId, label, sort_order: sortOrder });
  if (error) throw error;
}

export async function updateCheckItem(id: string, label: string, sortOrder: number, active: boolean) {
  const { error } = await supabase
    .from("check_items")
    .update({ label, sort_order: sortOrder, active })
    .eq("id", id);
  if (error) throw error;
}
