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
  const { isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editTraining, setEditTraining] = useState<TrainingEntry | null>(null);

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
                <Text size="xs" c="dimmed" mb={4}>
                  {t.attendees.length} attended
                </Text>
                {t.attendees.length > 0 && (
                  <Group gap={4} mb={isAdmin ? 8 : 0} wrap="wrap">
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
                {isAdmin && (
                  <Group justify="flex-end">
                    <ActionIcon
                      variant="light"
                      size="md"
                      onClick={() => setEditTraining(t)}
                      aria-label="Edit training"
                    >
                      {"✎"}
                    </ActionIcon>
                  </Group>
                )}
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
                <Table.Th>Type</Table.Th>
                <Table.Th>Attended</Table.Th>
                <Table.Th>Members</Table.Th>
                {isAdmin && <Table.Th>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTrainings.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={isAdmin ? 5 : 4}>
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
                    {isAdmin && (
                      <Table.Td>
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
                      </Table.Td>
                    )}
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
