"use client";

import "@mantine/charts/styles.css";
import { DonutChart } from "@mantine/charts";
import { ColorSwatch, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { RunLogEntry } from "@/lib/notion";

const COLORS = [
  "red.9", "red.6", "red.3",
  "orange.7", "orange.4",
  "yellow.6", "yellow.4",
  "gray.5",
];

function aggregate(entries: RunLogEntry[], key: "complaint" | "callType") {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const val = entry[key];
    if (!val) continue;
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
}

const MUTUAL_AID_COLORS = [
  "blue.7", "blue.4", "cyan.6", "teal.6", "indigo.6", "violet.6", "grape.6",
];

function aggregateFireMutualAid(entries: RunLogEntry[]) {
  const fireEntries = entries.filter((e) => e.callType === "Fire");
  const counts = new Map<string, number>();
  for (const e of fireEntries) {
    const key = e.mutualAid ?? "In District";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  let colorIdx = 0;
  return {
    total: fireEntries.length,
    data: sorted.map(([name, value]) => {
      const color = name === "In District" ? "red.9" : MUTUAL_AID_COLORS[colorIdx++ % MUTUAL_AID_COLORS.length];
      return { name, value, color };
    }),
  };
}

function DonutWithCenter({ data, total, label }: { data: { name: string; value: number; color: string }[]; total: number; label: string }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <DonutChart
        data={data}
        size={260}
        thickness={44}
        withLabelsLine
        withLabels
        tooltipDataSource="segment"
      />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <Text fw={700} size="xl">{total}</Text>
        <Text size="xs" c="dimmed">{label}</Text>
      </div>
    </div>
  );
}

type ChartView = "complaint" | "callType" | "mutualAid";

export function RunLogCharts({ entries }: { entries: RunLogEntry[] }) {
  const [view, setView] = useState<ChartView>("complaint");

  const aggregatedData = view !== "mutualAid" ? aggregate(entries, view) : [];
  const fireMutualAid = view === "mutualAid" ? aggregateFireMutualAid(entries) : null;

  return (
    <Stack align="center" gap="xl" pt="md">
      <SegmentedControl
        value={view}
        onChange={(v) => setView(v as ChartView)}
        data={[
          { value: "complaint", label: "Complaint Type" },
          { value: "callType", label: "Call Type" },
          { value: "mutualAid", label: "Mutual Aid" },
        ]}
      />

      {view === "mutualAid" ? (
        fireMutualAid!.total === 0 ? (
          <Text c="dimmed">No fire calls for this period.</Text>
        ) : (
          <>
            <DonutWithCenter data={fireMutualAid!.data} total={fireMutualAid!.total} label={fireMutualAid!.total !== 1 ? "fire calls" : "fire call"} />
            <Stack gap="xs" align="flex-start">
              {fireMutualAid!.data.map((item) => (
                <Group key={item.name} gap="xs">
                  <ColorSwatch color={`var(--mantine-color-${item.color.replace(".", "-")})`} size={14} />
                  <Text size="sm">{item.name} — {item.value}</Text>
                </Group>
              ))}
            </Stack>
          </>
        )
      ) : aggregatedData.length === 0 ? (
        <Text c="dimmed">No data for this month.</Text>
      ) : (
        <>
          <DonutWithCenter data={aggregatedData} total={entries.length} label={entries.length !== 1 ? "calls" : "call"} />
          <Stack gap="xs" align="flex-start">
            {aggregatedData.map((item) => (
              <Group key={item.name} gap="xs">
                <ColorSwatch color={`var(--mantine-color-${item.color.replace(".", "-")})`} size={14} />
                <Text size="sm">{item.name} — {item.value}</Text>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
