"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Container, Loader, Paper, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Container size="xs" pt="xl">
          <Stack align="center" gap="md" py="xl">
            <Loader />
          </Stack>
        </Container>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "recovery" | undefined;

      if (tokenHash && type) {
        const { error: verifyError } = await supabaseBrowser.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (verifyError) {
          setError("Invalid or expired reset link. Please request a new one.");
        }
        setChecking(false);
        return;
      }

      // Fallback: check for existing session
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (session) {
        setChecking(false);
        return;
      }

      setChecking(false);
      setError("Invalid or expired reset link. Please request a new one.");
    }

    verifyToken();
  }, [searchParams]);

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
          <Text c="dimmed">Verifying...</Text>
        </Stack>
      </Container>
    );
  }

  if (success) {
    return (
      <Container size="xs" pt="xl">
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="md">
            <Title order={3}>Password updated</Title>
            <Text c="dimmed">Your password has been reset successfully.</Text>
            <Button color="red" onClick={() => router.push("/members/run-log")}>
              Continue to Members
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" pt="xl">
      <Title ta="center" mb="lg">Set New Password</Title>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Stack gap="sm">
            <PasswordInput
              label="New Password"
              placeholder="Choose a new password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              minLength={6}
            />
            {error && <Text size="sm" c="red">{error}</Text>}
            <Button type="submit" color="red" fullWidth loading={loading}>
              Update password
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
