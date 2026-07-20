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
  parentId: string | null;
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
  /** Set when this result belongs under a section header. */
  parentId: string | null;
  parentLabel: string | null;
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
    parentId: c.parent_id ?? null,
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
    parentId: c.parent_id ?? null,
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

type ItemLookup = Map<string, CheckItem>;

async function getCheckItemLookup(): Promise<ItemLookup> {
  const items = await getAllCheckItems();
  return new Map(items.map((i) => [i.id, i]));
}

// Leaf results are ordered by their section header's position first, so
// subitems sit directly beneath the header they belong to.
function sortKey(itemId: string, lookup: ItemLookup): [number, number, number] {
  const item = lookup.get(itemId);
  if (!item) return [Number.MAX_SAFE_INTEGER, 0, 0];
  const parent = item.parentId ? lookup.get(item.parentId) : undefined;
  return parent ? [parent.sortOrder, 1, item.sortOrder] : [item.sortOrder, 0, 0];
}

function mapResults(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any[],
  lookup: ItemLookup
): CheckResult[] {
  return raw
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => {
      const item = lookup.get(r.check_item_id);
      const parent = item?.parentId ? lookup.get(item.parentId) : undefined;
      return {
        id: r.id,
        checkItemId: r.check_item_id,
        label: r.check_items?.label ?? item?.label ?? "",
        checked: r.checked,
        status: (r.status as "pass" | "fail" | null) ?? (r.checked ? "pass" : null),
        notes: r.notes,
        parentId: parent?.id ?? null,
        parentLabel: parent?.label ?? null,
      };
    })
    .sort((a, b) => {
      const ka = sortKey(a.checkItemId, lookup);
      const kb = sortKey(b.checkItemId, lookup);
      return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
    });
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

  // Items that have active children act as section headers — they aren't
  // answered themselves, so only leaves get result rows.
  const parentIds = new Set(
    checkItems.map((i) => i.parentId).filter((id): id is string => !!id)
  );
  const leafItems = checkItems.filter((item) => !parentIds.has(item.id));

  // Create result rows for each check item
  const rows = leafItems.map((item) => ({
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
  const lookup = await getCheckItemLookup();
  const results = mapResults(d.apparatus_check_results ?? [], lookup);

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

// Who started a check, for ownership checks. Returns null if it doesn't exist.
export async function getCheckMemberName(checkId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("apparatus_checks")
    .select("member_name")
    .eq("id", checkId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data.member_name ?? null;
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

// Admin: reopen a completed check, wiping every answer, per-item note and the
// general notes so it can be redone. The check row, member and started_at stay.
export async function resetCheck(checkId: string) {
  const { error: resultsError } = await supabase
    .from("apparatus_check_results")
    .update({ checked: false, status: null, notes: null })
    .eq("check_id", checkId);

  if (resultsError) throw resultsError;

  const { error } = await supabase
    .from("apparatus_checks")
    .update({ general_notes: null, completed_at: null })
    .eq("id", checkId);

  if (error) throw error;
}

// Admin: remove a check outright, completed or not, freeing that
// apparatus/month slot so it can be started fresh. Results cascade-delete.
export async function deleteCheck(checkId: string) {
  const { error } = await supabase
    .from("apparatus_checks")
    .delete()
    .eq("id", checkId);

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

  const lookup = await getCheckItemLookup();

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
    results: mapResults(d.apparatus_check_results ?? [], lookup),
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

export async function createCheckItem(
  apparatusId: string,
  label: string,
  sortOrder: number,
  parentId?: string | null
) {
  const { error } = await supabase
    .from("check_items")
    .insert({ apparatus_id: apparatusId, label, sort_order: sortOrder, parent_id: parentId ?? null });
  if (error) throw error;
}

export async function updateCheckItem(id: string, label: string, sortOrder: number, active: boolean) {
  const { error } = await supabase
    .from("check_items")
    .update({ label, sort_order: sortOrder, active })
    .eq("id", id);
  if (error) throw error;
}

// Admin: permanently remove a checklist item. Subitems cascade via parent_id.
// Blocked once an item (or one of its subitems) has been used in any check —
// those result rows FK-reference it and also source their label from it, so a
// hard delete would fail and/or corrupt history. Deactivating is the tool for
// items already in use.
export async function deleteCheckItem(id: string) {
  // Collect the item plus any subitems, since a used subitem blocks too.
  const { data: children, error: childErr } = await supabase
    .from("check_items")
    .select("id")
    .eq("parent_id", id);
  if (childErr) throw childErr;

  const ids = [id, ...(children ?? []).map((c) => c.id)];

  const { count, error: countErr } = await supabase
    .from("apparatus_check_results")
    .select("id", { count: "exact", head: true })
    .in("check_item_id", ids);
  if (countErr) throw countErr;

  if ((count ?? 0) > 0) {
    throw new Error(
      "This item has been used in one or more checks. Deactivate it instead to remove it from future checks while keeping past records."
    );
  }

  const { error } = await supabase.from("check_items").delete().eq("id", id);
  if (error) throw error;
}
