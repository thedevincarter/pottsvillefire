import { Container, Group, Skeleton, Stack, Text, Title } from "@mantine/core";

export default function RunLogLoading() {
  return (
    <Container size="sm" pt="xl">
      <Title mb="xs">Run Log</Title>
      <Text c="dimmed" mb="xl">
        2026 incident log for Pottsville Fire Department.
      </Text>

      <Skeleton height={36} w={200} mb="lg" radius="sm" />

      <Group gap="md" mb="md">
        <Skeleton height={36} w={60} radius="sm" />
        <Skeleton height={36} w={72} radius="sm" />
      </Group>

      <Stack gap="sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={72} radius="md" />
        ))}
      </Stack>
    </Container>
  );
}
