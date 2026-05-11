"use client";

import { Evaluation } from "@/lib/api";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CandidateRadarChartProps {
  evaluation: Evaluation;
}

export function CandidateRadarChart({ evaluation }: CandidateRadarChartProps) {
  const data = [
    {
      subject: "Match Score",
      value: Math.min((evaluation.match_score ?? 0) / 100, 1) * 100,
      fullMark: 100,
    },
    {
      subject: "Skill Ratio",
      value: Math.min((evaluation.skill_match_ratio ?? 0), 1) * 100,
      fullMark: 100,
    },
    {
      subject: "Comm Score",
      value: Math.min((evaluation.comm_score ?? 0), 1) * 100,
      fullMark: 100,
    },
    {
      subject: "Tech Depth",
      value: Math.min((evaluation.tech_score ?? 0) * 2, 1) * 100,
      fullMark: 100,
    },
    {
      subject: "Confidence",
      value: Math.min(((evaluation.conf_score ?? 0) + 1) / 2, 1) * 100,
      fullMark: 100,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#2a3a5c" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
        />
        <Radar
          name="Candidate"
          dataKey="value"
          stroke="#00d4ff"
          fill="#00d4ff"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #2a3a5c",
            borderRadius: "8px",
            color: "#e2e8f0",
            fontFamily: "'DM Sans', sans-serif",
          }}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, ""]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
