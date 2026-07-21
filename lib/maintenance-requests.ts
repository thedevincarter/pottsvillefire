import { supabase } from "./supabase";
import { stationLabel } from "./stations";

export type RequestStatus = "unresolved" | "resolved" | "wont_do";

export const REQUEST_STATUSES: { value: RequestStatus; label: string; color: string }[] = [
  { value: "unresolved", label: "Unresolved", color: "orange" },
  { value: "resolved", label: "Resolved", color: "green" },
  { value: "wont_do", label: "Won't Do", color: "gray" },
];

export function isRequestStatus(value: unknown): value is RequestStatus {
  return value === "unresolved" || value === "resolved" || value === "wont_do";
}

export type MaintenanceRequest = {
  id: string;
  apparatusId: string | null;
  apparatusName: string | null;
  station: string | null;
  stationName: string | null;
  description: string;
  status: RequestStatus;
  memberName: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(d: any): MaintenanceRequest {
  return {
    id: d.id,
    apparatusId: d.apparatus_id,
    apparatusName: d.apparatus?.name ?? null,
    station: d.station,
    stationName: d.station ? stationLabel(d.station) : null,
    description: d.description,
    status: d.status,
    memberName: d.member_name,
    createdAt: d.created_at,
    resolvedAt: d.resolved_at,
    resolvedBy: d.resolved_by,
  };
}

export async function getApparatusRequests(): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*, apparatus(name)")
    .not("apparatus_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getStationRequests(): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .not("station", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

// Submitter of a request, for ownership (delete) checks.
export async function getRequestOwner(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("member_name")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data.member_name ?? null;
}

export async function createApparatusRequest(
  apparatusId: string,
  description: string,
  memberName: string
): Promise<string> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert({ apparatus_id: apparatusId, description, member_name: memberName })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function createStationRequest(
  station: string,
  description: string,
  memberName: string
): Promise<string> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert({ station, description, member_name: memberName })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// Admin: set a request's status. resolved_at/by are stamped for resolved and
// won't-do, and cleared when it goes back to unresolved.
export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  resolvedBy: string
) {
  const resolved = status !== "unresolved";
  const { error } = await supabase
    .from("maintenance_requests")
    .update({
      status,
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? resolvedBy : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRequest(id: string) {
  const { error } = await supabase.from("maintenance_requests").delete().eq("id", id);
  if (error) throw error;
}
