import { Container, Title, Text } from "@mantine/core";
import { getStationLogs } from "@/lib/station-maintenance";
import { getStationRequests } from "@/lib/maintenance-requests";
import { StationMaintenanceView } from "./StationMaintenanceView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Station Maintenance | Pottsville Fire",
};

export default async function StationMaintenancePage() {
  const [logs, requests] = await Promise.all([
    getStationLogs(),
    getStationRequests(),
  ]);

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Station Maintenance</Title>
      <Text c="dimmed" mb="xl">
        Submit maintenance requests and log work performed at the stations.
      </Text>
      <StationMaintenanceView logs={logs} requests={requests} />
    </Container>
  );
}
