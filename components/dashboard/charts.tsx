"use client";

// Primitivas de gráfico do dashboard (recharts). Componentes-folha pequenos:
// recebem dados já calculados via props e não buscam nada. O resto do
// dashboard continua Server Component — só estes gráficos são client.

import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Mini-gráfico de tendência, sem eixos — usado dentro dos cards de KPI. */
export function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const gid = "spark" + useId().replace(/:/g, "");
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#${gid})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// recharts injeta active/payload/label em runtime — tipamos só o necessário.
type TrendTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string }[];
  unit: string;
};

function TrendTooltip({ active, payload, label, unit }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-medium text-popover-foreground">{label}</div>
      <div className="text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">
          {payload[0].value}
        </span>{" "}
        {unit}
      </div>
    </div>
  );
}

/** Gráfico de área com eixos discretos — série temporal (ritmo de atividade). */
export function AreaTrend({
  data,
  color,
  unit = "",
  height = 168,
}: {
  data: { label: string; value: number }[];
  color: string;
  unit?: string;
  height?: number;
}) {
  const gid = "area" + useId().replace(/:/g, "");
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          interval="preserveStartEnd"
          minTickGap={26}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
          content={<TrendTooltip unit={unit} />}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gid})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
