"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import { Button, TextInput, Stack, Alert, Text } from "@mantine/core";

function encode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export function ApplyForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
    },
    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Name must be at least 2 characters" : null,
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : "Enter a valid email address",
    },
  });

  async function handleSubmit(values: typeof form.values) {
    try {
      await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "department-application", ...values }),
      });
      setSubmitted(true);
    } catch {
      setError(true);
    }
  }

  if (submitted) {
    return (
      <Alert color="green" title="Application received">
        Thanks, {form.values.name}! We&apos;ll be in touch at{" "}
        {form.values.email}.
      </Alert>
    );
  }

  return (
    <form
      // @ts-expect-error netlify prop needed to netlify form submissions without JavaScript
      netlify
      name="department-application"
      onSubmit={form.onSubmit(handleSubmit)}
      data-netlify="true"
    >
      <input type="hidden" name="form-name" value="department-application" />

      <Stack gap="md">
        {error && (
          <Alert color="red" title="Submission failed">
            <Text size="sm">
              Something went wrong. Please try again or contact us directly.
            </Text>
          </Alert>
        )}

        <TextInput
          label="Full name"
          placeholder="Jane Smith"
          required
          {...form.getInputProps("name")}
        />

        <TextInput
          label="Email address"
          placeholder="jane@example.com"
          required
          {...form.getInputProps("email")}
        />

        <Button type="submit" mt="xs" color="red.9" disabled={!form.isDirty() || !form.isValid()}>
          Submit application
        </Button>
      </Stack>
    </form>
  );
}
