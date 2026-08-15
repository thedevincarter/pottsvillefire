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
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { STATIONS } from "@/lib/stations";
import type { StationMaintenanceLog } from "@/lib/station-maintenance";
import type { MaintenanceRequest } from "@/lib/maintenance-requests";
import { StationMaintenanceModal } from "./StationMaintenanceModal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Chicago",
  });
}

// Who the work log credits for a closed-out request: whoever marked it
// resolved, falling back to the assignee and then the submitter.
function creditedTo(r: MaintenanceRequest) {
  return r.resolvedBy ?? r.assignedTo ?? r.memberName;
}

// The work log interleaves hand-written logs with requests that have been
// resolved — both are work that got done, so they read as one history.
type Row =
  | { kind: "log"; id: string; date: string; log: StationMaintenanceLog }
  | { kind: "request"; id: string; date: string; request: MaintenanceRequest };

export function StationMaintenanceList({
  logs,
  resolvedRequests,
}: {
  logs: StationMaintenanceLog[];
  resolvedRequests: MaintenanceRequest[];
}) {
  const { user, profile, isAdmin, isOfficer, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editLog, setEditLog] = useState<StationMaintenanceLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("all");

  const memberName = profile?.fullName || user?.email || "";
  const canManage = (log: StationMaintenanceLog) => isAdmin || log.memberName === memberName;

  const filterOptions = [{ value: "all", label: "All Stations" }, ...STATIONS];

  const rows: Row[] = [
    ...logs.map((log) => ({ kind: "log" as const, id: log.id, date: log.createdAt, log })),
    ...resolvedRequests.map((request) => ({
      kind: "request" as const,
      id: request.id,
      // Sort resolved requests by when the work was finished, not filed.
      date: request.resolvedAt ?? request.createdAt,
      request,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = rows.filter((row) => {
    const station = row.kind === "log" ? row.log.station : row.request.station;
    const haystack =
      row.kind === "log"
        ? [row.log.stationName, row.log.workDone, row.log.memberName]
        : [row.request.stationName, row.request.description, creditedTo(row.request)];

    if (stationFilter !== "all" && station !== stationFilter) return false;
    if (search && !haystack.join(" ").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleSave(data: Record<string, unknown>, id?: string) {
    const token = await getToken();
    if (!token) return;
    const url = id ? `/api/station-maintenance/${id}` : "/api/station-maintenance";
    const res = await fetch(url, {
      method: id ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Could not save this log.");
      return;
    }
    router.refresh();
  }

  // Reopening sends the request back to the Requests tab.
  async function handleReopen(request: MaintenanceRequest) {
    const token = await getToken();
    if (!token) return;
    setReopeningId(request.id);
    try {
      const res = await fetch(`/api/maintenance-requests/${request.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unresolved" }),
      });
      if (!res.ok) {
        alert("Could not reopen this request.");
        return;
      }
      router.refresh();
    } finally {
      setReopeningId(null);
    }
  }

  async function handleDelete(log: StationMaintenanceLog) {
    if (!confirm(`Delete this log for ${log.stationName}? This can't be undone.`)) return;
    const token = await getToken();
    if (!token) return;
    setDeletingId(log.id);
    try {
      const res = await fetch(`/api/station-maintenance/${log.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        alert("Could not delete this log.");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Group justify="space-between" wrap="nowrap" align="flex-start" mb="md">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
          <TextInput
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="sm"
            style={{ flex: 1, maxWidth: 300 }}
          />
          <NativeSelect
            data={filterOptions}
            value={stationFilter}
            onChange={(e) => setStationFilter(e.currentTarget.value)}
            size="sm"
            style={{ maxWidth: 170 }}
          />
        </Group>
        <Button onClick={openAdd} color="red" size="sm">
          Add Log
        </Button>
      </Group>

      {/* Mobile cards */}
      <Box hiddenFrom="sm">
        {filtered.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            No logs found.
          </Text>
        ) : (
          <Stack gap="sm">
            {filtered.map((row) => (
              <Card key={row.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" mb={4} wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {row.kind === "log" ? row.log.stationName : row.request.stationName}
                  </Text>
                  {row.kind === "request" && (
                    <Badge color="blue" variant="light" size="sm">
                      Request
                    </Badge>
                  )}
                </Group>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }} mb={6}>
                  {row.kind === "log" ? row.log.workDone : row.request.description}
                </Text>
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs" c="dimmed">
                    {formatDate(row.date)} ·{" "}
                    {row.kind === "log" ? row.log.memberName : creditedTo(row.request)}
                  </Text>
                  {row.kind === "log" && canManage(row.log) && (
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => setEditLog(row.log)}
                        aria-label="Edit log"
                      >
                        {"✎"}
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        loading={deletingId === row.id}
                        onClick={() => handleDelete(row.log)}
                        aria-label="Delete log"
                      >
                        {"✕"}
                      </ActionIcon>
                    </Group>
                  )}
                  {row.kind === "request" && isOfficer && (
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      loading={reopeningId === row.id}
                      onClick={() => handleReopen(row.request)}
                    >
                      Reopen
                    </Button>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop table */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={640}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Station</Table.Th>
                <Table.Th>Work Done</Table.Th>
                <Table.Th>By</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" py="md">
                      No logs found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filtered.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</Table.Td>
                    <Table.Td>
                      {row.kind === "log" ? row.log.stationName : row.request.stationName}
                    </Table.Td>
                    <Table.Td style={{ whiteSpace: "pre-wrap", minWidth: 260 }}>
                      <Group gap="xs" wrap="nowrap" align="flex-start">
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                          {row.kind === "log" ? row.log.workDone : row.request.description}
                        </Text>
                        {row.kind === "request" && (
                          <Badge color="blue" variant="light" size="sm">
                            Request
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        href={`/members/profile/${encodeURIComponent(
                          row.kind === "log" ? row.log.memberName : creditedTo(row.request)
                        )}`}
                        size="sm"
                      >
                        {row.kind === "log" ? row.log.memberName : creditedTo(row.request)}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>
                      {row.kind === "log" && canManage(row.log) && (
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit log">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() => setEditLog(row.log)}
                              aria-label="Edit log"
                            >
                              {"✎"}
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete log">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              loading={deletingId === row.id}
                              onClick={() => handleDelete(row.log)}
                              aria-label="Delete log"
                            >
                              {"✕"}
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                      {row.kind === "request" && isOfficer && (
                        <Tooltip label="Send back to the Requests tab">
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            loading={reopeningId === row.id}
                            onClick={() => handleReopen(row.request)}
                          >
                            Reopen
                          </Button>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>

      <StationMaintenanceModal
        opened={addOpened}
        onClose={closeAdd}
        onSave={(data) => handleSave(data)}
        title="Add Station Log"
      />

      <StationMaintenanceModal
        opened={!!editLog}
        onClose={() => setEditLog(null)}
        onSave={(data) => {
          if (editLog) return handleSave(data, editLog.id);
        }}
        title="Edit Station Log"
        initialData={editLog ?? undefined}
      />
    </>
  );
}
