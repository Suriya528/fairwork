interface TooltipPayloadItem {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

export interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipPayloadItem[]
  valueFormatter?: (value: number) => string
}

/** Themed tooltip shared by all Recharts charts. */
export function ChartTooltip({
  active,
  label,
  payload,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-border-strong bg-elevated px-3 py-2 text-xs shadow-xl">
      {label !== undefined && (
        <p className="mb-1.5 font-medium text-foreground">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => {
          const numeric =
            typeof item.value === "number" ? item.value : Number(item.value)
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="text-muted">{item.name}</span>
              <span className="ml-auto font-medium tabular-nums text-foreground">
                {valueFormatter && !Number.isNaN(numeric)
                  ? valueFormatter(numeric)
                  : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
