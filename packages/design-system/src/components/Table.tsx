import type { ReactNode } from 'react';

/** Column definition. `cell` receives the row and returns display content. */
export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

/**
 * The primary surface of the app (design-and-brand-brief §6). Dense, scannable,
 * keyboard-friendly. Rows are clickable when onRowClick is provided.
 */
export function Table<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }
  return (
    <div className="overflow-x-auto rounded-card border border-border-1 bg-surface-card">
      <table className="w-full border-collapse text-body">
        <thead>
          <tr className="border-b border-border-1 text-left text-small text-text-2">
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : undefined}
                className={`px-4 py-2 font-medium ${c.align === 'right' ? 'text-right' : ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-border-1 last:border-0 ${
                onRowClick ? 'cursor-pointer hover:bg-accent-tint/40' : ''
              }`}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-2.5 text-text-1 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
