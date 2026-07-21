"use client";

import { useEffect, useState } from "react";
import { Button, Group, Modal, Select, Stack, Textarea } from "@mantine/core";
import { STATIONS } from "@/lib/stations";
import type { StationMaintenanceLog } from "@/lib/station-maintenance";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  title: string;
  initialData?: StationMaintenanceLog;
};

export function StationMaintenanceModal({
  opened,
  onClose,
  onSave,
  title,
  initialData,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [station, setStation] = useState<string | null>(null);
  const [workDone, setWorkDone] = useState("");

  useEffect(() => {
    if (!opened) return;
    setStation(initialData?.station ?? null);
    setWorkDone(initialData?.workDone ?? "");
  }, [opened, initialData]);

  const canSave = !!station && workDone.trim().length > 0;

  async function handleSubmit() {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ station, workDone: workDone.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <Stack gap="sm">
        <Select
          label="Station"
          placeholder="Select station"
          data={STATIONS}
          value={station}
          onChange={setStation}
          required
        />
        <Textarea
          label="Work Done"
          placeholder="Describe the maintenance or repair performed..."
          value={workDone}
          onChange={(e) => setWorkDone(e.currentTarget.value)}
          minRows={4}
          autosize
          required
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleSubmit} loading={saving} disabled={!canSave}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
