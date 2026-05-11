"use client";

import { cn } from "@/lib/utils";

interface StatsCardProps {
  value: string | number;
  label: string;
  color?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export function StatsCard({ value, label, color = "#00d4ff", icon, subtitle }: StatsCardProps) {
  return (
    <div className="card-cyber p-5 text-center group cursor-default">
      {icon && (
        <div className="flex justify-center mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
      )}
      <div
        className="font-mono text-3xl font-bold mb-1 transition-all group-hover:drop-shadow-[0_0_8px_currentColor]"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[#64748b] text-xs uppercase tracking-widest font-medium">{label}</div>
      {subtitle && <div className="text-[#94a3b8] text-xs mt-1">{subtitle}</div>}
    </div>
  );
}
