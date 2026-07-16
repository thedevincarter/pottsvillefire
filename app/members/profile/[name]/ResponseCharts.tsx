"use client";

import { Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import type { MemberResponseStats } from "@/lib/runs";

function ResponseDonut({
  label,
  responded,
  total,
  color,
}: {
  label: string;
  responded: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((responded / total) * 100) : 0;
  const missed = total - responded;

  return (
    <Paper withBorder p="md" radius="md">
      <Text fw={600} size="sm" ta="center" mb="sm">{label}</Text>
      {total === 0 ? (
        <Text c="dimmed" ta="center" size="sm" py="md">No calls</Text>
      ) : (
        <Stack align="center" gap="xs">
          <DonutChart
            h={140}
            data={[
              { name: "Responded", value: responded, color },
              { name: "Missed", value: missed, color: "gray.3" },
            ]}
            chartLabel={`${pct}%`}
            size={130}
            thickness={16}
          />
          <Text size="xs" c="dimmed">{responded} / {total}</Text>
        </Stack>
      )}
    </Paper>
  );
}

export function ResponseCharts({ stats }: { stats: MemberResponseStats }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }}>
      <ResponseDonut
        label="Overall"
        responded={stats.responded}
        total={stats.totalCalls}
        color="green.6"
      />
      <ResponseDonut
        label="Fire"
        responded={stats.fire.responded}
        total={stats.fire.total}
        color="red.6"
      />
      <ResponseDonut
        label="Medical"
        responded={stats.medical.responded}
        total={stats.medical.total}
        color="blue.6"
      />
      <ResponseDonut
        label="MVC"
        responded={stats.mvc.responded}
        total={stats.mvc.total}
        color="yellow.6"
      />
    </SimpleGrid>
  );
}
