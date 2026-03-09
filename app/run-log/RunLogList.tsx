import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { RunLogEntry } from "@/lib/notion";

const callTypeColors: Record<string, string> = {
  Fire: "red",
  Medical: "green",
  MVC: "purple",
};

function formatDate(date: string) {
  return date.includes("T")
    ? new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export function RunLogList({ entries }: { entries: RunLogEntry[] }) {
  if (entries.length === 0) {
    return <Text c="dimmed">No runs recorded this month.</Text>;
  }

  return (
    <Stack gap="sm">
{entries.map((run) => (
        <Card key={run.id} withBorder padding="md" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={4}>
              <Text fw={500}>{run.complaint ?? "Unknown complaint"}</Text>
              <Text size="sm" c="dimmed">
                {run.date ? formatDate(run.date) : "No date"}
              </Text>
            </Stack>
            {run.callType && (
              <Badge color={callTypeColors[run.callType] ?? "gray"} variant="light" size="sm">
                {run.callType}
              </Badge>
            )}
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
