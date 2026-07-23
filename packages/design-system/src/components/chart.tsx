"use client";

import type { ApexOptions } from "apexcharts";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";

type ApexProps = {
  type: ChartType;
  series: ApexOptions["series"];
  options: ApexOptions;
  height: number;
};

// react-apexcharts touches `window` on import — load it client-only, once.
let ApexChart: ComponentType<ApexProps> | null = null;

export type ChartType = "line" | "area" | "bar" | "donut" | "radialBar";

/** Read design-system CSS custom properties into concrete color strings. */
function readTokens(names: string[]): string[] {
  if (typeof window === "undefined") return [];
  const style = getComputedStyle(document.documentElement);
  return names.map((n) => style.getPropertyValue(n).trim()).filter(Boolean);
}

/**
 * Token-styled ApexCharts wrapper. Screens pass CSS-variable names via
 * `tokenColors` (e.g. ["--accent", "--info"]) so charts honour tenant theming.
 */
export function Chart({
  type,
  series,
  height = 320,
  categories,
  tokenColors = ["--tenant-primary", "--info", "--coral", "--warning"],
  options,
}: {
  type: ChartType;
  series: ApexOptions["series"];
  height?: number;
  categories?: (string | number)[];
  tokenColors?: string[];
  options?: ApexOptions;
}) {
  const [Comp, setComp] = useState<ComponentType<ApexProps> | null>(ApexChart);
  const [palette, setPalette] = useState<string[]>([]);
  const [grid, setGrid] =
    useState<{ border: string; text: string; font: string }>();

  useEffect(() => {
    if (!ApexChart) {
      void import("react-apexcharts").then((m) => {
        ApexChart = m.default as unknown as ComponentType<ApexProps>;
        setComp(() => ApexChart);
      });
    }
  }, []);

  useEffect(() => {
    setPalette(readTokens(tokenColors));
    const t = readTokens(["--border-1", "--text-2", "--font-sans"]);
    setGrid({
      border: t[0] ?? "#e4e0d7",
      text: t[1] ?? "#5b6b70",
      font: t[2] ?? "Inter, sans-serif",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenColors.join(",")]);

  // Hold a themed skeleton until both the lib and the resolved tokens are ready.
  if (!Comp || !grid) {
    return (
      <div
        style={{ height }}
        className="w-full animate-pulse rounded-control bg-surface-sunken"
      />
    );
  }

  const isCircular = type === "donut" || type === "radialBar";

  const common: ApexOptions = {
    chart: {
      fontFamily: grid.font,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { speed: 180 },
      background: "transparent",
    },
    colors: palette.length ? palette : undefined,
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: grid.text },
      fontFamily: grid.font,
      markers: { size: 6 },
    },
    tooltip: { theme: "light" },
  };

  // Circular charts reject axis/grid config — keep their option set minimal.
  const base: ApexOptions = isCircular
    ? {
        ...common,
        stroke: { width: 0 },
        plotOptions: { pie: { donut: { size: "68%" } } },
      }
    : {
        ...common,
        grid: {
          borderColor: grid.border,
          strokeDashArray: 4,
          xaxis: { lines: { show: false } },
        },
        stroke: {
          curve: "smooth",
          width: type === "area" || type === "line" ? 2.5 : 0,
        },
        fill:
          type === "area"
            ? {
                type: "gradient",
                gradient: { opacityFrom: 0.35, opacityTo: 0.02 },
              }
            : { opacity: 1 },
        xaxis: {
          categories,
          labels: { style: { colors: grid.text, fontFamily: grid.font } },
          axisBorder: { color: grid.border },
          axisTicks: { color: grid.border },
        },
        yaxis: {
          labels: { style: { colors: grid.text, fontFamily: grid.font } },
        },
        plotOptions: { bar: { borderRadius: 4, columnWidth: "45%" } },
      };

  return (
    <Comp
      type={type}
      height={height}
      series={series}
      options={{
        ...base,
        ...options,
        chart: { ...base.chart, ...options?.chart, type },
      }}
    />
  );
}
