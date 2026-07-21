"use client";

import { useEffect, useState } from "react";
import { Button, Group, Modal, Select, Stack, Textarea } from "@mantine/core";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: { targetValue: string; description: string }) => void | Promise<void>;
  title: string;
  targetLabel: string; // "Apparatus" | "Station"
  targetOptions: { value: string; label: string }[];
  initialData?: { targetValue: string | null; description: string };
  submitLabel?: string;
};

export function RequestModal({
  opened,
  onClose,
  onSave,
  title,
  targetLabel,
  targetOptions,
  initialData,
  submitLabel = "Submit",
}: Props) {
  const [saving, setSaving] = useState(false);
  const [targetValue, setTargetValue] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!opened) return;
    setTargetValue(initialData?.targetValue ?? null);
    setDescription(initialData?.description ?? "");
  }, [opened, initialData]);

  const canSave = !!targetValue && description.trim().length > 0;

  async function handleSubmit() {
    if (!canSave || !targetValue) return;
    setSaving(true);
    try {
      await onSave({ targetValue, description: description.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <Stack gap="sm">
        <Select
          label={targetLabel}
          placeholder={`Select ${targetLabel.toLowerCase()}`}
          data={targetOptions}
          value={targetValue}
          onChange={setTargetValue}
          searchable
          required
        />
        <Textarea
          label="Issue / request"
          placeholder="Describe the issue that needs to be addressed..."
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={4}
          autosize
          required
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleSubmit} loading={saving} disabled={!canSave}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
