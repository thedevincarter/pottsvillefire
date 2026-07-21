import { supabase } from "./supabase";
import { stationLabel } from "./stations";

export type StationMaintenanceLog = {
  id: string;
  station: string;
  stationName: string;
  workDone: string;
  memberName: string;
  createdAt: string;
};

export async function getStationLogs(): Promise<StationMaintenanceLog[]> {
  const { data, error } = await supabase
    .from("station_maintenance")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((d) => ({
    id: d.id,
    station: d.station,
    stationName: stationLabel(d.station),
    workDone: d.work_done,
    memberName: d.member_name,
    createdAt: d.created_at,
  }));
}

// Submitter of a log, for ownership checks.
export async function getStationLogOwner(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("station_maintenance")
    .select("member_name")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data.member_name ?? null;
}

export async function createStationLog(
  station: string,
  workDone: string,
  memberName: string
): Promise<string> {
  const { data, error } = await supabase
    .from("station_maintenance")
    .insert({ station, work_done: workDone, member_name: memberName })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateStationLog(id: string, station: string, workDone: string) {
  const { error } = await supabase
    .from("station_maintenance")
    .update({ station, work_done: workDone })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStationLog(id: string) {
  const { error } = await supabase.from("station_maintenance").delete().eq("id", id);
  if (error) throw error;
}
