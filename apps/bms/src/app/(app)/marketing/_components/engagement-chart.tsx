"use client";

import { Chart } from "@insurimple/design-system";

export function EngagementChart({
  categories,
  sent,
  delivered,
  engaged,
}: {
  categories: string[];
  sent: number[];
  delivered: number[];
  engaged: number[];
}) {
  return (
    <Chart
      type="area"
      height={300}
      categories={categories}
      tokenColors={["--tenant-primary", "--info", "--coral"]}
      series={[
        { name: "Sent", data: sent },
        { name: "Delivered", data: delivered },
        { name: "Engaged", data: engaged },
      ]}
    />
  );
}
