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
import {
  REQUEST_STATUSES,
  type MaintenanceRequest,
  type RequestStatus,
} from "@/lib/maintenance-requests";
import { RequestModal } from "./RequestModal";

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

const statusMeta = (status: RequestStatus) =>
  REQUEST_STATUSES.find((s) => s.value === status) ?? REQUEST_STATUSES[0];

// Unresolved first, then most recent.
function sortRequests(a: MaintenanceRequest, b: MaintenanceRequest) {
  const rank = (r: MaintenanceRequest) => (r.status === "unresolved" ? 0 : 1);
  return rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt);
}

type Props = {
  requests: MaintenanceRequest[];
  targetLabel: string; // "Apparatus" | "Station"
  targetOptions: { value: string; label: string }[];
  targetField: "apparatusId" | "station";
};

export function MaintenanceRequestsPanel({
  requests,
  targetLabel,
  targetOptions,
  targetField,
}: Props) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const memberName = profile?.fullName || user?.email || "";
  const canManage = (r: MaintenanceRequest) => isAdmin || r.memberName === memberName;

  const targetValueOf = (r: MaintenanceRequest) =>
    targetField === "apparatusId" ? r.apparatusId : r.station;
  const targetNameOf = (r: MaintenanceRequest) =>
    (targetField === "apparatusId" ? r.apparatusName : r.stationName) ?? "-";

  const statusFilterOptions = [
    { value: "all", label: "All Statuses" },
    ...REQUEST_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  ];
  const targetFilterOptions = [
    { value: "all", label: `All ${targetLabel}` },
    ...targetOptions,
  ];

  const filtered = requests
    .filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (targetFilter !== "all" && targetValueOf(r) !== targetFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = [targetNameOf(r), r.description, r.memberName]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    })
    .sort(sortRequests);

  async function handleCreate(targetValue: string, description: string) {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/maintenance-requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ [targetField]: targetValue, description }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Could not submit this request.");
      return;
    }
    router.refresh();
  }

  async function handleStatus(id: string, status: RequestStatus) {
    const token = await getToken();
    if (!token) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/maintenance-requests/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        alert("Could not update status.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(r: MaintenanceRequest) {
    if (!confirm(`Delete this request for ${targetNameOf(r)}? This can't be undone.`)) return;
    const token = await getToken();
    if (!token) return;
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/maintenance-requests/${r.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        alert("Could not delete this request.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const statusControl = (r: MaintenanceRequest) =>
    isAdmin ? (
      <NativeSelect
        size="xs"
        value={r.status}
        disabled={busyId === r.id}
        onChange={(e) => handleStatus(r.id, e.currentTarget.value as RequestStatus)}
        data={REQUEST_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        style={{ maxWidth: 140 }}
      />
    ) : (
      <Badge color={statusMeta(r.status).color} variant="light" size="sm">
        {statusMeta(r.status).label}
      </Badge>
    );

  return (
    <>
      <Group justify="space-between" wrap="nowrap" align="flex-start" mb="md">
        <Group gap="xs" wrap="wrap" style={{ flex: 1 }}>
          <TextInput
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="sm"
            style={{ flex: 1, minWidth: 150, maxWidth: 260 }}
          />
          <NativeSelect
            data={targetFilterOptions}
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.currentTarget.value)}
            size="sm"
            style={{ maxWidth: 170 }}
          />
          <NativeSelect
            data={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.currentTarget.value)}
            size="sm"
            style={{ maxWidth: 150 }}
          />
        </Group>
        <Button onClick={openAdd} color="red" size="sm">
          New Request
        </Button>
      </Group>

      {/* Mobile cards */}
      <Box hiddenFrom="sm">
        {filtered.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            No requests found.
          </Text>
        ) : (
          <Stack gap="sm">
            {filtered.map((r) => (
              <Card key={r.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" mb={4} wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {targetNameOf(r)}
                  </Text>
                  {statusControl(r)}
                </Group>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }} mb={6}>
                  {r.description}
                </Text>
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs" c="dimmed">
                    {formatDate(r.createdAt)} · {r.memberName}
                  </Text>
                  {canManage(r) && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDelete(r)}
                      aria-label="Delete request"
                    >
                      {"✕"}
                    </ActionIcon>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop table */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>{targetLabel}</Table.Th>
                <Table.Th>Issue</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Submitted By</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      No requests found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filtered.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>{formatDate(r.createdAt)}</Table.Td>
                    <Table.Td>{targetNameOf(r)}</Table.Td>
                    <Table.Td style={{ whiteSpace: "pre-wrap", minWidth: 240 }}>
                      {r.description}
                    </Table.Td>
                    <Table.Td>{statusControl(r)}</Table.Td>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        href={`/members/profile/${encodeURIComponent(r.memberName)}`}
                        size="sm"
                      >
                        {r.memberName}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>
                      {canManage(r) && (
                        <Tooltip label="Delete request">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(r)}
                            aria-label="Delete request"
                          >
                            {"✕"}
                          </ActionIcon>
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

      <RequestModal
        opened={addOpened}
        onClose={closeAdd}
        onSave={({ targetValue, description }) => handleCreate(targetValue, description)}
        title={`New ${targetLabel} Request`}
        targetLabel={targetLabel}
        targetOptions={targetOptions}
      />
    </>
  );
}
