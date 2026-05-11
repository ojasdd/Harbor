"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { candidatesApi, Evaluation } from "@/lib/api";
import { EvaluationResult } from "@/components/EvaluationResult";
import { StatsCard } from "@/components/StatsCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain,
  Target,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/auth/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      candidatesApi.my().then(setEvaluations).finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const avgScore =
    evaluations.length > 0
      ? evaluations.reduce((s, e) => s + (e.match_score || 0), 0) / evaluations.length
      : 0;

  const selected = evaluations.filter(
    (e) => e.final_decision?.toUpperCase() === "SELECT"
  ).length;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00d4ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="section-label mb-1">MY DASHBOARD</div>
          <h1 className="font-mono text-3xl font-bold text-white">
            Welcome back, {user?.full_name || user?.email}
          </h1>
          <p className="text-[#64748b] mt-1 text-sm">
            Track your application evaluations and ATS scores below.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatsCard value={evaluations.length} label="Applications" color="#00d4ff" icon={<Brain className="h-5 w-5 text-[#00d4ff]" />} />
          <StatsCard value={selected} label="Selected" color="#10b981" icon={<Target className="h-5 w-5 text-[#10b981]" />} />
          <StatsCard value={`${avgScore.toFixed(1)}%`} label="Avg Match" color="#7c3aed" />
          <StatsCard
            value={evaluations.length > 0 ? new Date(evaluations[0].created_at).toLocaleDateString() : "—"}
            label="Last Applied"
            color="#f59e0b"
            icon={<Clock className="h-5 w-5 text-[#f59e0b]" />}
          />
        </div>

        {/* Evaluations */}
        {evaluations.length === 0 ? (
          <div className="card-cyber p-16 text-center">
            <Briefcase className="h-14 w-14 mx-auto mb-4 text-[#2a3a5c]" />
            <h2 className="font-mono text-xl font-bold text-white mb-2">No applications yet</h2>
            <p className="text-[#64748b] mb-6">
              Browse jobs and submit your first application to see AI-powered evaluation results here.
            </p>
            <Link href="/jobs">
              <Button className="bg-[#00d4ff] text-[#0a0e1a] font-bold">Browse Jobs</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="section-label">Application History</div>
            {evaluations.map((ev) => {
              const isOpen = expanded === ev.id;
              const dec = (ev.final_decision || "REJECT").toUpperCase();
              const decColor =
                dec === "SELECT" ? "#10b981" : dec === "CONSIDER" ? "#f59e0b" : "#ef4444";
              const decClass =
                dec === "SELECT"
                  ? "badge-select"
                  : dec === "CONSIDER"
                  ? "badge-consider"
                  : "badge-reject";

              return (
                <div key={ev.id} className="card-cyber">
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setExpanded(isOpen ? null : ev.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-mono font-bold text-white">
                          {ev.job_title || "Job"}
                        </div>
                        <div className="text-[#64748b] text-xs mt-0.5">
                          {ev.job_company} · {new Date(ev.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold" style={{ color: decColor }}>
                        {(ev.match_score || 0).toFixed(1)}%
                      </span>
                      <span className={decClass}>{dec}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#64748b]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#64748b]" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-[#2a3a5c] pt-5">
                      <EvaluationResult evaluation={ev} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
