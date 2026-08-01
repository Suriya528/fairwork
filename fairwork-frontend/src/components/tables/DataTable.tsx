import type { ReactNode } from "react"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  /** Render the cell for a row. */
  cell: (row: T) => ReactNode
  align?: "left" | "right" | "center"
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
}

/**
 * Generic, strongly-typed table. Handles loading (skeleton rows) and empty
 * states out of the box, and supports optional row click for navigation.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading = false,
  emptyTitle = "No records",
  emptyDescription = "There's nothing to show here yet.",
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle",
                    alignClass[col.align ?? "left"],
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border transition-colors last:border-0",
                      onRowClick &&
                        "cursor-pointer hover:bg-surface-hover focus-within:bg-surface-hover",
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3.5 text-foreground",
                          alignClass[col.align ?? "left"],
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && data.length === 0 && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className="border-0 bg-transparent"
        />
      )}
    </div>
  )
}
