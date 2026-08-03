"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Container, Title, Text, Button, Stack } from "@mantine/core";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return null;
  }

  if (!user || !isAdmin) {
    return (
      <Container size="sm" py="xl">
        <Stack align="center" gap="md">
          <Title order={2}>Admins Only</Title>
          <Text c="dimmed">You don&apos;t have access to this page.</Text>
          <Button onClick={() => router.push("/members")} color="red">
            Back to Members
          </Button>
        </Stack>
      </Container>
    );
  }

  return <>{children}</>;
}
