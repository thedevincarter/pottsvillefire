import { Container, Title, Text } from "@mantine/core";
import { getApparatus } from "@/lib/apparatus";
import { getMaintenanceLogs } from "@/lib/maintenance";
import { ApparatusMaintenanceList } from "./ApparatusMaintenanceList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apparatus Maintenance | Pottsville Fire",
};

export default async function ApparatusMaintenancePage() {
  const [logs, apparatus] = await Promise.all([
    getMaintenanceLogs(),
    getApparatus(),
  ]);

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Apparatus Maintenance</Title>
      <Text c="dimmed" mb="xl">
        Log and search maintenance and repairs performed on apparatus.
      </Text>
      <ApparatusMaintenanceList logs={logs} apparatus={apparatus} />
    </Container>
  );
}
