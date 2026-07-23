import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type Align = "left" | "right" | "center";

export type Column<T> = {
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: Align;
  className?: string;
};

const ALIGN: Record<Align, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/** Data table. Columns declare header, align, render. */
export function Table<T>({
  columns,
  rows,
  getRowKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) {
    return <div className="px-5 py-10 text-center">{empty}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-small">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  "px-5 py-3 text-caption font-medium uppercase tracking-[0.06em] text-fg-subtle",
                  ALIGN[col.align ?? "left"],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={getRowKey(row, ri)}
              className="border-b border-border last:border-0 hover:bg-surface-panel"
            >
              {columns.map((col, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-5 py-3.5 text-fg",
                    ALIGN[col.align ?? "left"],
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
