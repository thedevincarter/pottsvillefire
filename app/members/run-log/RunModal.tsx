"use client";

import { useState } from "react";
import { Button, Group, Modal, Stack, TagsInput, TextInput } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { CreatableSelect } from "@/app/components/CreatableSelect";
import type { RunLogEntry, RunFormOptions } from "@/lib/runs";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Chicago";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  title: string;
  initialData?: RunLogEntry;
  options: RunFormOptions;
};

function toDateString(isoDate: string | null): string | null {
  if (!isoDate) return null;
  return dayjs.tz(isoDate, TZ).format("YYYY-MM-DD HH:mm:ss");
}

function toISOCentral(dateStr: string | null): string {
  if (!dateStr) return "";
  return dayjs.tz(dateStr, TZ).format("YYYY-MM-DDTHH:mm:ssZ");
}

export function RunModal({
  opened,
  onClose,
  onSave,
  title,
  initialData,
  options,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [callType, setCallType] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<string | null>(null);
  const [mutualAid, setMutualAid] = useState<string | null>(null);
  const [respondingMembers, setRespondingMembers] = useState<string[]>([]);

  // Reset form when modal opens with new data
  const [lastId, setLastId] = useState<string | undefined>();
  if (opened && initialData?.id !== lastId) {
    setLastId(initialData?.id);
    setDate(toDateString(initialData?.date ?? null));
    setAddress(initialData?.address ?? "");
    setCallType(initialData?.callType ?? null);
    setComplaint(initialData?.complaint ?? null);
    setMutualAid(initialData?.mutualAid ?? null);
    setRespondingMembers(initialData?.respondedMembers ?? []);
  }
  if (opened && !initialData && lastId !== undefined) {
    setLastId(undefined);
    setDate(null);
    setAddress("");
    setCallType(null);
    setComplaint(null);
    setMutualAid(null);
    setRespondingMembers([]);
  }
  if (!opened && lastId !== undefined) {
    setLastId(undefined);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave({
        date: toISOCentral(date),
        address,
        callType: callType ?? "",
        complaint: complaint ?? "",
        mutualAid: mutualAid ?? "",
        respondingMembers,
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
        <TextInput
          label="Address"
          placeholder="123 Main St"
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
        />
        <CreatableSelect
          label="Call Type"
          placeholder="Select or type to create"
          data={options.callTypes}
          value={callType}
          onChange={setCallType}
          clearable
        />
        <CreatableSelect
          label="Complaint"
          placeholder="Select or type to create"
          data={options.complaints}
          value={complaint}
          onChange={setComplaint}
          clearable
        />
        <CreatableSelect
          label="Mutual Aid"
          placeholder="Select or type to create"
          data={options.mutualAidDepts}
          value={mutualAid}
          onChange={setMutualAid}
          clearable
        />
        <TagsInput
          label="Responding Members"
          placeholder="Select or add members"
          data={options.memberNames}
          value={respondingMembers}
          onChange={setRespondingMembers}
          clearable
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
