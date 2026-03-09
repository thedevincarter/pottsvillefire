import { Container, Text, Title } from "@mantine/core";
import { getRunLog, RunLogEntry } from "@/lib/notion";
import { RunLogView } from "./RunLogView";
import { RunLogList } from "./RunLogList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Run Log | Pottsville Fire",
  description: "Pottsville Fire Department run log",
};

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

function getAvailableMonths(runs: RunLogEntry[], currentKey: string) {
  const keys = Array.from(
    new Set(
      runs
        .filter((r) => r.date)
        .map((r) => toMonthKey(new Date(r.date!)))
        .filter((k) => k <= currentKey)
    )
  ).sort().reverse();

  return keys.map((key) => ({ value: key, label: toMonthLabel(key) }));
}

export default async function RunLogPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const runs = await getRunLog();
  const now = new Date();
  const currentKey = toMonthKey(now);
  const months = getAvailableMonths(runs, currentKey);

  const allMonths = [{ value: "all", label: "Year to Date" }, ...months];

  const { month } = await searchParams;
  const validValues = allMonths.map((m) => m.value);
  const selectedMonth = validValues.includes(month ?? "") ? month! : months[0]?.value ?? "all";

  const entries =
    selectedMonth === "all"
      ? runs.filter((r) => r.date)
      : runs.filter((r) => r.date && toMonthKey(new Date(r.date)) === selectedMonth);

  return (
    <Container
      size="sm"
      pt="xl"
      style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}
    >
      <Title mb="xs">Run Log</Title>
      <Text c="dimmed" mb="xl">
        2026 incident log for Pottsville Fire Department.
      </Text>

      {months.length === 0 ? (
        <Text c="dimmed">No runs recorded yet.</Text>
      ) : (
        <RunLogView months={allMonths} value={selectedMonth} entries={entries}>
          <RunLogList entries={entries} />
        </RunLogView>
      )}
    </Container>
  );
}
