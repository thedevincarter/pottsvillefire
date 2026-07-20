"use client";

import Link from "next/link";
import { Anchor, Box, Card, Group, Stack, Table, Text } from "@mantine/core";
import type { MemberCallCounts } from "@/lib/runs";

export function MemberRoster({ members }: { members: MemberCallCounts[] }) {
  return (
    <>
        {/* Mobile card view */}
        <Box hiddenFrom="sm">
          {members.length === 0 ? (
            <Text c="dimmed" ta="center" py="md">
              No members found.
            </Text>
          ) : (
            <Stack gap="sm">
              {members.map((m) => (
                <Card key={m.name} withBorder padding="sm" radius="md">
                  <Group justify="space-between" mb={4}>
                    <Anchor
                      component={Link}
                      href={`/members/profile/${encodeURIComponent(m.name)}`}
                      fw={600}
                      size="sm"
                    >
                      {m.name}
                    </Anchor>
                    {(m.rank || m.number) && (
                      <Text size="xs" c="dimmed">
                        {[m.rank, m.number ? `#${m.number}` : null].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </Group>
                  <Group gap="lg">
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Total</Text>
                      <Text size="sm" fw={600}>{m.total}</Text>
                    </Stack>
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Fire</Text>
                      <Text size="sm" fw={600}>{m.fire}</Text>
                    </Stack>
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Medical</Text>
                      <Text size="sm" fw={600}>{m.medical}</Text>
                    </Stack>
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">MVC</Text>
                      <Text size="sm" fw={600}>{m.mvc}</Text>
                    </Stack>
                    <Stack gap={0}>
                      <Text size="xs" c="dimmed">Trainings</Text>
                      <Text size="sm" fw={600}>{m.trainings}</Text>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* Desktop table view */}
        <Box visibleFrom="sm">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Rank</Table.Th>
                <Table.Th ta="center">#</Table.Th>
                <Table.Th ta="center">Total</Table.Th>
                <Table.Th ta="center">Fire</Table.Th>
                <Table.Th ta="center">Medical</Table.Th>
                <Table.Th ta="center">MVC</Table.Th>
                <Table.Th ta="center">Trainings</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {members.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed" ta="center" py="md">
                      No members found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                members.map((m) => (
                  <Table.Tr key={m.name}>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        href={`/members/profile/${encodeURIComponent(m.name)}`}
                        size="sm"
                      >
                        {m.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{m.rank || "-"}</Table.Td>
                    <Table.Td ta="center">{m.number || "-"}</Table.Td>
                    <Table.Td ta="center">{m.total}</Table.Td>
                    <Table.Td ta="center">{m.fire}</Table.Td>
                    <Table.Td ta="center">{m.medical}</Table.Td>
                    <Table.Td ta="center">{m.mvc}</Table.Td>
                    <Table.Td ta="center">{m.trainings}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </>
  );
}
