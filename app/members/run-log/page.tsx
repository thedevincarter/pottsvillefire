import { Container, Title, Text } from "@mantine/core";
import { getRunLog, getRunFormOptions } from "@/lib/runs";
import { MembersRunLogTable } from "./MembersRunLogTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Members Run Log | Pottsville Fire",
};

export default async function MembersRunLogPage() {
  const [runs, formOptions] = await Promise.all([
    getRunLog(),
    getRunFormOptions(),
  ]);

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Run Log</Title>
      <Text c="dimmed" mb="xl">
        View and manage incident records.
      </Text>
      <MembersRunLogTable initialRuns={runs} formOptions={formOptions} />
    </Container>
  );
}
