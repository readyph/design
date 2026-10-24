import { type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Spinner } from './Spinner';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer; defaults to `row[key]`. */
  render?: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  /** Hide below the given breakpoint (applies a responsive class). */
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  /** Stable key for each row. */
  rowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  /** Compact row height. */
  dense?: boolean;
  loading?: boolean;
  /** Shown when `data` is empty and not loading. */
  empty?: ReactNode;
  className?: string;
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' };

/** A data table with a sticky header, row hover and empty/loading states. */
export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  dense = false,
  loading = false,
  empty = 'No data',
  className,
}: TableProps<T>) {
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={cn(
                    'whitespace-nowrap font-medium text-ink-muted',
                    cellPad,
                    alignClass[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <Spinner className="mx-auto text-ink-subtle" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border last:border-0 bg-surface',
                    onRowClick && 'cursor-pointer transition-colors hover:bg-surface-subtle',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('text-ink', cellPad, alignClass[col.align ?? 'left'], col.className)}
                    >
                      {col.render ? col.render(row, i) : (row as Record<string, ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
