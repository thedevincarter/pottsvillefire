import { Container, Text, Title } from "@mantine/core";
import { getRunLog, RunLogEntry } from "@/lib/notion";
import { RunLogTabs } from "./RunLogTabs";

export const metadata = {
  title: "Run Log | Pottsville Fire",
  description: "Pottsville Fire Department run log",
};

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(key: string, count: number) {
  const [year, month] = key.split("-").map(Number);
  const name = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long" });
  return `${name} — ${count} ${count === 1 ? "call" : "calls"}`;
}

function groupByMonth(
  runs: RunLogEntry[],
  now: Date
): { key: string; label: string; entries: RunLogEntry[] }[] {
  const currentKey = toMonthKey(now);
  const groups = new Map<string, RunLogEntry[]>();

  for (const run of runs) {
    if (!run.date) continue;

    const runDate = new Date(run.date);
    const key = toMonthKey(runDate);

    // Skip future months
    if (key > currentKey) continue;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(run);
  }

  return Array.from(groups.entries()).map(([key, entries]) => ({
    key,
    label: toMonthLabel(key, entries.length),
    entries,
  }));
}

export default async function RunLogPage() {
  const runs = await getRunLog();
  const now = new Date();
  const currentKey = toMonthKey(now);
  const groups = groupByMonth(runs, now);

  // Default to current month if it exists, otherwise the most recent month
  const defaultTab =
    groups.find((g) => g.key === currentKey)?.key ?? groups[0]?.key ?? "";

  return (
    <Container size="sm" py="xl">
      <Title mb="xs">Run Log</Title>
      <Text c="dimmed" mb="xl">
        2026 incident log for Pottsville Fire Department.
      </Text>

      {groups.length === 0 ? (
        <Text c="dimmed">No runs recorded yet.</Text>
      ) : (
        <RunLogTabs groups={groups} defaultTab={defaultTab} />
      )}
    </Container>
  );
}
