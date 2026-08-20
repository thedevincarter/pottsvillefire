"use client";

import { useEffect, useState } from "react";
import { Button, Group, Modal, MultiSelect, Stack, TextInput } from "@mantine/core";
import { CreatableSelect } from "@/app/components/CreatableSelect";
import {
  DateTimeField,
  centralToISO,
  isoToCentral,
} from "@/app/components/DateTimeField";
import type { RunLogEntry, RunFormOptions } from "@/lib/runs";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  title: string;
  initialData?: RunLogEntry;
  options: RunFormOptions;
};

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

  // Sync the form each time the modal opens: populate from initialData when
  // editing, otherwise start blank. Resetting on open rather than on close
  // avoids wiping the fields mid close-animation.
  useEffect(() => {
    if (!opened) return;
    setDate(isoToCentral(initialData?.date ?? null));
    setAddress(initialData?.address ?? "");
    setCallType(initialData?.callType ?? null);
    setComplaint(initialData?.complaint ?? null);
    setMutualAid(initialData?.mutualAid ?? null);
    setRespondingMembers(initialData?.respondedMembers ?? []);
  }, [opened, initialData]);

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave({
        date: centralToISO(date),
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
        <DateTimeField value={date} onChange={setDate} />
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
        <MultiSelect
          label="Responding Members"
          placeholder="Select members"
          data={[...new Set([...options.memberNames, ...respondingMembers])]}
          value={respondingMembers}
          onChange={setRespondingMembers}
          searchable={false}
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
