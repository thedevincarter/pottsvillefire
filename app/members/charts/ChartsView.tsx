"use client";

import { useState } from "react";
import { NativeSelect, Paper, Stack, Text } from "@mantine/core";
import { BarChart, DonutChart } from "@mantine/charts";
import type { ChartData } from "@/lib/runs";

const chartOptions = [
  { value: "calls-by-month", label: "Calls by Month" },
  { value: "calls-by-complaint", label: "Calls by Complaint" },
  { value: "calls-by-type", label: "Total Calls by Type" },
  { value: "type-by-month", label: "Call Type by Month" },
];

export function ChartsView({ data }: { data: ChartData }) {
  const [selected, setSelected] = useState("calls-by-month");

  return (
    <Stack gap="md">
      <NativeSelect
        data={chartOptions}
        value={selected}
        onChange={(e) => setSelected(e.currentTarget.value)}
        w={280}
      />

      <Paper withBorder p="md" radius="md">
        {selected === "calls-by-month" && (
          <>
            <Text fw={600} mb="md">Calls by Month</Text>
            <BarChart
              h={Math.max(200, data.callsByMonth.length * 40)}
              data={data.callsByMonth}
              dataKey="month"
              series={[{ name: "count", color: "red.6" }]}
              orientation="vertical"
              gridAxis="none"
              barProps={{ radius: 4 }}
            />
          </>
        )}

        {selected === "calls-by-complaint" && (
          <>
            <Text fw={600} mb="md">Calls by Complaint</Text>
            {data.callsByComplaint.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No complaint data available.</Text>
            ) : (
              <BarChart
                h={Math.max(200, data.callsByComplaint.length * 36)}
                data={data.callsByComplaint}
                dataKey="complaint"
                series={[{ name: "count", color: "blue.6" }]}
                orientation="vertical"
                gridAxis="none"
                barProps={{ radius: 4 }}
              />
            )}
          </>
        )}

        {selected === "calls-by-type" && (
          <>
            <Text fw={600} mb="md">Total Calls by Type</Text>
            <DonutChart
              h={300}
              data={data.callsByType.map((d) => ({
                name: d.type,
                value: d.count,
                color: d.color,
              }))}
              withLabelsLine
              labelsType="percent"
              withLabels
            />
          </>
        )}

        {selected === "type-by-month" && (
          <>
            <Text fw={600} mb="md">Call Type by Month</Text>
            <BarChart
              h={300}
              data={data.callTypeByMonth}
              dataKey="month"
              series={[
                { name: "Fire", color: "red.6" },
                { name: "Medical", color: "blue.6" },
                { name: "MVC", color: "yellow.6" },
              ]}
              barProps={{ radius: 4 }}
            />
          </>
        )}
      </Paper>
    </Stack>
  );
}
