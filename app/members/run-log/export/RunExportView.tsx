"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Button,
  Group,
  Switch,
  Table,
  Text,
  Title,
} from "@mantine/core";
import type { RunLogEntry } from "@/lib/runs";
import {
  DETAIL_HEADERS,
  RESPONDED_MARK,
  buildExportRows,
  exportFileName,
  formatRunDate,
  formatRunTime,
  respondedCount,
  toCsv,
} from "@/lib/run-export";
import classes from "./RunExport.module.css";

type Props = {
  monthKey: string;
  monthLabel: string;
  runs: RunLogEntry[];
  members: string[];
};

export function RunExportView({ monthKey, monthLabel, runs, members }: Props) {
  const [respondersOnly, setRespondersOnly] = useState(false);

  const columns = useMemo(
    () =>
      respondersOnly
        ? members.filter((m) => respondedCount(runs, m) > 0)
        : members,
    [members, runs, respondersOnly],
  );

  function handleDownload() {
    const { header, body, totals } = buildExportRows(runs, columns);
    const blob = new Blob([toCsv([header, ...body, totals])], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(monthKey);
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Group justify="space-between" align="flex-end" mb="md" className={classes.controls}>
        <div>
          <Anchor component={Link} href={`/members/run-log?month=${monthKey}`} size="sm">
            {"←"} Back to Run Log
          </Anchor>
          <Title order={2} mt={4}>
            Run Log Export
          </Title>
        </div>
        <Group gap="sm">
          <Switch
            label="Responders only"
            checked={respondersOnly}
            onChange={(e) => setRespondersOnly(e.currentTarget.checked)}
            size="sm"
          />
          <Button variant="default" size="sm" onClick={handleDownload}>
            Download CSV
          </Button>
          <Button color="red" size="sm" onClick={() => window.print()}>
            Print
          </Button>
        </Group>
      </Group>

      <div className={classes.reportHeading}>
        <Text fw={700}>Pottsville Fire Department — Run Log</Text>
        <Text size="sm" c="dimmed">
          {monthLabel} · {runs.length} call{runs.length !== 1 ? "s" : ""} ·{" "}
          {columns.length} member{columns.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {runs.length === 0 ? (
        <Text c="dimmed">No runs recorded for {monthLabel}.</Text>
      ) : (
        <Table.ScrollContainer minWidth={700} type="native" className={classes.scroll}>
          <Table
            withTableBorder
            withColumnBorders
            striped
            className={classes.table}
          >
            <Table.Thead>
              <Table.Tr>
                {DETAIL_HEADERS.map((label) => (
                  <Table.Th key={label} className={classes.detailHead}>
                    {label}
                  </Table.Th>
                ))}
                {columns.map((name) => (
                  <Table.Th key={name} className={classes.memberHead}>
                    <span className={classes.memberHeadText}>{name}</span>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {runs.map((run) => {
                const responded = new Set(run.respondedMembers);
                return (
                  <Table.Tr key={run.id}>
                    <Table.Td className={classes.nowrap}>
                      {formatRunDate(run.date)}
                    </Table.Td>
                    <Table.Td className={classes.nowrap}>
                      {formatRunTime(run.date)}
                    </Table.Td>
                    <Table.Td>{run.callType ?? ""}</Table.Td>
                    <Table.Td>{run.complaint ?? ""}</Table.Td>
                    <Table.Td>{run.address ?? ""}</Table.Td>
                    <Table.Td>{run.mutualAid ?? ""}</Table.Td>
                    <Table.Td className={classes.center}>
                      {run.respondedMembers.length}
                    </Table.Td>
                    {columns.map((name) => (
                      <Table.Td key={name} className={classes.mark}>
                        {responded.has(name) ? RESPONDED_MARK : ""}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            <Table.Tfoot className={classes.totals}>
              <Table.Tr>
                <Table.Th colSpan={6} className={classes.nowrap}>
                  Totals
                </Table.Th>
                <Table.Th className={classes.center}>
                  {runs.reduce((sum, run) => sum + run.respondedMembers.length, 0)}
                </Table.Th>
                {columns.map((name) => (
                  <Table.Th key={name} className={classes.center}>
                    {respondedCount(runs, name)}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  );
}
