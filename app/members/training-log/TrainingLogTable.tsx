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
import type { TrainingEntry, TrainingFormOptions } from "@/lib/trainings";
import { TrainingModal } from "./TrainingModal";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Chicago",
  });
}

export function TrainingLogTable({
  initialTrainings,
  formOptions,
}: {
  initialTrainings: TrainingEntry[];
  formOptions: TrainingFormOptions;
}) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editTraining, setEditTraining] = useState<TrainingEntry | null>(null);
  const [attendingIds, setAttendingIds] = useState<Set<string>>(new Set());

  const memberName = profile?.fullName || user?.email || "";

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Type filter options from the types actually present.
  const typeOptions = [
    { value: "all", label: "All Types" },
    ...[...new Set(initialTrainings.map((t) => t.type).filter(Boolean))].map((t) => ({
      value: t as string,
      label: t as string,
    })),
  ];

  // Month filter options built from training dates.
  const monthOptions = (() => {
    const months = new Map<string, { label: string; count: number }>();
    for (const t of initialTrainings) {
      if (!t.date) continue;
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = months.get(key);
      if (existing) {
        existing.count++;
      } else {
        months.set(key, {
          label: d.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
            timeZone: "America/Chicago",
          }),
          count: 1,
        });
      }
    }
    return [
      { value: "all", label: `All Months (${initialTrainings.length})` },
      ...[...months.entries()].map(([value, { label, count }]) => ({
        value,
        label: `${label} (${count})`,
      })),
    ];
  })();

  const filteredTrainings = initialTrainings.filter((t) => {
    if (selectedType !== "all" && t.type !== selectedType) return false;
    if (selectedMonth !== "all") {
      if (!t.date) return false;
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key !== selectedMonth) return false;
    }
    if (search) {
      const term = search.toLowerCase();
      const haystack = [t.type ?? "", ...t.attendees].join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  async function handleAttend(trainingId: string) {
    const token = await getToken();
    if (!token) return;

    setAttendingIds((prev) => new Set(prev).add(trainingId));
    try {
      await fetch(`/api/trainings/${trainingId}/attend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      router.refresh();
    } finally {
      setAttendingIds((prev) => {
        const next = new Set(prev);
        next.delete(trainingId);
        return next;
      });
    }
  }

  async function handleSave(data: Record<string, unknown>, id?: string) {
    const token = await getToken();
    if (!token) return;

    const url = id ? `/api/trainings/${id}` : "/api/trainings";
    const method = id ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="xs" wrap="wrap" style={{ flex: 1 }}>
            <TextInput
              placeholder="Search type or attendee..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
              style={{ flex: 1, minWidth: 160, maxWidth: 280 }}
            />
            <NativeSelect
              data={typeOptions}
              value={selectedType}
              onChange={(e) => setSelectedType(e.currentTarget.value)}
              size="sm"
              style={{ maxWidth: 160 }}
            />
            <NativeSelect
              data={monthOptions}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.currentTarget.value)}
              size="sm"
              style={{ maxWidth: 200 }}
            />
          </Group>
          {isAdmin && (
            <Button onClick={openAdd} color="red" size="sm">
              Add Training
            </Button>
          )}
        </Group>
      </Box>

      {/* Mobile card view */}
      <Box hiddenFrom="sm">
        {filteredTrainings.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            No trainings found.
          </Text>
        ) : (
          <Stack gap="sm">
            {filteredTrainings.map((t) => (
              <Card key={t.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" mb={4} wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {t.date ? formatDate(t.date) : "-"}
                  </Text>
                  {t.type && (
                    <Badge color="blue" variant="light" size="sm">
                      {t.type}
                    </Badge>
                  )}
                </Group>
                {t.notes && (
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }} mb={4}>
                    {t.notes}
                  </Text>
                )}
                <Text size="xs" c="dimmed" mb={4}>
                  {t.attendees.length} attended
                </Text>
                {t.attendees.length > 0 && (
                  <Group gap={4} mb={8} wrap="wrap">
                    {t.attendees.map((name) => (
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
                <Group gap="xs" wrap="nowrap">
                  {(() => {
                    const attended = t.attendees.includes(memberName);
                    return (
                      <Button
                        variant={attended ? "filled" : "light"}
                        color={attended ? "green" : "gray"}
                        size="compact-sm"
                        fullWidth
                        loading={attendingIds.has(t.id)}
                        onClick={() => handleAttend(t.id)}
                      >
                        {attended ? "✓ Attended" : "Mark as Attended"}
                      </Button>
                    );
                  })()}
                  {isAdmin && (
                    <ActionIcon
                      variant="light"
                      size="md"
                      onClick={() => setEditTraining(t)}
                      aria-label="Edit training"
                    >
                      {"✎"}
                    </ActionIcon>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop table view */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={820}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Notes</Table.Th>
                <Table.Th>Attended</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTrainings.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      No trainings found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredTrainings.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>
                      {t.date ? formatDate(t.date) : "-"}
                    </Table.Td>
                    <Table.Td>
                      {t.type ? (
                        <Badge color="blue" variant="light" size="sm">
                          {t.type}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </Table.Td>
                    <Table.Td style={{ whiteSpace: "pre-wrap", minWidth: 200 }}>
                      {t.notes ? t.notes : <Text size="sm" c="dimmed">-</Text>}
                    </Table.Td>
                    <Table.Td>{t.attendees.length}</Table.Td>
                    <Table.Td>
                      {t.attendees.length > 0 ? (
                        <Group gap={4} wrap="wrap">
                          {t.attendees.map((name) => (
                            <Anchor
                              key={name}
                              component={Link}
                              href={`/members/profile/${encodeURIComponent(name)}`}
                              size="sm"
                            >
                              {name}
                            </Anchor>
                          ))}
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        {(() => {
                          const attended = t.attendees.includes(memberName);
                          return (
                            <Tooltip label={attended ? "Remove your attendance" : "Mark yourself attended"}>
                              <ActionIcon
                                variant={attended ? "filled" : "light"}
                                color={attended ? "green" : "gray"}
                                size="sm"
                                loading={attendingIds.has(t.id)}
                                onClick={() => handleAttend(t.id)}
                                aria-label="Toggle attendance"
                              >
                                {"✓"}
                              </ActionIcon>
                            </Tooltip>
                          );
                        })()}
                        {isAdmin && (
                          <Tooltip label="Edit training">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() => setEditTraining(t)}
                              aria-label="Edit training"
                            >
                              {"✎"}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>

      <TrainingModal
        opened={addOpened}
        onClose={closeAdd}
        onSave={(data) => handleSave(data)}
        title="Add Training"
        options={formOptions}
      />

      <TrainingModal
        opened={!!editTraining}
        onClose={() => setEditTraining(null)}
        onSave={(data) => {
          if (editTraining) return handleSave(data, editTraining.id);
        }}
        title="Edit Training"
        initialData={editTraining ?? undefined}
        options={formOptions}
      />
    </>
  );
}
