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
import type { Apparatus } from "@/lib/apparatus";
import type { MaintenanceLog } from "@/lib/maintenance";
import { MaintenanceModal } from "./MaintenanceModal";

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

function formatMileage(mileage: number | null) {
  return mileage === null ? "-" : `${mileage.toLocaleString("en-US")} mi`;
}

export function ApparatusMaintenanceList({
  logs,
  apparatus,
}: {
  logs: MaintenanceLog[];
  apparatus: Apparatus[];
}) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editLog, setEditLog] = useState<MaintenanceLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [apparatusFilter, setApparatusFilter] = useState("all");

  const memberName = profile?.fullName || user?.email || "";
  const canManage = (log: MaintenanceLog) => isAdmin || log.memberName === memberName;

  const apparatusOptions = apparatus.map((a) => ({ value: a.id, label: a.name }));
  const filterOptions = [
    { value: "all", label: "All Apparatus" },
    ...apparatusOptions,
  ];

  const filteredLogs = logs.filter((log) => {
    if (apparatusFilter !== "all" && log.apparatusId !== apparatusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const haystack = [
        log.apparatusName,
        log.memberName,
        log.workDone,
        log.mileage?.toString() ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  async function handleSave(data: Record<string, unknown>, id?: string) {
    const token = await getToken();
    if (!token) return;

    const url = id ? `/api/apparatus-maintenance/${id}` : "/api/apparatus-maintenance";
    const method = id ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function handleDelete(log: MaintenanceLog) {
    if (!confirm(`Delete this maintenance log for ${log.apparatusName}? This can't be undone.`)) {
      return;
    }
    const token = await getToken();
    if (!token) return;

    setDeletingId(log.id);
    try {
      const res = await fetch(`/api/apparatus-maintenance/${log.id}`, {
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
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
            <TextInput
              placeholder="Search maintenance logs..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
              style={{ flex: 1, maxWidth: 320 }}
            />
            <NativeSelect
              data={filterOptions}
              value={apparatusFilter}
              onChange={(e) => setApparatusFilter(e.currentTarget.value)}
              size="sm"
              style={{ maxWidth: 180 }}
            />
          </Group>
          <Button onClick={openAdd} color="red" size="sm">
            Add Log
          </Button>
        </Group>
      </Box>

      {/* Mobile card view */}
      <Box hiddenFrom="sm">
        {filteredLogs.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            No maintenance logs found.
          </Text>
        ) : (
          <Stack gap="sm">
            {filteredLogs.map((log) => (
              <Card key={log.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" mb={4} wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {log.apparatusName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatMileage(log.mileage)}
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

      {/* Desktop table view */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Apparatus</Table.Th>
                <Table.Th>Mileage</Table.Th>
                <Table.Th>Work Done</Table.Th>
                <Table.Th>By</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredLogs.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      No maintenance logs found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredLogs.map((log) => (
                  <Table.Tr key={log.id}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>
                      {formatDate(log.createdAt)}
                    </Table.Td>
                    <Table.Td>{log.apparatusName}</Table.Td>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>
                      {formatMileage(log.mileage)}
                    </Table.Td>
                    <Table.Td style={{ whiteSpace: "pre-wrap", minWidth: 240 }}>
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

      <MaintenanceModal
        opened={addOpened}
        onClose={closeAdd}
        onSave={(data) => handleSave(data)}
        title="Add Maintenance Log"
        apparatusOptions={apparatusOptions}
      />

      <MaintenanceModal
        opened={!!editLog}
        onClose={() => setEditLog(null)}
        onSave={(data) => {
          if (editLog) return handleSave(data, editLog.id);
        }}
        title="Edit Maintenance Log"
        initialData={editLog ?? undefined}
        apparatusOptions={apparatusOptions}
      />
    </>
  );
}
