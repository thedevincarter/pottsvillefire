"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { AuthProvider } from "./auth/AuthProvider";

// Single-letter weekday headers (S M T W T F S). Mantine has no dayjs token
// for this, so weekdayFormat takes a function keyed on the day index.
const weekdays = "SMTWTFS";
const dateDefaults = {
  weekdayFormat: (date: Date) => weekdays[date.getDay()],
  firstDayOfWeek: 0 as const, // start the week on Sunday to match S M T W T F S
  highlightToday: true,
};

const theme = createTheme({
  components: {
    TextInput: { defaultProps: { size: "md" } },
    PasswordInput: { defaultProps: { size: "md" } },
    NativeSelect: { defaultProps: { size: "md" } },
    Textarea: { defaultProps: { size: "md" } },
    // App-wide date picker defaults.
    DatePicker: { defaultProps: dateDefaults },
    DatePickerInput: { defaultProps: dateDefaults },
    DateTimePicker: { defaultProps: dateDefaults },
    DateInput: { defaultProps: dateDefaults },
    Calendar: { defaultProps: dateDefaults },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <AuthProvider>{children}</AuthProvider>
    </MantineProvider>
  );
}
