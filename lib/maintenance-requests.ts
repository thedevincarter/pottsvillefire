import { supabase } from "./supabase";
import { stationLabel } from "./stations";
import type { RequestStatus } from "./maintenance-request-status";

// Re-exported for server-side consumers that already import from this module.
export { REQUEST_STATUSES, isRequestStatus } from "./maintenance-request-status";
export type { RequestStatus } from "./maintenance-request-status";

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

// Submitter or admin: edit a request's target and description. Only the target
// column matching the request's domain is passed, so the apparatus-XOR-station
// invariant is preserved.
export async function updateRequest(
  id: string,
  fields: { apparatusId?: string; station?: string; description: string }
) {
  const update: Record<string, unknown> = { description: fields.description };
  if (fields.apparatusId !== undefined) update.apparatus_id = fields.apparatusId;
  if (fields.station !== undefined) update.station = fields.station;

  const { error } = await supabase
    .from("maintenance_requests")
    .update(update)
    .eq("id", id);
  if (error) throw error;
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
