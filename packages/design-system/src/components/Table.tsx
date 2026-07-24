import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TableAlign = 'left' | 'right' | 'center';

export interface TableColumn<Row> {
  header: string;
  align?: TableAlign;
  render: (row: Row) => ReactNode;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  minWidth?: number;
  className?: string;
}

function alignClass(a?: TableAlign): string {
  return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
}

/** A flat data table — hairline row borders, no zebra, header in muted caps-ish label. */
export function Table<Row>({ columns, rows, rowKey, minWidth, className }: TableProps<Row>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-small" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr className="border-b border-border-1 text-left text-text-3">
            {columns.map((c, i) => (
              <th key={i} className={cn('px-4 py-2.5 font-medium', alignClass(c.align))}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)} className="border-b border-border-1 last:border-0">
              {columns.map((c, j) => (
                <td key={j} className={cn('px-4 py-3 align-top', alignClass(c.align))}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
