import { Container } from "@mantine/core";
import { getRunLog, getRosterNames } from "@/lib/runs";
import { monthLabel, sortRunsForExport } from "@/lib/run-export";
import { RunExportView } from "./RunExportView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Run Log Export | Pottsville Fire",
};

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function RunLogExportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const monthKey = /^\d{4}-\d{2}$/.test(month ?? "") ? month! : "all";

  const [runs, roster] = await Promise.all([getRunLog(), getRosterNames()]);

  const monthRuns = sortRunsForExport(
    runs.filter(
      (run) =>
        run.date &&
        (monthKey === "all" || toMonthKey(new Date(run.date)) === monthKey),
    ),
  );

  // Members who responded but aren't on the roster (legacy or removed accounts)
  // still need a column, or their responses would vanish from the report.
  const extraResponders = [
    ...new Set(monthRuns.flatMap((run) => run.respondedMembers)),
  ].filter((name) => !roster.includes(name));

  const members = [...roster, ...extraResponders.sort()];

  return (
    <Container size="xl" pt="xl" pb="xl">
      <RunExportView
        monthKey={monthKey}
        monthLabel={monthLabel(monthKey)}
        runs={monthRuns}
        members={members}
      />
    </Container>
  );
}
