"use client";

import "@mantine/charts/styles.css";
import { BarChart } from "@mantine/charts";
import { Select, Stack, Title } from "@mantine/core";
import { useState } from "react";
import { RunLogEntry } from "@/lib/notion";

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function aggregateComplaints(runs: RunLogEntry[]) {
  const counts = new Map<string, number>();
  for (const run of runs) {
    if (!run.complaint) continue;
    counts.set(run.complaint, (counts.get(run.complaint) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([complaint, count]) => ({ complaint, count }))
    .sort((a, b) => b.count - a.count);
}

export function DashboardCharts({ runs }: { runs: RunLogEntry[] }) {
  const now = new Date();
  const currentKey = toMonthKey(now);

  const availableMonths = Array.from(
    new Set(
      runs
        .filter((r) => r.date)
        .map((r) => toMonthKey(new Date(r.date!)))
        .filter((k) => k <= currentKey)
    )
  )
    .sort()
    .reverse()
    .map((key) => ({ value: key, label: toMonthLabel(key) }));

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const filteredRuns = selectedMonth
    ? runs.filter((r) => r.date && toMonthKey(new Date(r.date)) === selectedMonth)
    : runs;

  const complaintData = aggregateComplaints(filteredRuns);

  return (
    <>
      <Select
        label="Filter by month"
        placeholder="All months"
        data={availableMonths}
        value={selectedMonth}
        onChange={setSelectedMonth}
        clearable
        w={200}
        mb="lg"
      />

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: "var(--mantine-spacing-xl)" }}>
        <Title order={4} mb="sm">
          Calls by Complaint Type {selectedMonth ? `— ${toMonthLabel(selectedMonth)}` : "— Year to Date"}
        </Title>
        <BarChart
          h={Math.max(complaintData.length * 36, 200)}
          data={complaintData}
          dataKey="complaint"
          orientation="vertical"
          series={[{ name: "count", color: "red.9", label: "Calls" }]}
          barProps={{ radius: 4 }}
          withTooltip
          withXAxis
          withYAxis
          yAxisProps={{ width: 190 }}
          xAxisProps={{ allowDecimals: false }}
        />
      </div>
    </>
  );
}
