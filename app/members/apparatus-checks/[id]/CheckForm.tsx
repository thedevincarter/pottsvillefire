"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
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
import type { ApparatusCheck } from "@/lib/apparatus";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const d = new Date(Number(year), Number(m) - 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function CheckForm({ check }: { check: ApparatusCheck }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const isCompleted = !!check.completedAt;

  const [results, setResults] = useState(
    check.results.map((r) => ({ ...r }))
  );
  const [generalNotes, setGeneralNotes] = useState(check.generalNotes ?? "");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleStatus(index: number, status: "pass" | "fail") {
    const result = results[index];
    const token = await getToken();
    if (!token || isCompleted) return;

    // Toggle off if same status clicked again
    const newStatus = result.status === status ? null : status;
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, status: newStatus, checked: newStatus === "pass" } : r))
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

  async function handleSaveNotes(index: number) {
    const result = results[index];
    const token = await getToken();
    if (!token || isCompleted) return;

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
    if (!token) return;

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

      <Group gap="xs">
        <Text size="sm" fw={600}>
          Checklist ({answeredCount}/{results.length})
        </Text>
        {passCount > 0 && <Badge color="green" variant="light" size="sm">{passCount} pass</Badge>}
        {failCount > 0 && <Badge color="red" variant="light" size="sm">{failCount} fail</Badge>}
      </Group>

      <Stack gap="xs">
        {results.map((result, index) => (
          <Card key={result.id} withBorder padding="sm" radius="md">
            <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {result.label}
                </Text>
                {(result.notes || !isCompleted) && (
                  <Textarea
                    placeholder="Notes..."
                    value={result.notes ?? ""}
                    onChange={(e) => {
                      if (isCompleted) return;
                      const val = e.currentTarget.value;
                      setResults((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, notes: val } : r))
                      );
                    }}
                    onBlur={() => handleSaveNotes(index)}
                    disabled={isCompleted}
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
                  onClick={() => handleStatus(index, "pass")}
                  disabled={isCompleted}
                >
                  Pass
                </Button>
                <Button
                  size="compact-sm"
                  variant={result.status === "fail" ? "filled" : "light"}
                  color="red"
                  onClick={() => handleStatus(index, "fail")}
                  disabled={isCompleted}
                >
                  Fail
                </Button>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>

      <Box>
        <Text size="sm" fw={600} mb="xs">General Notes / Findings</Text>
        <Textarea
          placeholder="Any additional observations..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.currentTarget.value)}
          disabled={isCompleted}
          minRows={3}
          autosize
        />
      </Box>

      {!isCompleted && (
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
