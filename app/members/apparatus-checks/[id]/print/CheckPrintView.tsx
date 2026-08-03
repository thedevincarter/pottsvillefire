"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Anchor, Button, Group, Table, Text, Title } from "@mantine/core";
import type { ApparatusCheck } from "@/lib/apparatus";
import { groupResults } from "@/lib/check-results";
import classes from "./CheckPrint.module.css";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Chicago",
  });
}

function statusLabel(status: "pass" | "fail" | null) {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  return "—";
}

export function CheckPrintView({ check }: { check: ApparatusCheck }) {
  const groups = groupResults(check.results);
  const passCount = check.results.filter((r) => r.status === "pass").length;
  const failCount = check.results.filter((r) => r.status === "fail").length;
  const unanswered = check.results.filter((r) => r.status === null).length;

  return (
    <>
      <Group justify="space-between" align="flex-end" mb="md" className={classes.controls}>
        <div>
          <Anchor component={Link} href={`/members/apparatus-checks/${check.id}`} size="sm">
            {"←"} Back to Check
          </Anchor>
          <Title order={2} mt={4}>
            Print Apparatus Check
          </Title>
        </div>
        <Button color="red" size="sm" onClick={() => window.print()}>
          Print
        </Button>
      </Group>

      <div className={classes.sheet}>
        <div className={classes.heading}>
          <Text fw={700}>Pottsville Fire Department — Apparatus Check</Text>
          <Text size="xl" fw={700} mt={2}>
            {check.apparatusName}
          </Text>
        </div>

        <table className={classes.meta}>
          <tbody>
            <tr>
              <th>Month</th>
              <td>{formatMonth(check.month)}</td>
              <th>Checked by</th>
              <td>{check.memberName}</td>
            </tr>
            <tr>
              <th>Started</th>
              <td>{formatDateTime(check.startedAt)}</td>
              <th>Completed</th>
              <td>
                {check.completedAt ? formatDateTime(check.completedAt) : "Not completed"}
              </td>
            </tr>
            <tr>
              <th>Results</th>
              <td colSpan={3}>
                {passCount} pass · {failCount} fail
                {unanswered > 0 ? ` · ${unanswered} unanswered` : ""}
              </td>
            </tr>
          </tbody>
        </table>

        {!check.completedAt && (
          <Text size="sm" fw={600} className={classes.notice}>
            This check is still in progress — printed as an incomplete record.
          </Text>
        )}

        <Table withTableBorder withColumnBorders className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th className={classes.resultCol}>Result</Table.Th>
              <Table.Th className={classes.notesCol}>Notes</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {groups.map((group) => (
              <Fragment key={group.key}>
                {group.header && (
                  <Table.Tr className={classes.sectionRow}>
                    <Table.Td colSpan={3}>{group.header}</Table.Td>
                  </Table.Tr>
                )}
                {group.items.map((result) => (
                  <Table.Tr key={result.id}>
                    <Table.Td className={group.header ? classes.indented : undefined}>
                      {result.label}
                    </Table.Td>
                    <Table.Td
                      className={`${classes.resultCol} ${
                        result.status === "fail" ? classes.fail : ""
                      }`}
                    >
                      {statusLabel(result.status)}
                    </Table.Td>
                    <Table.Td className={classes.notesCol}>{result.notes ?? ""}</Table.Td>
                  </Table.Tr>
                ))}
              </Fragment>
            ))}
          </Table.Tbody>
        </Table>

        <div className={classes.notes}>
          <Text fw={700} size="sm" mb={4}>
            General Notes / Findings
          </Text>
          <div className={classes.notesBox}>{check.generalNotes || "—"}</div>
        </div>
      </div>
    </>
  );
}
