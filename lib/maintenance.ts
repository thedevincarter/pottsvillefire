import { supabase } from "./supabase";

export type MaintenanceLog = {
  id: string;
  apparatusId: string;
  apparatusName: string;
  mileage: number | null;
  workDone: string;
  memberName: string;
  createdAt: string;
};

export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const { data, error } = await supabase
    .from("apparatus_maintenance")
    .select("*, apparatus(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => ({
    id: d.id,
    apparatusId: d.apparatus_id,
    apparatusName: d.apparatus?.name ?? "",
    mileage: d.mileage,
    workDone: d.work_done,
    memberName: d.member_name,
    createdAt: d.created_at,
  }));
}

// The submitter of a log, for ownership checks. Null if it doesn't exist.
export async function getMaintenanceLogOwner(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("apparatus_maintenance")
    .select("member_name")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data.member_name ?? null;
}

export async function createMaintenanceLog(
  apparatusId: string,
  mileage: number | null,
  workDone: string,
  memberName: string
): Promise<string> {
  const { data, error } = await supabase
    .from("apparatus_maintenance")
    .insert({
      apparatus_id: apparatusId,
      mileage,
      work_done: workDone,
      member_name: memberName,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateMaintenanceLog(
  id: string,
  apparatusId: string,
  mileage: number | null,
  workDone: string
) {
  const { error } = await supabase
    .from("apparatus_maintenance")
    .update({ apparatus_id: apparatusId, mileage, work_done: workDone })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteMaintenanceLog(id: string) {
  const { error } = await supabase
    .from("apparatus_maintenance")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
