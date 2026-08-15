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
  memberNames,
}: {
  logs: MaintenanceLog[];
  apparatus: Apparatus[];
  requests: MaintenanceRequest[];
  memberNames: string[];
}) {
  const apparatusOptions = apparatus.map((a) => ({ value: a.id, label: a.name }));

  // Resolved requests are finished work, so they live in the work log. Anything
  // still open — including won't-do — stays in the Requests tab.
  const resolvedRequests = requests.filter((r) => r.status === "resolved");
  const openRequests = requests.filter((r) => r.status !== "resolved");

  return (
    <Tabs defaultValue="requests">
      <Tabs.List mb="md">
        <Tabs.Tab value="requests">Requests</Tabs.Tab>
        <Tabs.Tab value="log">Work Log</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="requests">
        <MaintenanceRequestsPanel
          requests={openRequests}
          targetLabel="Apparatus"
          targetOptions={apparatusOptions}
          targetField="apparatusId"
          memberNames={memberNames}
        />
      </Tabs.Panel>

      <Tabs.Panel value="log">
        <ApparatusMaintenanceList
          logs={logs}
          apparatus={apparatus}
          resolvedRequests={resolvedRequests}
        />
      </Tabs.Panel>
    </Tabs>
  );
}
