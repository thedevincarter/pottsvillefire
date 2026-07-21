"use client";

import { Tabs } from "@mantine/core";
import { STATIONS } from "@/lib/stations";
import type { StationMaintenanceLog } from "@/lib/station-maintenance";
import type { MaintenanceRequest } from "@/lib/maintenance-requests";
import { MaintenanceRequestsPanel } from "@/app/components/maintenance/MaintenanceRequestsPanel";
import { StationMaintenanceList } from "./StationMaintenanceList";

export function StationMaintenanceView({
  logs,
  requests,
}: {
  logs: StationMaintenanceLog[];
  requests: MaintenanceRequest[];
}) {
  return (
    <Tabs defaultValue="requests">
      <Tabs.List mb="md">
        <Tabs.Tab value="requests">Requests</Tabs.Tab>
        <Tabs.Tab value="log">Work Log</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="requests">
        <MaintenanceRequestsPanel
          requests={requests}
          targetLabel="Station"
          targetOptions={STATIONS}
          targetField="station"
        />
      </Tabs.Panel>

      <Tabs.Panel value="log">
        <StationMaintenanceList logs={logs} />
      </Tabs.Panel>
    </Tabs>
  );
}
