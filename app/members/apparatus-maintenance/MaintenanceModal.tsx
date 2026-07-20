"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
} from "@mantine/core";
import type { MaintenanceLog } from "@/lib/maintenance";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  title: string;
  initialData?: MaintenanceLog;
  apparatusOptions: { value: string; label: string }[];
};

export function MaintenanceModal({
  opened,
  onClose,
  onSave,
  title,
  initialData,
  apparatusOptions,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [apparatusId, setApparatusId] = useState<string | null>(null);
  const [mileage, setMileage] = useState<number | string>("");
  const [workDone, setWorkDone] = useState("");

  // Sync the form each time the modal opens: populate from initialData when
  // editing, otherwise start blank. (Same pattern as the run-log modal.)
  useEffect(() => {
    if (!opened) return;
    setApparatusId(initialData?.apparatusId ?? null);
    setMileage(initialData?.mileage ?? "");
    setWorkDone(initialData?.workDone ?? "");
  }, [opened, initialData]);

  const canSave = !!apparatusId && workDone.trim().length > 0;

  async function handleSubmit() {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        apparatusId,
        mileage: mileage === "" ? null : mileage,
        workDone: workDone.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <Stack gap="sm">
        <Select
          label="Apparatus"
          placeholder="Select apparatus"
          data={apparatusOptions}
          value={apparatusId}
          onChange={setApparatusId}
          searchable
          required
        />
        <NumberInput
          label="Mileage"
          placeholder="Current mileage"
          value={mileage}
          onChange={setMileage}
          min={0}
          thousandSeparator=","
          allowNegative={false}
          allowDecimal={false}
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
