"use client";

import { Button, Menu, Text } from "@mantine/core";
import { useAuth } from "./AuthProvider";

export function LoginButton({ onAction, variant = "menu" }: { onAction?: () => void; variant?: "menu" | "simple" } = {}) {
  const { user, loading, login, logout } = useAuth();

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
            {user.user_metadata?.full_name || user.email}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>
            <Text size="xs" c="dimmed">{user.email}</Text>
          </Menu.Label>
          <Menu.Item onClick={logout}>Log out</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Button variant="filled" color="red" size="compact-sm" onClick={() => { onAction?.(); login(); }}>
      Log in
    </Button>
  );
}
