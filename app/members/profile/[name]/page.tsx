import { notFound } from "next/navigation";
import { Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { getMemberStats } from "@/lib/runs";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const stats = await getMemberStats(decodedName);

  if (!stats) {
    notFound();
  }

  return (
    <Container size="sm" pt="xl">
      <Title mb="xs">{stats.name}</Title>
      {(stats.rank || stats.number) && (
        <Text size="lg" c="dimmed" mb="lg">
          {[stats.rank, stats.number ? `#${stats.number}` : null].filter(Boolean).join(" · ")}
        </Text>
      )}
      <Paper withBorder p="lg" radius="md">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Total Calls Responded
          </Text>
          <Text size="xl" fw={700}>
            {stats.totalCalls}
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
