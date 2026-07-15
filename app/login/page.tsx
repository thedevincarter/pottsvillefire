"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAuth } from "@/app/components/auth/AuthProvider";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    router.push("/members/run-log");
    return null;
  }

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.push("/members/run-log");
    }
  }

  return (
    <Container size="xs" pt="xl">
      <Title ta="center" mb="lg">Members</Title>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <Stack gap="sm">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              type="email"
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
            {error && <Text size="sm" c="red">{error}</Text>}
            <Button type="submit" color="red" fullWidth loading={loading}>
              Log in
            </Button>
            <Anchor
              size="sm"
              ta="center"
              component="button"
              type="button"
              onClick={() => router.push("/forgot-password")}
            >
              Forgot password?
            </Anchor>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
