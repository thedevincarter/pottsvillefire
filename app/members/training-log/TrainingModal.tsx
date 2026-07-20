"use client";

import { useEffect, useState } from "react";
import { Button, Group, Modal, Stack, TagsInput, Textarea } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { CreatableSelect } from "@/app/components/CreatableSelect";
import type { TrainingEntry, TrainingFormOptions } from "@/lib/trainings";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Chicago";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  title: string;
  initialData?: TrainingEntry;
  options: TrainingFormOptions;
};

function toDateString(isoDate: string | null): string | null {
  if (!isoDate) return null;
  return dayjs.tz(isoDate, TZ).format("YYYY-MM-DD HH:mm:ss");
}

function toISOCentral(dateStr: string | null): string {
  if (!dateStr) return "";
  return dayjs.tz(dateStr, TZ).format("YYYY-MM-DDTHH:mm:ssZ");
}

export function TrainingModal({
  opened,
  onClose,
  onSave,
  title,
  initialData,
  options,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);

  // Sync the form each time the modal opens: populate from initialData when
  // editing, otherwise start blank. (Same pattern as the run-log modal.)
  useEffect(() => {
    if (!opened) return;
    setDate(toDateString(initialData?.date ?? null));
    setType(initialData?.type ?? null);
    setNotes(initialData?.notes ?? "");
    setAttendees(initialData?.attendees ?? []);
  }, [opened, initialData]);

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave({
        date: toISOCentral(date),
        type: type ?? "",
        notes,
        attendees,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <Stack gap="sm">
        <DateTimePicker
          label="Date / Time (Central)"
          placeholder="Select date and time"
          value={date}
          onChange={setDate}
          clearable
          valueFormat="MM/DD/YYYY HH:mm"
        />
        <CreatableSelect
          label="Training Type"
          placeholder="Select or type to create"
          data={options.types}
          value={type}
          onChange={setType}
          clearable
        />
        <TagsInput
          label="Members Attended"
          placeholder="Select or add members"
          data={options.memberNames}
          value={attendees}
          onChange={setAttendees}
          clearable
        />
        <Textarea
          label="Notes"
          placeholder="Details about the training..."
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={3}
          autosize
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
