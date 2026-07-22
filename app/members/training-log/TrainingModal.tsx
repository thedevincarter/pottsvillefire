"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Radio,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
} from "@mantine/core";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DateTimeField } from "@/app/components/DateTimeField";
import type { TrainingEntry, TrainingFormOptions } from "@/lib/trainings";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Chicago";

// Central date <-> ISO helpers, matching what DateTimeField keeps in state.
function toDateString(isoDate: string): string {
  return dayjs.tz(isoDate, TZ).format("YYYY-MM-DD HH:mm:ss");
}

function toISOCentral(dateStr: string): string {
  return dayjs.tz(dateStr, TZ).format("YYYY-MM-DDTHH:mm:ssZ");
}

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  title: string;
  initialData?: TrainingEntry;
  options: TrainingFormOptions;
};

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
  const [totalHours, setTotalHours] = useState<number | string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [automaticAid, setAutomaticAid] = useState(false);
  const [dayNight, setDayNight] = useState<string | null>(null);
  const [subGroups, setSubGroups] = useState<string[]>([]);
  const [instructors, setInstructors] = useState("");
  const [additionalDepartments, setAdditionalDepartments] = useState("");
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);

  // Sync the form each time the modal opens: populate from initialData when
  // editing, otherwise start blank. (Same pattern as the run-log modal.)
  useEffect(() => {
    if (!opened) return;
    setDate(initialData?.date ? toDateString(initialData.date) : null);
    setTotalHours(initialData?.totalHours ?? "");
    setSubjects(initialData?.subjects ?? []);
    setAutomaticAid(initialData?.automaticAid ?? false);
    setDayNight(initialData?.dayNight ?? null);
    setSubGroups(initialData?.subGroups ?? []);
    setInstructors(initialData?.instructors ?? "");
    setAdditionalDepartments(initialData?.additionalDepartments ?? "");
    setNotes(initialData?.notes ?? "");
    setAttendees(initialData?.attendees ?? []);
  }, [opened, initialData]);

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave({
        date: date ? toISOCentral(date) : "",
        totalHours: totalHours === "" ? null : totalHours,
        subjects,
        automaticAid,
        dayNight,
        subGroups,
        instructors,
        additionalDepartments,
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
        <DateTimeField value={date} onChange={setDate} />
        <NumberInput
          label="Total Hours"
          placeholder="0"
          value={totalHours}
          onChange={setTotalHours}
          min={0}
          step={0.5}
          decimalScale={2}
          allowNegative={false}
        />
        <TagsInput
          label="Subject"
          placeholder="Select or type to add"
          data={options.subjects}
          value={subjects}
          onChange={setSubjects}
          clearable
        />
        <Checkbox
          label="Automatic aid"
          checked={automaticAid}
          onChange={(e) => setAutomaticAid(e.currentTarget.checked)}
        />
        <Radio.Group label="Day / Night" value={dayNight} onChange={setDayNight}>
          <Group gap="lg" mt={4}>
            <Radio value="Day" label="Day" />
            <Radio value="Night" label="Night" />
          </Group>
        </Radio.Group>
        <TagsInput
          label="Sub-Group"
          placeholder="Select or type to add"
          data={options.subGroups}
          value={subGroups}
          onChange={setSubGroups}
          clearable
        />
        <TextInput
          label="Instructors"
          placeholder="Names of instructors"
          value={instructors}
          onChange={(e) => setInstructors(e.currentTarget.value)}
        />
        <TextInput
          label="Additional Departments"
          placeholder="Other departments involved"
          value={additionalDepartments}
          onChange={(e) => setAdditionalDepartments(e.currentTarget.value)}
        />
        <MultiSelect
          label="Members Attended"
          placeholder="Select members"
          data={[...new Set([...options.memberNames, ...attendees])]}
          value={attendees}
          onChange={setAttendees}
          searchable={false}
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
