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

export function RunLogCharts({ entries }: { entries: RunLogEntry[] }) {
  const [dataKey, setDataKey] = useState<"complaint" | "callType">("complaint");

  const data = aggregate(entries, dataKey);

  return (
    <Stack align="center" gap="xl" pt="md">
      <SegmentedControl
        value={dataKey}
        onChange={(v) => setDataKey(v as "complaint" | "callType")}
        data={[
          { value: "complaint", label: "Complaint Type" },
          { value: "callType", label: "Call Type" },
        ]}
      />

      {data.length === 0 ? (
        <Text c="dimmed">No data for this month.</Text>
      ) : (
        <>
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
              <Text fw={700} size="xl">{entries.length}</Text>
              <Text size="xs" c="dimmed">{entries.length !== 1 ? "calls" : "call"}</Text>
            </div>
          </div>

          <Stack gap="xs" align="flex-start">
            {data.map((item) => (
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
