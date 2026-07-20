import { notFound } from "next/navigation";
import { Container, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { getMemberResponseStats } from "@/lib/runs";
import { ResponseCharts } from "./ResponseCharts";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const stats = await getMemberResponseStats(decodedName);

  if (!stats) {
    notFound();
  }

  return (
    <Container size="sm" pt="xl" pb="xl">
      <Title mb="xs">{stats.name}</Title>
      {(stats.rank || stats.number) && (
        <Text size="lg" c="dimmed" mb="lg">
          {[stats.rank, stats.number ? `#${stats.number}` : null].filter(Boolean).join(" · ")}
        </Text>
      )}

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
        <Paper withBorder p="md" radius="md" ta="center">
          <Text size="xs" c="dimmed">Responded</Text>
          <Text size="xl" fw={700}>{stats.responded}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md" ta="center">
          <Text size="xs" c="dimmed">Total Calls</Text>
          <Text size="xl" fw={700}>{stats.totalCalls}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md" ta="center">
          <Text size="xs" c="dimmed">Overall %</Text>
          <Text size="xl" fw={700}>
            {stats.totalCalls > 0 ? Math.round((stats.responded / stats.totalCalls) * 100) : 0}%
          </Text>
        </Paper>
        <Paper withBorder p="md" radius="md" ta="center">
          <Text size="xs" c="dimmed">Trainings %</Text>
          <Text size="xl" fw={700}>
            {stats.totalTrainings > 0
              ? Math.round((stats.trainingsAttended / stats.totalTrainings) * 100)
              : 0}%
          </Text>
          <Text size="xs" c="dimmed">
            {stats.trainingsAttended} / {stats.totalTrainings}
          </Text>
        </Paper>
      </SimpleGrid>

      <ResponseCharts stats={stats} />
    </Container>
  );
}
