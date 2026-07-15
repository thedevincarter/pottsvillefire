import { Container, Title, Text } from "@mantine/core";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Users | Pottsville Fire",
};

export default function ManageUsersPage() {
  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Manage Users</Title>
      <Text c="dimmed" mb="xl">
        Add and manage member accounts.
      </Text>
      <UserManager />
    </Container>
  );
}

import { UserManager } from "./UserManager";
