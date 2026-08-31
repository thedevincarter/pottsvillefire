"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ActionIcon,
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
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import type { ApparatusCheck, ApparatusCheckSummary, Apparatus, CheckItem } from "@/lib/apparatus";
import type { OpenCheckMonth } from "@/lib/check-months";

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
  const [subParentId, setSubParentId] = useState<string | null>(null);
  const [subLabel, setSubLabel] = useState("");
  const [savingSub, setSavingSub] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const items = checkItems.filter((c) => c.apparatusId === apparatus.id);
  const topLevel = items.filter((c) => !c.parentId);
  const childrenOf = (id: string) => items.filter((c) => c.parentId === id);

  async function addItem() {
    const token = await getToken();
    if (!token || !newLabel.trim()) return;
    setSaving(true);
    await fetch("/api/admin/check-items", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ apparatusId: apparatus.id, label: newLabel.trim(), sortOrder: topLevel.length }),
    });
    setNewLabel("");
    setSaving(false);
    onUpdate();
  }

  async function addSubItem(parent: CheckItem) {
    const token = await getToken();
    if (!token || !subLabel.trim()) return;
    setSavingSub(true);
    await fetch("/api/admin/check-items", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        apparatusId: apparatus.id,
        label: subLabel.trim(),
        sortOrder: childrenOf(parent.id).length,
        parentId: parent.id,
      }),
    });
    setSubLabel("");
    setSavingSub(false);
    setSubParentId(null);
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

  async function deleteItem(c: CheckItem) {
    const isSection = childrenOf(c.id).length > 0;
    const message = isSection
      ? `Delete "${c.label}" and its subitems? This can't be undone.`
      : `Delete "${c.label}"? This can't be undone.`;
    if (!confirm(message)) return;

    const token = await getToken();
    if (!token) return;
    setDeletingId(c.id);
    try {
      const res = await fetch("/api/admin/check-items", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Could not delete this item.");
        return;
      }
      onUpdate();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Stack gap="xs">
      {topLevel.length === 0 && (
        <Text size="xs" c="dimmed">No checklist items yet.</Text>
      )}
      {topLevel.map((c) => {
        const subItems = childrenOf(c.id);
        // An item with subitems is a section header on the check form — the
        // subitems are what get passed or failed.
        const isHeader = subItems.length > 0;
        return (
          <Stack key={c.id} gap={4}>
            <Group justify="space-between" pl="sm" wrap="nowrap">
              <Group gap={6} wrap="nowrap">
                <Text size="sm" c={c.active ? undefined : "dimmed"} td={c.active ? undefined : "line-through"}>
                  {c.label}
                </Text>
                {isHeader && (
                  <Badge size="xs" variant="light" color="gray">
                    section
                  </Badge>
                )}
              </Group>
              <Group gap={4} wrap="nowrap">
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    setSubLabel("");
                    setSubParentId(subParentId === c.id ? null : c.id);
                  }}
                >
                  + Sub
                </Button>
                <Switch checked={c.active} onChange={() => toggleItem(c)} size="sm" />
                <Tooltip label="Delete item">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    loading={deletingId === c.id}
                    onClick={() => deleteItem(c)}
                    aria-label="Delete item"
                  >
                    {"✕"}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            {subItems.map((s) => (
              <Group key={s.id} justify="space-between" pl="xl" wrap="nowrap">
                <Text size="xs" c="dimmed" td={s.active ? undefined : "line-through"}>
                  {s.label}
                </Text>
                <Group gap={4} wrap="nowrap">
                  <Switch checked={s.active} onChange={() => toggleItem(s)} size="xs" />
                  <Tooltip label="Delete subitem">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      loading={deletingId === s.id}
                      onClick={() => deleteItem(s)}
                      aria-label="Delete subitem"
                    >
                      {"✕"}
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            ))}

            {subParentId === c.id && (
              <Group gap="xs" pl="xl">
                <TextInput
                  placeholder={`New subitem under "${c.label}"`}
                  value={subLabel}
                  onChange={(e) => setSubLabel(e.currentTarget.value)}
                  size="xs"
                  style={{ flex: 1 }}
                />
                <Button size="compact-sm" color="red" onClick={() => addSubItem(c)} loading={savingSub}>
                  Add
                </Button>
              </Group>
            )}
          </Stack>
        );
      })}
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

