"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import { Button, TextInput, Textarea, Stack, Alert, Text } from "@mantine/core";

function encode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export function FeedbackForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const form = useForm({
    initialValues: {
      "bot-field": "",
      name: "",
      email: "",
      phone: "",
      message: "",
    },
    validate: {
      email: (value) =>
        value && !/^\S+@\S+\.\S+$/.test(value) ? "Enter a valid email address" : null,
      message: (value) =>
        value.trim().length < 10 ? "Message must be at least 10 characters" : null,
    },
  });

  async function handleSubmit(values: typeof form.values) {
    try {
      await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "department-feedback", ...values }),
      });
      setSubmitted(true);
    } catch {
      setError(true);
    }
  }

  if (submitted) {
    return (
      <Alert color="green" title="Feedback received">
        Thanks for your feedback!
      </Alert>
    );
  }

  return (
    <form
      // @ts-expect-error netlify prop needed to netlify form submissions without JavaScript
      netlify
      name="department-feedback"
      onSubmit={form.onSubmit(handleSubmit)}
      data-netlify="true"
      data-netlify-honeypot="bot-field"
    >
      <input type="hidden" name="form-name" value="department-feedback" />

      <Stack gap="md">
        {error && (
          <Alert color="red" title="Submission failed">
            <Text size="sm">
              Something went wrong. Please try again or contact us directly.
            </Text>
          </Alert>
        )}

        {/* Honeypot field — visually hidden, should remain empty for real users */}
        <div style={{ display: "none" }}>
          <input type="text" tabIndex={-1} {...form.getInputProps("bot-field")} />
        </div>

        <TextInput
          label="Name"
          placeholder="Jane Smith"
          description="Optional"
          {...form.getInputProps("name")}
        />

        <TextInput
          label="Email address"
          placeholder="jane@example.com"
          description="Optional"
          {...form.getInputProps("email")}
        />

        <TextInput
          label="Phone number"
          placeholder="555-555-5555"
          description="Optional"
          {...form.getInputProps("phone")}
        />

        <Textarea
          label="Message"
          placeholder="Share your feedback..."
          required
          autosize
          minRows={4}
          {...form.getInputProps("message")}
        />

        <Button type="submit" mt="xs" disabled={!form.isDirty() || !form.isValid()}>
          Submit feedback
        </Button>
      </Stack>
    </form>
  );
}
