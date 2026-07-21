// Client-safe request status constants/types. Kept separate from
// maintenance-requests.ts so client components can import these values without
// pulling in the server-only Supabase client.
export type RequestStatus = "unresolved" | "resolved" | "wont_do";

export const REQUEST_STATUSES: { value: RequestStatus; label: string; color: string }[] = [
  { value: "unresolved", label: "Unresolved", color: "orange" },
  { value: "resolved", label: "Resolved", color: "green" },
  { value: "wont_do", label: "Won't Do", color: "gray" },
];

export function isRequestStatus(value: unknown): value is RequestStatus {
  return value === "unresolved" || value === "resolved" || value === "wont_do";
}
