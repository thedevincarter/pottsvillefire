"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Container, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Container size="xs" pt="xl">
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="md">
            <Title order={3}>Check your email</Title>
            <Text c="dimmed" ta="center">
              If an account exists for <strong>{email}</strong>, we sent a password reset link.
            </Text>
            <Button variant="subtle" onClick={() => router.push("/login")}>
              Back to login
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" pt="xl">
      <Title ta="center" mb="lg">Reset Password</Title>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Stack gap="sm">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              type="email"
            />
            {error && <Text size="sm" c="red">{error}</Text>}
            <Button type="submit" color="red" fullWidth loading={loading}>
              Send reset link
            </Button>
            <Button variant="subtle" fullWidth onClick={() => router.push("/login")}>
              Back to login
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
