"use client";

import { Chart } from "@insurimple/design-system";

export function ConsentDonut({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <Chart
      type="donut"
      height={300}
      // Green (express) → red (no consent): consent health at a glance.
      tokenColors={["--success", "--info", "--warning", "--danger"]}
      series={data.map((d) => d.value)}
      options={{
        labels: data.map((d) => d.label),
        legend: { position: "bottom" },
        plotOptions: {
          pie: { donut: { size: "68%" } },
        },
        dataLabels: { enabled: false },
      }}
    />
  );
}
