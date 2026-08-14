import { Container, Title, Text } from "@mantine/core";
import { getApparatus } from "@/lib/apparatus";
import { getMaintenanceLogs } from "@/lib/maintenance";
import { getApparatusRequests } from "@/lib/maintenance-requests";
import { getRosterNames } from "@/lib/runs";
import { ApparatusMaintenanceView } from "./ApparatusMaintenanceView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apparatus Maintenance | Pottsville Fire",
};

export default async function ApparatusMaintenancePage() {
  const [logs, apparatus, requests, memberNames] = await Promise.all([
    getMaintenanceLogs(),
    getApparatus(),
    getApparatusRequests(),
    getRosterNames(),
  ]);

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Apparatus Maintenance</Title>
      <Text c="dimmed" mb="xl">
        Submit maintenance requests and log work performed on apparatus.
      </Text>
      <ApparatusMaintenanceView
        logs={logs}
        apparatus={apparatus}
        requests={requests}
        memberNames={memberNames}
      />
    </Container>
  );
}
