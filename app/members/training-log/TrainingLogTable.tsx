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

function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const memberName = profile?.fullName || user?.email || "";

  const [search, setSearch] = useState("");
  const [selectedSubGroup, setSelectedSubGroup] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Sub-group filter options from what's actually present.
  const subGroupOptions = [
    { value: "all", label: "All Sub-Groups" },
    ...[...new Set(initialTrainings.flatMap((t) => t.subGroups))]
      .sort((a, b) => a.localeCompare(b))
      .map((g) => ({ value: g, label: g })),
  ];

  // Month filter options built from training dates.
  const monthOptions = (() => {
    const months = new Map<string, { label: string; count: number }>();
    for (const t of initialTrainings) {
      if (!t.date) continue;
      const key = monthKey(t.date);
      const existing = months.get(key);
      if (existing) {
        existing.count++;
      } else {
        months.set(key, {
          label: new Date(t.date).toLocaleDateString("en-US", {
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
    if (selectedSubGroup !== "all" && !t.subGroups.includes(selectedSubGroup)) return false;
    if (selectedMonth !== "all") {
      if (!t.date || monthKey(t.date) !== selectedMonth) return false;
    }
    if (search) {
      const term = search.toLowerCase();
      const haystack = [
        ...t.subjects,
        ...t.subGroups,
        t.instructors ?? "",
        t.additionalDepartments ?? "",
        t.notes ?? "",
        ...t.attendees,
      ]
        .join(" ")
        .toLowerCase();
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
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Could not save this training.");
      return;
    }
    router.refresh();
  }

  async function handleDelete(t: TrainingEntry) {
    const when = t.date ? formatDate(t.date) : "this training";
    if (!confirm(`Delete the training from ${when}? This can't be undone.`)) return;
    const token = await getToken();
    if (!token) return;

    setDeletingIds((prev) => new Set(prev).add(t.id));
    try {
      const res = await fetch(`/api/trainings/${t.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        alert("Could not delete this training.");
        return;
      }
      router.refresh();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(t.id);
        return next;
      });
    }
  }

  const joinOrDash = (arr: string[]) => (arr.length > 0 ? arr.join(", ") : "-");

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
              placeholder="Search subject, instructor, attendee..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
              style={{ flex: 1, minWidth: 160, maxWidth: 280 }}
            />
            <NativeSelect
              data={subGroupOptions}
              value={selectedSubGroup}
              onChange={(e) => setSelectedSubGroup(e.currentTarget.value)}
              size="sm"
              style={{ maxWidth: 200 }}
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
                  <Group gap={4} wrap="nowrap">
                    {t.dayNight && (
                      <Badge color="grape" variant="light" size="sm">
                        {t.dayNight}
                      </Badge>
                    )}
                    {t.automaticAid && (
                      <Badge color="teal" variant="light" size="sm">
                        Auto aid
                      </Badge>
                    )}
                  </Group>
                </Group>

                {t.subjects.length > 0 && (
                  <Text size="sm" fw={500}>
                    {t.subjects.join(", ")}
                  </Text>
                )}
                {t.subGroups.length > 0 && (
                  <Text size="xs" c="dimmed">
                    Sub-Group: {t.subGroups.join(", ")}
                  </Text>
                )}
                {t.totalHours !== null && (
                  <Text size="xs" c="dimmed">
                    {t.totalHours} hr{t.totalHours === 1 ? "" : "s"}
                  </Text>
                )}
                {t.instructors && (
                  <Text size="xs" c="dimmed">
                    Instructors: {t.instructors}
                  </Text>
                )}
                {t.additionalDepartments && (
                  <Text size="xs" c="dimmed">
                    Additional Depts: {t.additionalDepartments}
                  </Text>
                )}
                {t.notes && (
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }} mt={4}>
                    {t.notes}
                  </Text>
                )}

                <Text size="xs" c="dimmed" mt={6} mb={4}>
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
                    <>
                      <ActionIcon
                        variant="light"
                        size="md"
                        onClick={() => setEditTraining(t)}
                        aria-label="Edit training"
                      >
                        {"✎"}
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="md"
                        loading={deletingIds.has(t.id)}
                        onClick={() => handleDelete(t)}
                        aria-label="Delete training"
                      >
                        {"✕"}
                      </ActionIcon>
                    </>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop table view */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={1000}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Subject</Table.Th>
                <Table.Th>Sub-Group</Table.Th>
                <Table.Th ta="center">Hours</Table.Th>
                <Table.Th ta="center">Day/Night</Table.Th>
                <Table.Th ta="center">Auto Aid</Table.Th>
                <Table.Th ta="center">Attended</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTrainings.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
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
                    <Table.Td style={{ minWidth: 180 }}>
                      {joinOrDash(t.subjects)}
                      {(t.instructors || t.additionalDepartments || t.notes) && (
                        <Stack gap={0} mt={2}>
                          {t.instructors && (
                            <Text size="xs" c="dimmed">Instructors: {t.instructors}</Text>
                          )}
                          {t.additionalDepartments && (
                            <Text size="xs" c="dimmed">Add&apos;l Depts: {t.additionalDepartments}</Text>
                          )}
                          {t.notes && (
                            <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                              {t.notes}
                            </Text>
                          )}
                        </Stack>
                      )}
                    </Table.Td>
                    <Table.Td>{joinOrDash(t.subGroups)}</Table.Td>
                    <Table.Td ta="center">{t.totalHours ?? "-"}</Table.Td>
                    <Table.Td ta="center">
                      {t.dayNight ? (
                        <Badge color="grape" variant="light" size="sm">{t.dayNight}</Badge>
                      ) : (
                        "-"
                      )}
                    </Table.Td>
                    <Table.Td ta="center">{t.automaticAid ? "✓" : "-"}</Table.Td>
                    <Table.Td ta="center">{t.attendees.length}</Table.Td>
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
                        <Text size="sm" c="dimmed">-</Text>
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
                          <>
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
                            <Tooltip label="Delete training">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                loading={deletingIds.has(t.id)}
                                onClick={() => handleDelete(t)}
                                aria-label="Delete training"
                              >
                                {"✕"}
                              </ActionIcon>
                            </Tooltip>
                          </>
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
