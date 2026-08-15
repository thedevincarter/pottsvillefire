"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ActionIcon,
  Alert,
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
import type { LockedMonth } from "@/lib/run-locks";
import { monthKey, monthLabel } from "@/lib/month";
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
  lockedMonths,
  initialMonth = "all",
}: {
  initialRuns: RunLogEntry[];
  formOptions: RunFormOptions;
  lockedMonths: LockedMonth[];
  initialMonth?: string;
}) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editRun, setEditRun] = useState<RunLogEntry | null>(null);
  const [respondingIds, setRespondingIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lockBusy, setLockBusy] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const memberName = profile?.fullName || user?.email || "";

  const lockedByMonth = new Map(lockedMonths.map((l) => [l.month, l]));
  // A run with no date can't belong to a month, so it can't be locked.
  const lockOf = (run: RunLogEntry) =>
    run.date ? lockedByMonth.get(monthKey(run.date)) : undefined;

  // Build month options from run dates
  const monthOptions = (() => {
    const months = new Map<string, number>();
    for (const run of initialRuns) {
      if (!run.date) continue;
      const key = monthKey(run.date);
      months.set(key, (months.get(key) ?? 0) + 1);
    }
    return [
      { value: "all", label: `All Months (${initialRuns.length})` },
      ...[...months.entries()].map(([value, count]) => ({
        value,
        label: `${monthLabel(value)} (${count})${lockedByMonth.has(value) ? " 🔒" : ""}`,
      })),
    ];
  })();

  // A ?month= from the URL may name a month with no runs; fall back rather than
  // leaving the select showing a value it doesn't have.
  const month = monthOptions.some((o) => o.value === selectedMonth)
    ? selectedMonth
    : "all";

  const filteredRuns =
    month === "all"
      ? initialRuns
      : initialRuns.filter((run) => run.date && monthKey(run.date) === month);

  // The lock on the month currently being viewed, if any. "All Months" has no
  // single lock state, so the admin control only appears on a real month.
  const selectedLock = month === "all" ? undefined : lockedByMonth.get(month);

  async function handleRespond(runId: string) {
    const token = await getToken();
    if (!token) return;

    setRespondingIds((prev) => new Set(prev).add(runId));
    try {
      const res = await fetch(`/api/runs/${runId}/respond`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? "Could not update your response.");
        return;
      }
      router.refresh();
    } finally {
      setRespondingIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  }

  async function handleToggleLock() {
    if (month === "all") return;
    const locking = !selectedLock;
    if (
      locking &&
      !confirm(
        `Lock ${monthLabel(month)}? Members will no longer be able to mark or unmark ` +
          "themselves as responded to its calls."
      )
    ) {
      return;
    }

    const token = await getToken();
    if (!token) return;

    setLockBusy(true);
    try {
      const res = await fetch("/api/run-locks", {
        method: locking ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? `Could not ${locking ? "lock" : "unlock"} this month.`);
        return;
      }
      router.refresh();
    } finally {
      setLockBusy(false);
    }
  }

  async function handleDelete(run: RunLogEntry) {
    const label = run.date ? formatDate(run.date) : "this run";
    const responses = run.respondedMembers.length;
    if (
      !confirm(
        `Delete the ${run.complaint ?? "run"} on ${label}?` +
          (responses > 0
            ? ` ${responses} member response${responses !== 1 ? "s" : ""} will be removed too.`
            : "") +
          " This can't be undone."
      )
    ) {
      return;
    }

    const token = await getToken();
    if (!token) return;

    setDeletingId(run.id);
    try {
      const res = await fetch(`/api/runs/${run.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("Could not delete this run.");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
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
            value={month}
            onChange={(e) => setSelectedMonth(e.currentTarget.value)}
            size="sm"
            style={{ flex: 1, maxWidth: 220 }}
          />
          {isAdmin && (
            <Group gap="xs">
              {month !== "all" && (
                <Button
                  variant="default"
                  size="sm"
                  loading={lockBusy}
                  onClick={handleToggleLock}
                >
                  {selectedLock ? "Unlock Month" : "Lock Month"}
                </Button>
              )}
              <Button
                component={Link}
                href={`/members/run-log/export?month=${month}`}
                variant="default"
                size="sm"
              >
                Export
              </Button>
              <Button onClick={openAdd} color="red" size="sm">
                Add Run
              </Button>
            </Group>
          )}
        </Group>
      </Box>

      {selectedLock && (
        <Alert color="gray" variant="light" mb="md" title={`${monthLabel(month)} is locked`}>
          Responses for this month can no longer be changed. Locked by{" "}
          {selectedLock.lockedBy} on {formatDate(selectedLock.lockedAt)}.
        </Alert>
      )}

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
              const lock = lockOf(run);
              return (
                <Card key={run.id} withBorder padding="sm" radius="md">
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={600}>
                      {run.date ? formatDate(run.date) : "-"}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      {lock && (
                        <Badge color="gray" variant="light" size="sm">
                          Locked
                        </Badge>
                      )}
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
                      disabled={!!lock}
                      onClick={() => handleRespond(run.id)}
                    >
                      {hasResponded ? "✓ Responded" : "Mark as Responded"}
                    </Button>
                    {isAdmin && (
                      <>
                        <ActionIcon
                          variant="light"
                          size="md"
                          onClick={() => setEditRun(run)}
                          aria-label="Edit run"
                        >
                          {"\u270E"}
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="md"
                          loading={deletingId === run.id}
                          onClick={() => handleDelete(run)}
                          aria-label="Delete run"
                        >
                          {"\u2715"}
                        </ActionIcon>
                      </>
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
                  const lock = lockOf(run);
                  return (
                    <Table.Tr key={run.id}>
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        <Group gap={6} wrap="nowrap">
                          {run.date ? formatDate(run.date) : "-"}
                          {lock && (
                            <Badge color="gray" variant="light" size="sm">
                              Locked
                            </Badge>
                          )}
                        </Group>
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
                              lock
                                ? `${monthLabel(lock.month)} is locked`
                                : hasResponded
                                  ? "Remove your response"
                                  : "Mark as responded"
                            }
                          >
                            {/* A disabled control drops pointer events, so the
                                tooltip needs a wrapper that still receives them. */}
                            <Box>
                              <ActionIcon
                                variant={hasResponded ? "filled" : "light"}
                                color={hasResponded ? "green" : "gray"}
                                size="sm"
                                loading={respondingIds.has(run.id)}
                                disabled={!!lock}
                                onClick={() => handleRespond(run.id)}
                                aria-label="Toggle responded"
                              >
                                {"\u2713"}
                              </ActionIcon>
                            </Box>
                          </Tooltip>
                          {isAdmin && (
                            <>
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
                              <Tooltip label="Delete run">
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  size="sm"
                                  loading={deletingId === run.id}
                                  onClick={() => handleDelete(run)}
                                  aria-label="Delete run"
                                >
                                  {"\u2715"}
                                </ActionIcon>
                              </Tooltip>
                            </>
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
