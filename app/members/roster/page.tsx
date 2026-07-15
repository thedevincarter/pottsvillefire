import { Container, Title, Text } from "@mantine/core";
import { getAllMemberCallCounts } from "@/lib/runs";
import { MemberRoster } from "./MemberRoster";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Member Roster | Pottsville Fire",
};

export default async function MemberRosterPage() {
  const members = await getAllMemberCallCounts();

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Member Roster</Title>
      <Text c="dimmed" mb="xl">
        Response counts by member.
      </Text>
      <MemberRoster members={members} />
    </Container>
  );
}
