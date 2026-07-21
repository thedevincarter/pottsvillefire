"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  NativeSelect,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import type { RunLogEntry, RunFormOptions } from "@/lib/runs";
import { RunModal } from "./RunModal";

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
        timeZone: "America/Chicago",
      })
    : new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export function MembersRunLogTable({
  initialRuns,
  formOptions,
}: {
  initialRuns: RunLogEntry[];
  formOptions: RunFormOptions;
}) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editRun, setEditRun] = useState<RunLogEntry | null>(null);
  const [respondingIds, setRespondingIds] = useState<Set<string>>(new Set());

  const [selectedMonth, setSelectedMonth] = useState("all");

  const memberName = profile?.fullName || user?.email || "";

  // Build month options from run dates
  const monthOptions = (() => {
    const months = new Map<string, { label: string; count: number }>();
    for (const run of initialRuns) {
      if (!run.date) continue;
      const d = new Date(run.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = months.get(key);
      if (existing) {
        existing.count++;
      } else {
        months.set(key, {
          label: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "America/Chicago" }),
          count: 1,
        });
      }
    }
    return [
      { value: "all", label: `All Months (${initialRuns.length})` },
      ...[...months.entries()].map(([value, { label, count }]) => ({
        value,
        label: `${label} (${count})`,
      })),
    ];
  })();

  const filteredRuns =
    selectedMonth === "all"
      ? initialRuns
      : initialRuns.filter((run) => {
          if (!run.date) return false;
          const d = new Date(run.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return key === selectedMonth;
        });

  async function handleRespond(runId: string) {
    const token = await getToken();
    if (!token) return;

    setRespondingIds((prev) => new Set(prev).add(runId));
    try {
      await fetch(`/api/runs/${runId}/respond`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberName }),
      });
      router.refresh();
    } finally {
      setRespondingIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  }

  async function handleSave(data: Record<string, unknown>, id?: string) {
    const token = await getToken();
    if (!token) return;

    const url = id ? `/api/runs/${id}` : "/api/runs";
    const method = id ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  return (
    <>
      <Box
        style={{
          position: "sticky",
          top: 96,
          zIndex: 99,
          backgroundColor: "var(--mantine-color-body)",
          borderBottom: "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
        }}
        py="sm"
        mb="md"
      >
        <Group justify="space-between">
          <NativeSelect
            data={monthOptions}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.currentTarget.value)}
            size="sm"
            style={{ flex: 1, maxWidth: 220 }}
          />
          {isAdmin && (
            <Button onClick={openAdd} color="red" size="sm">
              Add Run
            </Button>
          )}
        </Group>
      </Box>

      {/* Mobile card view */}
      <Box hiddenFrom="sm">
        {filteredRuns.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            No runs recorded yet.
          </Text>
        ) : (
          <Stack gap="sm">
            {filteredRuns.map((run) => {
              const hasResponded = run.respondedMembers.includes(memberName);
              return (
                <Card key={run.id} withBorder padding="sm" radius="md">
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={600}>
                      {run.date ? formatDate(run.date) : "-"}
                    </Text>
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

                  {run.address && (
                    <Text size="sm" c="dimmed" mb={2}>
                      {run.address}
                    </Text>
                  )}
                  {run.complaint && (
                    <Text size="sm" mb={2}>
                      {run.complaint}
                    </Text>
                  )}
                  {run.mutualAid && (
                    <Text size="xs" c="dimmed" mb={4}>
                      Mutual Aid: {run.mutualAid}
                    </Text>
                  )}

                  {run.respondedMembers.length > 0 && (
                    <Group gap={4} mb={8} wrap="wrap">
                      {run.respondedMembers.map((name) => (
                        <Anchor
                          key={name}
                          component={Link}
                          href={`/members/profile/${encodeURIComponent(name)}`}
                          size="xs"
                        >
                          {name}
                        </Anchor>
                      ))}
                    </Group>
                  )}

                  <Group gap="xs">
                    <Button
                      variant={hasResponded ? "filled" : "light"}
                      color={hasResponded ? "green" : "gray"}
                      size="compact-sm"
                      fullWidth
                      loading={respondingIds.has(run.id)}
                      onClick={() => handleRespond(run.id)}
                    >
                      {hasResponded ? "✓ Responded" : "Mark as Responded"}
                    </Button>
                    {isAdmin && (
                      <ActionIcon
                        variant="light"
                        size="md"
                        onClick={() => setEditRun(run)}
                        aria-label="Edit run"
                      >
                        {"\u270E"}
                      </ActionIcon>
                    )}
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Desktop table view */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Address</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Complaint</Table.Th>
                <Table.Th>Mutual Aid</Table.Th>
                <Table.Th>Responding Members</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredRuns.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" ta="center" py="md">
                      No runs recorded yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredRuns.map((run) => {
                  const hasResponded = run.respondedMembers.includes(memberName);
                  return (
                    <Table.Tr key={run.id}>
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        {run.date ? formatDate(run.date) : "-"}
                      </Table.Td>
                      <Table.Td>{run.address ?? "-"}</Table.Td>
                      <Table.Td>
                        {run.callType ? (
                          <Badge
                            color={callTypeColors[run.callType] ?? "gray"}
                            variant="light"
                            size="sm"
                          >
                            {run.callType}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </Table.Td>
                      <Table.Td>{run.complaint ?? "-"}</Table.Td>
                      <Table.Td>{run.mutualAid ?? "-"}</Table.Td>
                      <Table.Td>
                        {run.respondedMembers.length > 0 ? (
                          <Stack gap={2}>
                            {run.respondedMembers.map((name) => (
                              <Anchor
                                key={name}
                                component={Link}
                                href={`/members/profile/${encodeURIComponent(name)}`}
                                size="sm"
                              >
                                {name}
                              </Anchor>
                            ))}
                          </Stack>
                        ) : (
                          <Text size="sm" c="dimmed">
                            -
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Tooltip
                            label={
                              hasResponded
                                ? "Remove your response"
                                : "Mark as responded"
                            }
                          >
                            <ActionIcon
                              variant={hasResponded ? "filled" : "light"}
                              color={hasResponded ? "green" : "gray"}
                              size="sm"
                              loading={respondingIds.has(run.id)}
                              onClick={() => handleRespond(run.id)}
                              aria-label="Toggle responded"
                            >
                              {"\u2713"}
                            </ActionIcon>
                          </Tooltip>
                          {isAdmin && (
                            <Tooltip label="Edit run">
                              <ActionIcon
                                variant="light"
                                size="sm"
                                onClick={() => setEditRun(run)}
                                aria-label="Edit run"
                              >
                                {"\u270E"}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>

      <RunModal
        opened={addOpened}
        onClose={closeAdd}
        onSave={(data) => handleSave(data)}
        title="Add Run"
        options={formOptions}
      />

      <RunModal
        opened={!!editRun}
        onClose={() => setEditRun(null)}
        onSave={(data) => {
          if (editRun) return handleSave(data, editRun.id);
        }}
        title="Edit Run"
        initialData={editRun ?? undefined}
        options={formOptions}
      />
    </>
  );
}
