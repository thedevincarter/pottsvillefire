"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Group, Select, Skeleton, Stack, Tabs, Text } from "@mantine/core";
import { RunLogEntry } from "@/lib/notion";
import { RunLogCharts } from "./RunLogCharts";

type Props = {
  months: { value: string; label: string }[];
  value: string;
  entries: RunLogEntry[];
  children: React.ReactNode;
};

function toCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function countLabel(count: number, value: string, months: { value: string; label: string }[]) {
  const calls = `${count} call${count !== 1 ? "s" : ""}`;
  if (value === "all") return `${calls} this year`;
  if (value === toCurrentMonthKey()) return `${calls} this month`;
  const monthName = months.find((m) => m.value === value)?.label.split(" ")[0] ?? "";
  return `${calls} in ${monthName}`;
}

export function RunLogView({ months, value, entries, children }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(v: string | null) {
    if (!v) return;
    startTransition(() => {
      router.push(`/run-log?month=${v}`);
    });
  }

  return (
    <>
      <Select
        data={months}
        value={value}
        onChange={handleChange}
        allowDeselect={false}
        w={200}
        mb="lg"
      />

      <Tabs
        defaultValue="log"
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Group justify="space-between" align="center" mb="md">
          <Tabs.List>
            <Tabs.Tab value="log">Log</Tabs.Tab>
            <Tabs.Tab value="charts">Charts</Tabs.Tab>
          </Tabs.List>
          <Text size="sm" c="dimmed">
            {countLabel(entries.length, value, months)}
          </Text>
        </Group>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            paddingBottom: "var(--mantine-spacing-xl)",
          }}
        >
          {isPending ? (
            <Stack gap="sm">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={72} radius="md" />
              ))}
            </Stack>
          ) : (
            <>
              <Tabs.Panel value="log">{children}</Tabs.Panel>
              <Tabs.Panel value="charts">
                <RunLogCharts entries={entries} />
              </Tabs.Panel>
            </>
          )}
        </div>
      </Tabs>
    </>
  );
}
