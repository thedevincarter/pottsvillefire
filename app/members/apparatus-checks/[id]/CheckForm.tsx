"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
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

  async function handleToggle(index: number) {
    const result = results[index];
    const token = await getToken();
    if (!token || isCompleted) return;

    const newChecked = !result.checked;
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, checked: newChecked } : r))
    );

    setSavingIds((prev) => new Set(prev).add(result.id));
    try {
      await fetch(`/api/apparatus-checks/${check.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateResult",
          resultId: result.id,
          checked: newChecked,
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

  const checkedCount = results.filter((r) => r.checked).length;

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

      <Text size="sm" fw={600}>
        Checklist ({checkedCount}/{results.length})
      </Text>

      <Stack gap="xs">
        {results.map((result, index) => (
          <Card key={result.id} withBorder padding="sm" radius="md">
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Checkbox
                checked={result.checked}
                onChange={() => handleToggle(index)}
                disabled={isCompleted}
                mt={2}
              />
              <Box style={{ flex: 1 }}>
                <Text
                  size="sm"
                  fw={500}
                  td={result.checked ? "line-through" : undefined}
                  c={result.checked ? "dimmed" : undefined}
                >
                  {result.label}
                </Text>
                {(result.notes || !isCompleted) && (
                  <Textarea
                    placeholder="Notes for this item..."
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
            disabled={checkedCount < results.length}
          >
            {checkedCount < results.length
              ? `Complete Check (${results.length - checkedCount} items remaining)`
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
