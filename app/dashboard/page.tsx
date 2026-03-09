import { Container, Text, Title } from "@mantine/core";
import { getRunLog } from "@/lib/notion";
import { DashboardCharts } from "./DashboardCharts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Pottsville Fire",
  description: "Pottsville Fire Department incident dashboard",
};

export default async function DashboardPage() {
  const runs = await getRunLog();

  return (
    <Container
      size="md"
      pt="xl"
      style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}
    >
      <Title mb="xs">Dashboard</Title>
      <Text c="dimmed" mb="xl">
        2026 incident statistics for Pottsville Fire Department.
      </Text>

      <DashboardCharts runs={runs} />
    </Container>
  );
}
