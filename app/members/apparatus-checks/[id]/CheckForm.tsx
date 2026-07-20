"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useAuth } from "@/app/components/auth/AuthProvider";
import type { ApparatusCheck, CheckResult } from "@/lib/apparatus";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const d = new Date(Number(year), Number(m) - 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Results arrive ordered with each header's subitems directly after it, so
// grouping consecutive runs by parent is enough to rebuild the sections.
function groupResults(results: CheckResult[]) {
  const groups: { key: string; header: string | null; items: CheckResult[] }[] = [];
  for (const result of results) {
    const last = groups[groups.length - 1];
    if (last && last.key === (result.parentId ?? "__top")) {
      last.items.push(result);
    } else {
      groups.push({
        key: result.parentId ?? "__top",
        header: result.parentId ? result.parentLabel : null,
        items: [result],
      });
    }
  }
  return groups;
}

export function CheckForm({ check }: { check: ApparatusCheck }) {
  const { user, profile, getToken, isAdmin } = useAuth();
  const router = useRouter();
  const isCompleted = !!check.completedAt;

  // Only the member who started the check (or an admin) may fill it out. Others
  // get a read-only view. Server-side checks enforce this too.
  const memberName = profile?.fullName || user?.email || "";
  const canEdit = isAdmin || memberName === check.memberName;
  const readOnly = isCompleted || !canEdit;

  const [results, setResults] = useState(
    check.results.map((r) => ({ ...r }))
  );
  const [generalNotes, setGeneralNotes] = useState(check.generalNotes ?? "");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleStatus(result: CheckResult, status: "pass" | "fail") {
    const token = await getToken();
    if (!token || readOnly) return;

    // Toggle off if same status clicked again
    const newStatus = result.status === status ? null : status;
    setResults((prev) =>
      prev.map((r) =>
        r.id === result.id ? { ...r, status: newStatus, checked: newStatus === "pass" } : r
      )
    );

    setSavingIds((prev) => new Set(prev).add(result.id));
    try {
      await fetch(`/api/apparatus-checks/${check.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateResult",
          resultId: result.id,
          checked: newStatus === "pass",
          status: newStatus,
          notes: result.notes,
        }),
      });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(result.id);
        return next;
      });
    }
  }

  async function handleSaveNotes(resultId: string) {
    const result = results.find((r) => r.id === resultId);
    const token = await getToken();
    if (!token || !result || readOnly) return;

    setSavingIds((prev) => new Set(prev).add(result.id));
    try {
      await fetch(`/api/apparatus-checks/${check.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateResult",
          resultId: result.id,
          checked: result.checked,
          status: result.status,
          notes: result.notes,
        }),
      });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(result.id);
        return next;
      });
    }
  }

  async function handleComplete() {
    const token = await getToken();
    if (!token || !canEdit) return;

    setCompleting(true);
    try {
      await fetch(`/api/apparatus-checks/${check.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", generalNotes }),
      });
      router.push("/members/apparatus-checks");
      router.refresh();
    } finally {
      setCompleting(false);
    }
  }

  async function handleCancel() {
    if (!canEdit) return;
    if (!confirm("Cancel this check? All progress will be lost.")) return;
    const token = await getToken();
    if (!token) return;

    setCancelling(true);
    try {
      await fetch(`/api/apparatus-checks/${check.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      router.push("/members/apparatus-checks");
      router.refresh();
    } finally {
      setCancelling(false);
    }
  }

  async function handleReset() {
    if (
      !confirm(
        "Reset this check? Every pass/fail, item note and the general notes will be cleared so it can be redone."
      )
    ) {
      return;
    }
    const token = await getToken();
    if (!token) return;

    setResetting(true);
    try {
      const res = await fetch(`/api/apparatus-checks/${check.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (!res.ok) {
        alert("Could not reset this check.");
        return;
      }
      // Clear the local copy too — this component seeds its state from props
      // once, so refresh() alone would leave the old answers on screen.
      setResults((prev) =>
        prev.map((r) => ({ ...r, status: null, checked: false, notes: null }))
      );
      setGeneralNotes("");
      router.refresh();
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this check? It will be removed from history and this apparatus can be checked again for the month."
      )
    ) {
      return;
    }
    const token = await getToken();
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/apparatus-checks/${check.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      if (!res.ok) {
        alert("Could not delete this check.");
        return;
      }
      router.push("/members/apparatus-checks");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const groups = groupResults(results);
  const answeredCount = results.filter((r) => r.status !== null).length;
  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const allAnswered = answeredCount === results.length;

  return (
    <Stack gap="md">
      <Box>
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2}>{check.apparatusName}</Title>
            <Text size="sm" c="dimmed">
              {check.startedAt
                ? new Date(check.startedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "America/Chicago",
                  })
                : formatMonth(check.month)}
            </Text>
            <Text size="sm" c="dimmed">Checked by {check.memberName}</Text>
          </Box>
          {isCompleted ? (
            <Badge color="green" variant="light" size="lg">Complete</Badge>
          ) : (
            <Badge color="yellow" variant="light" size="lg">In Progress</Badge>
          )}
        </Group>
      </Box>

      {!isCompleted && !canEdit && (
        <Alert color="yellow" variant="light">
          This check is in progress by {check.memberName}. Only they or an admin
          can fill it out.
        </Alert>
      )}

      <Group gap="xs">
        <Text size="sm" fw={600}>
          Checklist ({answeredCount}/{results.length})
        </Text>
        {passCount > 0 && <Badge color="green" variant="light" size="sm">{passCount} pass</Badge>}
        {failCount > 0 && <Badge color="red" variant="light" size="sm">{failCount} fail</Badge>}
      </Group>

      <Stack gap="xs">
        {groups.map((group) => (
          <Box key={group.key}>
            {group.header && (
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={6} mt={4}>
                {group.header}
              </Text>
            )}
            <Stack gap="xs" pl={group.header ? "md" : 0}>
              {group.items.map((result) => (
                <Card key={result.id} withBorder padding="sm" radius="md">
                  <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {result.label}
                      </Text>
                      {(result.notes || !readOnly) && (
                        <Textarea
                          placeholder="Notes..."
                          value={result.notes ?? ""}
                          onChange={(e) => {
                            if (readOnly) return;
                            const val = e.currentTarget.value;
                            setResults((prev) =>
                              prev.map((r) => (r.id === result.id ? { ...r, notes: val } : r))
                            );
                          }}
                          onBlur={() => handleSaveNotes(result.id)}
                          disabled={readOnly}
                          size="xs"
                          mt={4}
                          minRows={1}
                          autosize
                        />
                      )}
                    </Box>
                    <Group gap={4} wrap="nowrap" mt={2}>
                      <Button
                        size="compact-sm"
                        variant={result.status === "pass" ? "filled" : "light"}
                        color="green"
                        onClick={() => handleStatus(result, "pass")}
                        disabled={readOnly}
                      >
                        Pass
                      </Button>
                      <Button
                        size="compact-sm"
                        variant={result.status === "fail" ? "filled" : "light"}
                        color="red"
                        onClick={() => handleStatus(result, "fail")}
                        disabled={readOnly}
                      >
                        Fail
                      </Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      <Box>
        <Text size="sm" fw={600} mb="xs">General Notes / Findings</Text>
        <Textarea
          placeholder="Any additional observations..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.currentTarget.value)}
          disabled={readOnly}
          minRows={3}
          autosize
        />
      </Box>

      {!isCompleted && canEdit && (
        <>
          <Button
            color="green"
            fullWidth
            size="md"
            onClick={handleComplete}
            loading={completing}
            disabled={!allAnswered}
          >
            {!allAnswered
              ? `Complete Check (${results.length - answeredCount} items remaining)`
              : "Complete Check"}
          </Button>
          <Button
            variant="subtle"
            color="red"
            fullWidth
            onClick={handleCancel}
            loading={cancelling}
          >
            Cancel Check
          </Button>
        </>
      )}

      {isCompleted && isAdmin && (
        <Card withBorder padding="sm" radius="md">
          <Text size="sm" fw={600} mb={4}>
            Admin
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Reset reopens this check with every answer cleared. Delete removes it
            from history and frees the month so it can be started over.
          </Text>
          <Group grow>
            <Button
              variant="light"
              color="yellow"
              onClick={handleReset}
              loading={resetting}
            >
              Reset Check
            </Button>
            <Button
              variant="light"
              color="red"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete Check
            </Button>
          </Group>
        </Card>
      )}

      <Button
        variant="subtle"
        color="gray"
        fullWidth
        onClick={() => router.push("/members/apparatus-checks")}
      >
        Back to Apparatus Checks
      </Button>
    </Stack>
  );
}
