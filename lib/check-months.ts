import { supabase } from "./supabase";

export type OpenCheckMonth = {
  month: string; // 'YYYY-MM'
  openedBy: string;
  openedAt: string;
};

export async function getOpenCheckMonths(): Promise<OpenCheckMonth[]> {
  const { data, error } = await supabase
    .from("open_check_months")
    .select("*")
    .order("month", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    month: d.month,
    openedBy: d.opened_by,
    openedAt: d.opened_at,
  }));
}

export async function isCheckMonthOpen(month: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("open_check_months")
    .select("month")
    .eq("month", month)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

// Upsert so re-opening an already-open month is a no-op rather than a
// duplicate-key error.
export async function openCheckMonth(month: string, openedBy: string) {
  const { error } = await supabase
    .from("open_check_months")
    .upsert({ month, opened_by: openedBy, opened_at: new Date().toISOString() });
  if (error) throw error;
}

export async function closeCheckMonth(month: string) {
  const { error } = await supabase.from("open_check_months").delete().eq("month", month);
  if (error) throw error;
}
