"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ActionIcon,
  Anchor,
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

export function StationMaintenanceList({ logs }: { logs: StationMaintenanceLog[] }) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editLog, setEditLog] = useState<StationMaintenanceLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("all");

  const memberName = profile?.fullName || user?.email || "";
  const canManage = (log: StationMaintenanceLog) => isAdmin || log.memberName === memberName;

  const filterOptions = [{ value: "all", label: "All Stations" }, ...STATIONS];

  const filtered = logs.filter((log) => {
    if (stationFilter !== "all" && log.station !== stationFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const haystack = [log.stationName, log.workDone, log.memberName].join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }
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
            {filtered.map((log) => (
              <Card key={log.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" mb={4} wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {log.stationName}
                  </Text>
                </Group>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }} mb={6}>
                  {log.workDone}
                </Text>
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs" c="dimmed">
                    {formatDate(log.createdAt)} · {log.memberName}
                  </Text>
                  {canManage(log) && (
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => setEditLog(log)}
                        aria-label="Edit log"
                      >
                        {"✎"}
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        loading={deletingId === log.id}
                        onClick={() => handleDelete(log)}
                        aria-label="Delete log"
                      >
                        {"✕"}
                      </ActionIcon>
                    </Group>
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
                filtered.map((log) => (
                  <Table.Tr key={log.id}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>{formatDate(log.createdAt)}</Table.Td>
                    <Table.Td>{log.stationName}</Table.Td>
                    <Table.Td style={{ whiteSpace: "pre-wrap", minWidth: 260 }}>
                      {log.workDone}
                    </Table.Td>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        href={`/members/profile/${encodeURIComponent(log.memberName)}`}
                        size="sm"
                      >
                        {log.memberName}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>
                      {canManage(log) && (
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit log">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() => setEditLog(log)}
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
                              loading={deletingId === log.id}
                              onClick={() => handleDelete(log)}
                              aria-label="Delete log"
                            >
                              {"✕"}
                            </ActionIcon>
                          </Tooltip>
                        </Group>
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
