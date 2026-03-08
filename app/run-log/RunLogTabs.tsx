"use client";

import { Badge, Card, Group, Stack, Tabs, Text } from "@mantine/core";
import { RunLogEntry } from "@/lib/notion";

const callTypeColors: Record<string, string> = {
  Fire: "red",
  Medical: "green",
  MVC: "purple",
};

type MonthGroup = {
  key: string;
  label: string;
  entries: RunLogEntry[];
};

export function RunLogTabs({
  groups,
  defaultTab,
}: {
  groups: MonthGroup[];
  defaultTab: string;
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <Tabs.List mb="lg">
        {groups.map(({ key, label }) => (
          <Tabs.Tab key={key} value={key}>
            {label}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {groups.map(({ key, entries }) => (
        <Tabs.Panel key={key} value={key}>
          {entries.length === 0 ? (
            <Text c="dimmed">No runs recorded this month.</Text>
          ) : (
            <Stack gap="sm">
              {entries.map((run) => (
                <Card key={run.id} withBorder padding="md" radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={4}>
                      <Text fw={500}>{run.complaint ?? "Unknown complaint"}</Text>
                      <Text size="sm" c="dimmed">
                        {run.date
                          ? run.date.includes("T")
                            ? new Date(run.date).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : new Date(run.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                          : "No date"}
                      </Text>
                    </Stack>
                    {run.callType && (
                      <Badge
                        color={callTypeColors[run.callType] ?? "gray"}
                        variant="light"
                        size="sm"
                      >
                        {run.callType}
                      </Badge>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
