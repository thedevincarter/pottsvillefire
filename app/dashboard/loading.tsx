import { Container, Skeleton, Stack, Text, Title } from "@mantine/core";

export default function DashboardLoading() {
  return (
    <Container size="md" py="xl">
      <Title mb="xs">Dashboard</Title>
      <Text c="dimmed" mb="xl">
        2026 incident statistics for Pottsville Fire Department.
      </Text>

      <Skeleton height={36} w={200} mb="xl" radius="sm" />
      <Skeleton height={24} w={280} mb="sm" radius="sm" />
      <Skeleton height={400} radius="md" />
    </Container>
  );
}
