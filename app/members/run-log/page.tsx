import { Container, Title, Text } from "@mantine/core";
import { getRunLog, getRunFormOptions } from "@/lib/runs";
import { getLockedMonths } from "@/lib/run-locks";
import { MembersRunLogTable } from "./MembersRunLogTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Members Run Log | Pottsville Fire",
};

export default async function MembersRunLogPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const [runs, formOptions, lockedMonths, { month }] = await Promise.all([
    getRunLog(),
    getRunFormOptions(),
    getLockedMonths(),
    searchParams,
  ]);

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Run Log</Title>
      <Text c="dimmed" mb="xl">
        View and manage incident records.
      </Text>
      <MembersRunLogTable
        initialRuns={runs}
        formOptions={formOptions}
        lockedMonths={lockedMonths}
        initialMonth={month ?? "all"}
      />
    </Container>
  );
}
