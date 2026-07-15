"use client";

import { useState } from "react";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import type { RunLogEntry } from "@/lib/notion";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void | Promise<void>;
  title: string;
  initialData?: RunLogEntry;
};

export function RunModal({ opened, onClose, onSave, title, initialData }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => getDefaults(initialData));

  // Reset form when modal opens with new data
  const [lastId, setLastId] = useState<string | undefined>();
  if (opened && initialData?.id !== lastId) {
    setLastId(initialData?.id);
    setForm(getDefaults(initialData));
  }
  if (!opened && lastId !== undefined) {
    setLastId(undefined);
  }

  function getDefaults(data?: RunLogEntry) {
    return {
      date: data?.date ?? "",
      address: data?.address ?? "",
      callType: data?.callType ?? "",
      complaint: data?.complaint ?? "",
      response: data?.response ?? "",
      mutualAid: data?.mutualAid ?? "",
    };
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <Stack gap="sm">
        <TextInput
          label="Date/Time"
          placeholder="2026-07-15T14:30"
          value={form.date}
          onChange={(e) => handleChange("date", e.currentTarget.value)}
        />
        <TextInput
          label="Address"
          placeholder="123 Main St"
          value={form.address}
          onChange={(e) => handleChange("address", e.currentTarget.value)}
        />
        <TextInput
          label="Call Type"
          placeholder="Fire, Medical, MVC"
          value={form.callType}
          onChange={(e) => handleChange("callType", e.currentTarget.value)}
        />
        <TextInput
          label="Complaint"
          placeholder="Structure fire, Chest pain, etc."
          value={form.complaint}
          onChange={(e) => handleChange("complaint", e.currentTarget.value)}
        />
        <TextInput
          label="Response"
          placeholder="Response type"
          value={form.response}
          onChange={(e) => handleChange("response", e.currentTarget.value)}
        />
        <TextInput
          label="Mutual Aid"
          placeholder="Department name (if applicable)"
          value={form.mutualAid}
          onChange={(e) => handleChange("mutualAid", e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleSubmit} loading={saving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
