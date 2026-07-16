"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  NativeSelect,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import type { ApparatusCheck, ApparatusCheckSummary, Apparatus, CheckItem } from "@/lib/apparatus";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const d = new Date(Number(year), Number(m) - 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

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

function ApparatusCheckItems({
  apparatus,
  checkItems,
  getToken,
  onUpdate,
}: {
  apparatus: Apparatus;
  checkItems: CheckItem[];
  getToken: () => Promise<string | null>;
  onUpdate: () => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const items = checkItems.filter((c) => c.apparatusId === apparatus.id);

  async function addItem() {
    const token = await getToken();
    if (!token || !newLabel.trim()) return;
    setSaving(true);
    await fetch("/api/admin/check-items", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ apparatusId: apparatus.id, label: newLabel.trim(), sortOrder: items.length }),
    });
    setNewLabel("");
    setSaving(false);
    onUpdate();
  }

  async function toggleItem(c: CheckItem) {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/check-items", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, label: c.label, sortOrder: c.sortOrder, active: !c.active }),
    });
    onUpdate();
  }

  return (
    <Stack gap="xs">
      {items.length === 0 && (
        <Text size="xs" c="dimmed">No checklist items yet.</Text>
      )}
      {items.map((c) => (
        <Group key={c.id} justify="space-between" pl="sm">
          <Text size="sm" c={c.active ? undefined : "dimmed"} td={c.active ? undefined : "line-through"}>
            {c.label}
          </Text>
          <Switch checked={c.active} onChange={() => toggleItem(c)} size="sm" />
        </Group>
      ))}
      <Group gap="xs" pl="sm">
        <TextInput
          placeholder="New checklist item"
          value={newLabel}
          onChange={(e) => setNewLabel(e.currentTarget.value)}
          size="sm"
          style={{ flex: 1 }}
        />
        <Button size="sm" color="red" onClick={addItem} loading={saving}>
          Add
        </Button>
      </Group>
    </Stack>
  );
}

function AdminSettings({
  allApparatus,
  allCheckItems,
  getToken,
  onUpdate,
}: {
  allApparatus: Apparatus[];
  allCheckItems: CheckItem[];
  getToken: () => Promise<string | null>;
  onUpdate: () => void;
}) {
  const [apparatusName, setApparatusName] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function addApparatus() {
    const token = await getToken();
    if (!token || !apparatusName.trim()) return;
    setSaving(true);
    await fetch("/api/admin/apparatus", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: apparatusName.trim(), sortOrder: allApparatus.length }),
    });
    setApparatusName("");
    setSaving(false);
    onUpdate();
  }

  async function toggleApparatus(a: Apparatus) {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/apparatus", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, name: a.name, sortOrder: a.sortOrder, active: !a.active }),
    });
    onUpdate();
  }

  return (
    <Stack gap="md">
      {allApparatus.map((a) => {
        const isExpanded = expandedId === a.id;
        const itemCount = allCheckItems.filter((c) => c.apparatusId === a.id && c.active).length;
        return (
          <Card key={a.id} withBorder padding="sm" radius="md">
            <Group justify="space-between" mb={isExpanded ? "xs" : 0}>
              <Box
                style={{ cursor: "pointer", flex: 1 }}
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <Group gap="xs">
                  <Text size="sm" fw={600} c={a.active ? undefined : "dimmed"} td={a.active ? undefined : "line-through"}>
                    {a.name}
                  </Text>
                  <Badge size="xs" variant="light" color="gray">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </Badge>
                </Group>
              </Box>
              <Switch checked={a.active} onChange={() => toggleApparatus(a)} size="sm" />
            </Group>
            {isExpanded && (
              <ApparatusCheckItems
                apparatus={a}
                checkItems={allCheckItems}
                getToken={getToken}
                onUpdate={onUpdate}
              />
            )}
          </Card>
        );
      })}

      <Group gap="xs">
        <TextInput
          placeholder="New apparatus name"
          value={apparatusName}
          onChange={(e) => setApparatusName(e.currentTarget.value)}
          size="sm"
          style={{ flex: 1 }}
        />
        <Button size="sm" color="red" onClick={addApparatus} loading={saving}>
          Add Apparatus
        </Button>
      </Group>
    </Stack>
  );
}

