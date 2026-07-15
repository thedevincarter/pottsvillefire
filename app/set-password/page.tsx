"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Container, Loader, Paper, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Supabase handles the token exchange from the invite link automatically
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // No session means the token exchange hasn't happened yet or failed
        // Supabase client-side auth picks up the hash params automatically
        const interval = setInterval(async () => {
          const { data } = await supabaseBrowser.auth.getSession();
          if (data.session) {
            clearInterval(interval);
            setChecking(false);
          }
        }, 500);
        const timeout = setTimeout(() => {
          clearInterval(interval);
          setChecking(false);
          setError("Invalid or expired invite link. Please ask your admin for a new invite.");
        }, 5000);
        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      }
      setChecking(false);
    });
  }, []);

  async function handleSubmit() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError(null);
    setLoading(true);
    const { error: err } = await supabaseBrowser.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
    }
  }

  if (checking) {
    return (
      <Container size="xs" pt="xl">
        <Stack align="center" gap="md" py="xl">
          <Loader />
          <Text c="dimmed">Verifying your invite...</Text>
        </Stack>
      </Container>
    );
  }

  if (success) {
    return (
      <Container size="xs" pt="xl">
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="md">
            <Title order={3}>You're all set!</Title>
            <Text c="dimmed">Your password has been created. You can now access the members area.</Text>
            <Button color="red" onClick={() => router.push("/members/run-log")}>
              Go to Members
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" pt="xl">
      <Title ta="center" mb="lg">Welcome to Pottsville Fire</Title>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Choose a password to complete your account setup.
            </Text>
            <PasswordInput
              label="Password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              minLength={6}
            />
            {error && <Text size="sm" c="red">{error}</Text>}
            <Button type="submit" color="red" fullWidth loading={loading}>
              Set Password
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
