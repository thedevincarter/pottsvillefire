"use client";

import { useAuth } from "./AuthProvider";
import { Container, Title, Text, Button, Stack } from "@mantine/core";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, login } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Stack align="center" gap="md">
          <Title order={2}>Authentication Required</Title>
          <Text c="dimmed">You must be logged in to view this page.</Text>
          <Button onClick={login} color="red">Log in</Button>
        </Stack>
      </Container>
    );
  }

  return <>{children}</>;
}
