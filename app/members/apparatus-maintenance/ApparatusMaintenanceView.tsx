"use client";

import { Tabs } from "@mantine/core";
import type { Apparatus } from "@/lib/apparatus";
import type { MaintenanceLog } from "@/lib/maintenance";
import type { MaintenanceRequest } from "@/lib/maintenance-requests";
import { MaintenanceRequestsPanel } from "@/app/components/maintenance/MaintenanceRequestsPanel";
import { ApparatusMaintenanceList } from "./ApparatusMaintenanceList";

export function ApparatusMaintenanceView({
  logs,
  apparatus,
  requests,
}: {
  logs: MaintenanceLog[];
  apparatus: Apparatus[];
  requests: MaintenanceRequest[];
}) {
  const apparatusOptions = apparatus.map((a) => ({ value: a.id, label: a.name }));

  return (
    <Tabs defaultValue="requests">
      <Tabs.List mb="md">
        <Tabs.Tab value="requests">Requests</Tabs.Tab>
        <Tabs.Tab value="log">Work Log</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="requests">
        <MaintenanceRequestsPanel
          requests={requests}
          targetLabel="Apparatus"
          targetOptions={apparatusOptions}
          targetField="apparatusId"
        />
      </Tabs.Panel>

      <Tabs.Panel value="log">
        <ApparatusMaintenanceList logs={logs} apparatus={apparatus} />
      </Tabs.Panel>
    </Tabs>
  );
}
