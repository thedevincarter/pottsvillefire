"use client";

import { Group } from "@mantine/core";
import { DatePickerInput, TimePicker } from "@mantine/dates";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "America/Chicago";

// A date calendar + a 24h time picker. We use Mantine's TimePicker with
// withDropdown={false}: its hour/minute fields are plain numeric inputs, and
// disabling the on-focus dropdown is what avoids the mobile keyboard-dismiss
// bug that DateTimePicker hit inside a modal. TimePicker also renders 24h,
// unlike a native <input type="time"> whose format follows the device locale.
//
// value is a "YYYY-MM-DD HH:mm:ss" wall-clock string (Central) or null, matching
// what the run/training modals already keep in state.
type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  dateLabel?: string;
  timeLabel?: string;
};

/**
 * A timestamp from the database -> the "YYYY-MM-DD HH:mm:ss" Central wall-clock
 * string this field takes as its value.
 *
 * Note the `dayjs(iso).tz(TZ)` ordering: it parses the instant (honouring the
 * stored offset) and then converts it to Central. `dayjs.tz(iso, TZ)` looks
 * similar but does the opposite — it reads the string's clock time as if it
 * were already Central, so a UTC 14:57 would open the editor as 14:57 instead
 * of 09:57 and re-saving would shift the run by the offset.
 */
export function isoToCentral(isoDate: string | null): string | null {
  if (!isoDate) return null;
  // Legacy date-only rows carry no offset, so they're already wall-clock.
  const parsed = isoDate.includes("T") ? dayjs(isoDate).tz(TZ) : dayjs.tz(isoDate, TZ);
  return parsed.format("YYYY-MM-DD HH:mm:ss");
}

/** The inverse: a Central wall-clock string -> an ISO timestamp with offset. */
export function centralToISO(dateStr: string | null): string {
  if (!dateStr) return "";
  return dayjs.tz(dateStr, TZ).format("YYYY-MM-DDTHH:mm:ssZ");
}

function split(value: string | null): { date: string | null; time: string } {
  if (!value) return { date: null, time: "" };
  const [date, time] = value.split(" ");
  return { date: date || null, time: time ? time.slice(0, 5) : "" };
}

export function DateTimeField({
  value,
  onChange,
  dateLabel = "Date (Central)",
  timeLabel = "Time",
}: Props) {
  const { date, time } = split(value);

  function handleDate(next: string | null) {
    if (!next) {
      onChange(null);
      return;
    }
    onChange(`${next} ${time || "00:00"}:00`);
  }

  function handleTime(next: string) {
    // Default to today's Central date if a time is entered before a date.
    const day = date ?? dayjs().tz(TZ).format("YYYY-MM-DD");
    onChange(`${day} ${next || "00:00"}:00`);
  }

  return (
    <Group grow align="flex-start" gap="sm">
      <DatePickerInput
        label={dateLabel}
        placeholder="Select date"
        value={date}
        onChange={handleDate}
        valueFormat="MM/DD/YYYY"
        clearable
      />
      <TimePicker
        label={timeLabel}
        value={time}
        onChange={handleTime}
        format="24h"
        withDropdown={false}
      />
    </Group>
  );
}
