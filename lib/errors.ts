// Supabase/PostgREST errors are plain objects ({ message, details, hint, code }),
// not Error instances, so `e.message` on an `instanceof Error` check misses them.
// This pulls a useful string out of either shape.
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const parts = [o.message, o.details, o.hint, o.code]
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return "Unknown error";
}
