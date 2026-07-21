"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import dayjs from "dayjs";
import { AuthProvider } from "./auth/AuthProvider";

// Single-letter weekday headers (S M T W T F S). Mantine has no dayjs token
// for this, so weekdayFormat takes a function. In v9 it receives the day as a
// "YYYY-MM-DD" string (not a Date), so parse it with dayjs to get the index.
const weekdays = "SMTWTFS";
const calendarDefaults = {
  weekdayFormat: (date: string) => weekdays[dayjs(date).day()],
  firstDayOfWeek: 0 as const, // start the week on Sunday to match S M T W T F S
  highlightToday: true,
};

// Input-based pickers open a Popover dropdown. Rendering it inside its portal
// (the default) places it outside any surrounding Modal's focus trap, which on
// mobile steals focus back the instant you tap the field and dismisses the
// keyboard. withinPortal: false keeps the dropdown inside the Modal's trap so
// the input stays focused. Our pickers all live in modals and sit at the top of
// short forms, so there's no clipping concern.
const inputPickerDefaults = {
  ...calendarDefaults,
  popoverProps: { withinPortal: false },
};

const theme = createTheme({
  components: {
    TextInput: { defaultProps: { size: "md" } },
    PasswordInput: { defaultProps: { size: "md" } },
    NativeSelect: { defaultProps: { size: "md" } },
    Textarea: { defaultProps: { size: "md" } },
    // App-wide date picker defaults. We avoid DateTimePicker (its custom
    // TimePicker dismisses the mobile keyboard inside modals) in favor of a
    // DatePickerInput + native TimeInput — see components/DateTimeField.
    DatePicker: { defaultProps: calendarDefaults }, // inline calendar, no popover
    Calendar: { defaultProps: calendarDefaults },
    DatePickerInput: { defaultProps: inputPickerDefaults },
    DateInput: { defaultProps: inputPickerDefaults },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <AuthProvider>{children}</AuthProvider>
    </MantineProvider>
  );
}
