import { Container, Skeleton, Stack, Text, Title } from "@mantine/core";

export default function RunLogLoading() {
  return (
    <Container size="sm" py="xl">
      <Title mb="xs">Run Log</Title>
      <Text c="dimmed" mb="xl">
        2026 incident log for Pottsville Fire Department.
      </Text>

      <Skeleton height={36} mb="lg" radius="sm" />

      <Stack gap="sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={72} radius="md" />
        ))}
      </Stack>
    </Container>
  );
}
