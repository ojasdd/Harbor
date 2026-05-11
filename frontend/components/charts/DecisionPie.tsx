"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DecisionPieProps {
  selected: number;
  consider: number;
  rejected: number;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export function DecisionPie({ selected, consider, rejected }: DecisionPieProps) {
  const data = [
    { name: "Selected", value: selected },
    { name: "Consider", value: consider },
    { name: "Rejected", value: rejected },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.85}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #2a3a5c",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
        />
        <Legend
          formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
