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
  memberNames,
}: {
  logs: StationMaintenanceLog[];
  requests: MaintenanceRequest[];
  memberNames: string[];
}) {
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
          targetLabel="Station"
          targetOptions={STATIONS}
          targetField="station"
          memberNames={memberNames}
        />
      </Tabs.Panel>

      <Tabs.Panel value="log">
        <StationMaintenanceList logs={logs} resolvedRequests={resolvedRequests} />
      </Tabs.Panel>
    </Tabs>
  );
}
