"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ScoreHistogramProps {
  data: Array<{ match_score: number; final_decision?: string }>;
}

export function ScoreHistogram({ data }: ScoreHistogramProps) {
  // Create 10-point buckets
  const buckets: Record<string, number> = {};
  for (let i = 0; i < 100; i += 10) {
    buckets[`${i}-${i + 10}`] = 0;
  }
  data.forEach((d) => {
    const score = d.match_score ?? 0;
    const bucketIdx = Math.min(Math.floor(score / 10), 9);
    const key = `${bucketIdx * 10}-${bucketIdx * 10 + 10}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  const chartData = Object.entries(buckets).map(([range, count]) => ({
    range,
    count,
    start: parseInt(range.split("-")[0]),
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" vertical={false} />
        <XAxis
          dataKey="range"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={{ stroke: "#2a3a5c" }}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={{ stroke: "#2a3a5c" }}
        />
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #2a3a5c",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
          formatter={(v) => [v as React.ReactNode, "Candidates"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.range}
              fill={
                entry.start >= 70
                  ? "#10b981"
                  : entry.start >= 50
                  ? "#f59e0b"
                  : "#ef4444"
              }
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
