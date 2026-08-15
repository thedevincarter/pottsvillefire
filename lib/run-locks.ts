import { supabase } from "./supabase";

export type LockedMonth = {
  month: string; // 'YYYY-MM'
  lockedBy: string;
  lockedAt: string;
};

export async function getLockedMonths(): Promise<LockedMonth[]> {
  const { data, error } = await supabase
    .from("locked_months")
    .select("*")
    .order("month", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    month: d.month,
    lockedBy: d.locked_by,
    lockedAt: d.locked_at,
  }));
}

export async function isMonthLocked(month: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("locked_months")
    .select("month")
    .eq("month", month)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

// Upsert so re-locking an already-locked month is a no-op rather than a
// duplicate-key error.
export async function lockMonth(month: string, lockedBy: string) {
  const { error } = await supabase
    .from("locked_months")
    .upsert({ month, locked_by: lockedBy, locked_at: new Date().toISOString() });
  if (error) throw error;
}

export async function unlockMonth(month: string) {
  const { error } = await supabase.from("locked_months").delete().eq("month", month);
  if (error) throw error;
}
