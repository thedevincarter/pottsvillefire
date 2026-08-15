// Runs are bucketed into months by the department's local time, not the
// viewer's browser or the (UTC) server. A call at 00:30 UTC on Aug 1 happened
// on July 31 in Pottsville and belongs to July — which matters when July is
// locked and August isn't.
export const DEPARTMENT_TIME_ZONE = "America/Chicago";

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** The 'YYYY-MM' month a run date falls in, in department-local time. */
export function monthKey(date: string): string {
  // A date-only value carries no time to convert; reading it as UTC midnight
  // would shift it back a day and, on the 1st, into the previous month.
  if (DATE_ONLY.test(date)) return date.slice(0, 7);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DEPARTMENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(date));
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

/** "2025-07" → "July 2025". */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_KEY.test(value);
}
