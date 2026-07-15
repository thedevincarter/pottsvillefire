"use client";

import { useRouter } from "next/navigation";
import { Button, Menu, Text } from "@mantine/core";
import { useAuth } from "./AuthProvider";

export function LoginButton({ onAction, variant = "menu" }: { onAction?: () => void; variant?: "menu" | "simple" } = {}) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return null;
  }

  if (user) {
    if (variant === "simple") {
      return (
        <Button variant="subtle" color="gray" size="compact-sm" onClick={() => { onAction?.(); logout(); }}>
          Log out
        </Button>
      );
    }

    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button variant="subtle" color="gray" size="compact-sm">
            {profile?.fullName || user.email}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>
            <Text size="xs" c="dimmed">{user.email}</Text>
          </Menu.Label>
          <Menu.Item onClick={() => logout()}>Log out</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Button
      variant="filled"
      color="red"
      size="compact-sm"
      onClick={() => { onAction?.(); router.push("/login"); }}
    >
      Log in
    </Button>
  );
}
