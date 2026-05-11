"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { analyticsApi, AnalyticsOverview } from "@/lib/api";
import { StatsCard } from "@/components/StatsCard";
import { DecisionPie } from "@/components/charts/DecisionPie";
import { ScoreHistogram } from "@/components/charts/ScoreHistogram";
import { SkillGapChart } from "@/components/charts/SkillGapChart";
import {
  Loader2,
  Brain,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [scoreData, setScoreData] = useState<any[]>([]);
  const [skillData, setSkillData] = useState<any[]>([]);
  const [modelPerf, setModelPerf] = useState<any>(null);
  const [jobsBreakdown, setJobsBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      Promise.all([
        analyticsApi.overview(),
        analyticsApi.scores(),
        analyticsApi.skills(),
        analyticsApi.modelPerformance(),
        analyticsApi.jobsBreakdown(),
      ])
        .then(([ov, sc, sk, mp, jb]) => {
          setOverview(ov);
          setScoreData(sc);
          setSkillData(sk);
          setModelPerf(mp);
          setJobsBreakdown(jb);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00d4ff] animate-spin" />
      </div>
    );
  }

  const modelScores = modelPerf?.model_scores
    ? Object.entries(modelPerf.model_scores).map(([name, scores]: [string, any]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        accuracy: +(scores.accuracy * 100).toFixed(1),
        f1: +(scores.f1 * 100).toFixed(1),
        roc_auc: +(scores.roc_auc * 100).toFixed(1),
      }))
    : [];

  return (
    <div className="min-h-screen grid-bg px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="section-label mb-1">ADMIN PANEL</div>
          <h1 className="font-mono text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-[#64748b] text-sm mt-1">
            Platform-wide insights, model performance, and hiring analytics.
          </p>
        </div>

        {/* Overview */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <StatsCard value={overview.total_evaluations} label="Total Evals" color="#00d4ff" icon={<Brain className="h-5 w-5 text-[#00d4ff]" />} />
            <StatsCard value={overview.total_candidates} label="Candidates" color="#7c3aed" icon={<Users className="h-5 w-5 text-[#7c3aed]" />} />
            <StatsCard value={overview.total_jobs} label="Jobs" color="#f59e0b" icon={<Briefcase className="h-5 w-5 text-[#f59e0b]" />} />
            <StatsCard value={overview.total_selected} label="Selected" color="#10b981" icon={<CheckCircle className="h-5 w-5 text-[#10b981]" />} />
            <StatsCard value={overview.total_consider} label="Consider" color="#f59e0b" icon={<AlertTriangle className="h-5 w-5 text-[#f59e0b]" />} />
            <StatsCard value={overview.total_rejected} label="Rejected" color="#ef4444" icon={<XCircle className="h-5 w-5 text-[#ef4444]" />} />
            <StatsCard value={`${overview.avg_match_score.toFixed(1)}%`} label="Avg Match" color="#00d4ff" icon={<TrendingUp className="h-5 w-5 text-[#00d4ff]" />} />
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="card-cyber p-5">
            <div className="section-label mb-4">Decision Distribution</div>
            {overview && (
              <DecisionPie
                selected={overview.total_selected}
                consider={overview.total_consider}
                rejected={overview.total_rejected}
              />
            )}
          </div>
          <div className="card-cyber p-5">
            <div className="section-label mb-4">Match Score Distribution</div>
            <ScoreHistogram data={scoreData} />
          </div>
        </div>

        {/* Model Performance */}
        {modelScores.length > 0 && (
          <div className="card-cyber p-5 mb-6">
            <div className="section-label mb-4">Model Performance Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modelScores} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#2a3a5c" }} />
                <YAxis domain={[80, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#2a3a5c" }} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #2a3a5c", borderRadius: "8px", color: "#e2e8f0" }}
                  formatter={(v) => [`${String(v)}%`]}
                />
                <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="accuracy" name="Accuracy" fill="#00d4ff" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Bar dataKey="f1" name="F1 Score" fill="#7c3aed" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Bar dataKey="roc_auc" name="ROC AUC" fill="#10b981" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Skills & Jobs */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-cyber p-5">
            <div className="section-label mb-4">Skill Gap Analysis (Top 15)</div>
            <SkillGapChart data={skillData} />
          </div>
          {jobsBreakdown.length > 0 && (
            <div className="card-cyber p-5">
              <div className="section-label mb-4">Evaluations by Job Role</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={jobsBreakdown.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5c" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#2a3a5c" }} />
                  <YAxis type="category" dataKey="job_title" tick={{ fill: "#94a3b8", fontSize: 9 }} width={75} axisLine={{ stroke: "#2a3a5c" }} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #2a3a5c", borderRadius: "8px", color: "#e2e8f0" }}
                  />
                  <Bar dataKey="total" name="Total Applications" fill="#00d4ff" fillOpacity={0.7} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="selected" name="Selected" fill="#10b981" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
