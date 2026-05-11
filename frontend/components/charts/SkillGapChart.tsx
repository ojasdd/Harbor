"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SkillChartProps {
  data: Array<{ skill: string; matched_count: number; missing_count: number }>;
}

export function SkillGapChart({ data }: SkillChartProps) {
  const top = data.slice(0, 15);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={top}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#2a3a5c" }} />
        <YAxis
          type="category"
          dataKey="skill"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={{ stroke: "#2a3a5c" }}
          width={75}
        />
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #2a3a5c",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
        />
        <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
        <Bar dataKey="matched_count" name="Matched" fill="#10b981" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
        <Bar dataKey="missing_count" name="Missing" fill="#ef4444" fillOpacity={0.7} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
