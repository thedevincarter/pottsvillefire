import type { RunLogEntry } from "./runs";

const TZ = "America/Chicago";

// Responses are marked; a blank cell means the member didn't go on that call.
export const RESPONDED_MARK = "✓";

export const DETAIL_HEADERS = [
  "Date",
  "Time",
  "Call Type",
  "Complaint",
  "Address",
  "Mutual Aid",
];

export function formatRunDate(date: string | null): string {
  if (!date) return "";
  // Date-only values have no timezone, so parsing them as UTC and rendering in
  // Central would shift them back a day. Build those from the parts instead.
  if (!date.includes("T")) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatRunTime(date: string | null): string {
  if (!date || !date.includes("T")) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

export function monthLabel(monthKey: string): string {
  if (monthKey === "all") return "All Months";
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return "All Months";
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Oldest first — a monthly report reads chronologically. */
export function sortRunsForExport(runs: RunLogEntry[]): RunLogEntry[] {
  return [...runs].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

export function respondedCount(runs: RunLogEntry[], member: string): number {
  return runs.filter((run) => run.respondedMembers.includes(member)).length;
}

export type ExportRows = {
  header: string[];
  body: string[][];
  totals: string[];
};

export function buildExportRows(
  runs: RunLogEntry[],
  members: string[],
): ExportRows {
  const header = [...DETAIL_HEADERS, ...members];

  const body = runs.map((run) => {
    const responded = new Set(run.respondedMembers);
    return [
      formatRunDate(run.date),
      formatRunTime(run.date),
      run.callType ?? "",
      run.complaint ?? "",
      run.address ?? "",
      run.mutualAid ?? "",
      ...members.map((m) => (responded.has(m) ? RESPONDED_MARK : "")),
    ];
  });

  const totals = [
    `Totals (${runs.length} call${runs.length !== 1 ? "s" : ""})`,
    "",
    "",
    "",
    "",
    "",
    ...members.map((m) => String(respondedCount(runs, m))),
  ];

  return { header, body, totals };
}

function escapeField(value: string): string {
  // Leading =, + or @ makes spreadsheets treat a cell as a formula, so neutralize
  // those on the free-text fields members type in.
  const safe = /^[=+@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: string[][]): string {
  // BOM so Excel reads it as UTF-8 and renders the check/x marks.
  return "﻿" + rows.map((row) => row.map(escapeField).join(",")).join("\r\n");
}

export function exportFileName(monthKey: string): string {
  const suffix = monthKey === "all" ? "all-months" : monthKey;
  return `pottsville-run-log-${suffix}.csv`;
}