// One month's apparatus cards. Rendered once for the current month, and again
// for next month when an admin has opened it early.
function MonthChecks({
  month,
  checks,
  early,
  isAdmin,
  startingKey,
  onStart,
}: {
  month: string;
  checks: ApparatusCheckSummary[];
  early?: boolean;
  isAdmin: boolean;
  startingKey: string | null;
  onStart: (month: string, apparatusId: string) => void;
}) {
  const router = useRouter();

  return (
    <Box>
      <Group gap="xs" mb="md">
        <Text fw={600}>{formatMonth(month)}</Text>
        {early && (
          <Badge color="blue" variant="light" size="sm">
            Opened early
          </Badge>
        )}
      </Group>
      <Stack gap="sm">
        {checks.map((mc) => {
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
                  <Group gap="xs" wrap="nowrap">
                    <Badge color="green" variant="light" size="lg">
                      Complete
                    </Badge>
                    {isAdmin && (
                      <Button
                        component={Link}
                        href={`/members/apparatus-checks/${mc.checkId}/print`}
                        size="compact-sm"
                        variant="light"
                        color="gray"
                      >
                        Print
                      </Button>
                    )}
                  </Group>
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
                    loading={startingKey === `${month}:${mc.apparatusId}`}
                    onClick={() => onStart(month, mc.apparatusId)}
                  >
                    Start Check
                  </Button>
                )}
              </Group>
            </Card>
          );
        })}
        {checks.length === 0 && (
          <Text c="dimmed" ta="center" py="md">
            No apparatus configured. {isAdmin ? "Add some in Settings." : "Ask an admin to set up apparatus."}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

// Admins can open next month's checks before the 1st — for the months where
// check night lands before the month starts, like a holiday first Monday.
function NextMonthControl({
  nextMonth,
  open,
  hasChecks,
  getToken,
}: {
  nextMonth: string;
  open: OpenCheckMonth | null;
  hasChecks: boolean;
  getToken: () => Promise<string | null>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const opening = !open;
    if (
      !opening &&
      !confirm(
        `Close ${formatMonth(nextMonth)} checks?` +
          (hasChecks
            ? " Checks already started stay saved, but no new ones can be started until the month arrives."
            : " Members won't be able to start them until the month arrives.")
      )
    ) {
      return;
    }

    const token = await getToken();
    if (!token) return;

    setBusy(true);
    try {
      const res = await fetch("/api/check-months", {
        method: opening ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ month: nextMonth }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? `Could not ${opening ? "open" : "close"} that month.`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Box>
          <Text size="sm" fw={600}>Next month</Text>
          <Text size="xs" c="dimmed">
            {open
              ? `${formatMonth(nextMonth)} checks are open early — opened by ${open.openedBy} on ${formatDate(open.openedAt)}.`
              : `${formatMonth(nextMonth)} checks open on the 1st. Open them early if check night falls before then.`}
          </Text>
        </Box>
        <Button
          size="compact-sm"
          variant="light"
          color={open ? "gray" : "red"}
          loading={busy}
          onClick={toggle}
        >
          {open ? "Close" : "Open Early"}
        </Button>
      </Group>
    </Card>
  );
}

export function ApparatusChecksList({
  currentMonth,
  monthChecks,
  nextMonth,
  nextMonthOpen,
  nextMonthChecks,
  history,
  allApparatus,
  allCheckItems,
}: {
  currentMonth: string;
  monthChecks: ApparatusCheckSummary[];
  nextMonth: string;
  nextMonthOpen: OpenCheckMonth | null;
  nextMonthChecks: ApparatusCheckSummary[];
  history: ApparatusCheck[];
  allApparatus: Apparatus[];
  allCheckItems: CheckItem[];
}) {
  const { user, profile, isAdmin, getToken } = useAuth();
  const router = useRouter();
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [historyMonth, setHistoryMonth] = useState("all");
  const [historyApparatus, setHistoryApparatus] = useState("all");
  const [search, setSearch] = useState("");

  const memberName = profile?.fullName || user?.email || "";

  async function handleStartCheck(month: string, apparatusId: string) {
    const token = await getToken();
    if (!token) return;

    setStartingKey(`${month}:${apparatusId}`);
    try {
      const res = await fetch("/api/apparatus-checks", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ apparatusId, month, memberName }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/members/apparatus-checks/${data.checkId}`);
      } else {
        alert(data.error);
      }
    } finally {
      setStartingKey(null);
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
          <Stack gap="lg">
            {nextMonthOpen && (
              <MonthChecks
                month={nextMonth}
                checks={nextMonthChecks}
                early
                isAdmin={isAdmin}
                startingKey={startingKey}
                onStart={handleStartCheck}
              />
            )}
            <MonthChecks
              month={currentMonth}
              checks={monthChecks}
              isAdmin={isAdmin}
              startingKey={startingKey}
              onStart={handleStartCheck}
            />
            {isAdmin && (
              <NextMonthControl
                nextMonth={nextMonth}
                open={nextMonthOpen}
                hasChecks={nextMonthChecks.some((c) => c.checkId)}
                getToken={getToken}
              />
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
                          {isAdmin && h.completedAt && (
                            <Button
                              component={Link}
                              href={`/members/apparatus-checks/${h.id}/print`}
                              size="compact-xs"
                              variant="light"
                              color="gray"
                              mt="xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Print
                            </Button>
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
                        {isAdmin && <Table.Th />}
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
                            {isAdmin && (
                              <Table.Td>
                                {h.completedAt && (
                                  <Button
                                    component={Link}
                                    href={`/members/apparatus-checks/${h.id}/print`}
                                    size="compact-xs"
                                    variant="light"
                                    color="gray"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Print
                                  </Button>
                                )}
                              </Table.Td>
                            )}
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
