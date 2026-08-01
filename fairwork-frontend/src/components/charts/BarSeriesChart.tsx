import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartTooltip } from "./ChartTooltip"

export interface BarSeriesKey {
  key: string
  label: string
  color: string
}

export interface BarSeriesChartProps {
  data: Array<Record<string, string | number>>
  xKey: string
  series: BarSeriesKey[]
  height?: number
  valueFormatter?: (value: number) => string
}

/**
 * Reusable grouped bar chart wired to the design tokens.
 * Mirrors the API of AreaTrendChart so charts stay consistent.
 */
export function BarSeriesChart({
  data,
  xKey,
  series,
  height = 260,
  valueFormatter,
}: BarSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey={xKey}
          stroke="var(--color-subtle)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-subtle)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={valueFormatter} />}
          cursor={{ fill: "var(--color-surface-hover)" }}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