export function ApparatusChecksList({
  currentMonth,
  monthChecks,
  history,
  allApparatus,
  allCheckItems,
}: {
  currentMonth: string;
  monthChecks: ApparatusCheckSummary[];
  history: ApparatusCheck[];
  allApparatus: Apparatus[];
  allCheckItems: CheckItem[];
}) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [historyMonth, setHistoryMonth] = useState("all");
  const [historyApparatus, setHistoryApparatus] = useState("all");
  const [search, setSearch] = useState("");

  const memberName = profile?.fullName || user?.email || "";

  async function handleStartCheck(apparatusId: string) {
    const token = await getToken();
    if (!token) return;

    setStartingId(apparatusId);
    try {
      const res = await fetch("/api/apparatus-checks", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ apparatusId, month: currentMonth, memberName }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/members/apparatus-checks/${data.checkId}`);
      } else {
        alert(data.error);
      }
    } finally {
      setStartingId(null);
    }
  }

  // Build history month options
  const historyMonths = (() => {
    const months = new Set<string>();
    for (const h of history) months.add(h.month);
    return [
      { value: "all", label: "All Months" },
      ...[...months].sort().reverse().map((m) => ({ value: m, label: formatMonth(m) })),
    ];
  })();

  const apparatusOptions = [
    { value: "all", label: "All Apparatus" },
    ...allApparatus.filter((a) => a.active).map((a) => ({ value: a.id, label: a.name })),
  ];

  const filteredHistory = history.filter((h) => {
    if (historyMonth !== "all" && h.month !== historyMonth) return false;
    if (historyApparatus !== "all" && h.apparatusId !== historyApparatus) return false;
    if (search) {
      const term = search.toLowerCase();
      if (
        !h.apparatusName.toLowerCase().includes(term) &&
        !h.memberName.toLowerCase().includes(term) &&
        !(h.generalNotes?.toLowerCase().includes(term) ?? false)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      <Tabs defaultValue="current">
        <Tabs.List mb="md">
          <Tabs.Tab value="current">Current Month</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
          {isAdmin && <Tabs.Tab value="settings">Settings</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="current">
          <Text fw={600} mb="md">{formatMonth(currentMonth)}</Text>
          <Stack gap="sm">
            {monthChecks.map((mc) => {
              const isChecked = !!mc.completedAt;
              const inProgress = mc.checkId && !mc.completedAt;
              return (
                <Card key={mc.apparatusId} withBorder padding="sm" radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Box>
                      <Text fw={600} size="sm">{mc.apparatusName}</Text>
                      {mc.memberName && (
                        <Text size="xs" c="dimmed">
                          {isChecked ? "Completed by" : "In progress by"} {mc.memberName}
                        </Text>
                      )}
                    </Box>
                    {isChecked ? (
                      <Badge color="green" variant="light" size="lg">
                        Complete
                      </Badge>
                    ) : inProgress ? (
                      <Button
                        size="compact-sm"
                        color="yellow"
                        variant="light"
                        onClick={() => router.push(`/members/apparatus-checks/${mc.checkId}`)}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        size="compact-sm"
                        color="red"
                        loading={startingId === mc.apparatusId}
                        onClick={() => handleStartCheck(mc.apparatusId)}
                      >
                        Start Check
                      </Button>
                    )}
                  </Group>
                </Card>
              );
            })}
            {monthChecks.length === 0 && (
              <Text c="dimmed" ta="center" py="md">
                No apparatus configured. {isAdmin ? "Add some in Settings." : "Ask an admin to set up apparatus."}
              </Text>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <Stack gap="sm">
            <Group gap="xs" grow>
              <NativeSelect
                data={historyMonths}
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.currentTarget.value)}
                size="sm"
              />
              <NativeSelect
                data={apparatusOptions}
                value={historyApparatus}
                onChange={(e) => setHistoryApparatus(e.currentTarget.value)}
                size="sm"
              />
            </Group>
            {isAdmin && (
              <TextInput
                placeholder="Search by name, member, or notes..."
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                size="sm"
              />
            )}

            {filteredHistory.length === 0 ? (
              <Text c="dimmed" ta="center" py="md">
                No checks found.
              </Text>
            ) : (
              <>
                {/* Mobile */}
                <Box hiddenFrom="sm">
                  <Stack gap="sm">
                    {filteredHistory.map((h) => {
                      const passCount = h.results.filter((r) => r.status === "pass").length;
                      const failCount = h.results.filter((r) => r.status === "fail").length;
                      return (
                        <Card
                          key={h.id}
                          withBorder
                          padding="sm"
                          radius="md"
                          style={{ cursor: "pointer" }}
                          onClick={() => router.push(`/members/apparatus-checks/${h.id}`)}
                        >
                          <Group justify="space-between" mb={4}>
                            <Text fw={600} size="sm">{h.apparatusName}</Text>
                            <Badge
                              color={h.completedAt ? "green" : "yellow"}
                              variant="light"
                              size="sm"
                            >
                              {h.completedAt ? "Complete" : "In Progress"}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {h.startedAt ? formatDate(h.startedAt) : formatMonth(h.month)}
                          </Text>
                          <Text size="xs" c="dimmed">By {h.memberName}</Text>
                          {(passCount > 0 || failCount > 0) && (
                            <Group gap={6} mt={4}>
                              {passCount > 0 && <Badge color="green" variant="light" size="xs">{passCount} pass</Badge>}
                              {failCount > 0 && <Badge color="red" variant="light" size="xs">{failCount} fail</Badge>}
                            </Group>
                          )}
                        </Card>
                      );
                    })}
                  </Stack>
                </Box>

                {/* Desktop */}
                <Box visibleFrom="sm">
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Apparatus</Table.Th>
                        <Table.Th>Checked By</Table.Th>
                        <Table.Th>Results</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredHistory.map((h) => {
                        const passCount = h.results.filter((r) => r.status === "pass").length;
                        const failCount = h.results.filter((r) => r.status === "fail").length;
                        return (
                          <Table.Tr
                            key={h.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => router.push(`/members/apparatus-checks/${h.id}`)}
                          >
                            <Table.Td>{h.startedAt ? formatDate(h.startedAt) : formatMonth(h.month)}</Table.Td>
                            <Table.Td>{h.apparatusName}</Table.Td>
                            <Table.Td>{h.memberName}</Table.Td>
                            <Table.Td>
                              <Group gap={6}>
                                {passCount > 0 && <Badge color="green" variant="light" size="xs">{passCount} pass</Badge>}
                                {failCount > 0 && <Badge color="red" variant="light" size="xs">{failCount} fail</Badge>}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={h.completedAt ? "green" : "yellow"}
                                variant="light"
                                size="sm"
                              >
                                {h.completedAt ? "Complete" : "In Progress"}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Box>
              </>
            )}
          </Stack>
        </Tabs.Panel>

        {isAdmin && (
          <Tabs.Panel value="settings">
            <AdminSettings
              allApparatus={allApparatus}
              allCheckItems={allCheckItems}
              getToken={getToken}
              onUpdate={() => router.refresh()}
            />
          </Tabs.Panel>
        )}
      </Tabs>

      <Modal opened={settingsOpened} onClose={closeSettings} title="Settings" size="md">
        <AdminSettings
          allApparatus={allApparatus}
          allCheckItems={allCheckItems}
          getToken={getToken}
          onUpdate={() => {
            closeSettings();
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
