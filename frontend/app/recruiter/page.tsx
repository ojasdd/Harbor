"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  analyticsApi,
  candidatesApi,
  jobsApi,
  Evaluation,
  Job,
  AnalyticsOverview,
} from "@/lib/api";
import { StatsCard } from "@/components/StatsCard";
import { DecisionPie } from "@/components/charts/DecisionPie";
import { ScoreHistogram } from "@/components/charts/ScoreHistogram";
import { SkillGapChart } from "@/components/charts/SkillGapChart";
import { EvaluationResult } from "@/components/EvaluationResult";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Download,
  Plus,
  Brain,
  Users,
  Briefcase,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function RecruiterPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [candidates, setCandidates] = useState<Evaluation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [skillData, setSkillData] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filterDecision, setFilterDecision] = useState<string>("ALL");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !["recruiter", "admin"].includes(user?.role || ""))) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && ["recruiter", "admin"].includes(user?.role || "")) {
      Promise.all([
        analyticsApi.overview(),
        candidatesApi.list(),
        jobsApi.list(false),
        analyticsApi.skills(),
        analyticsApi.scores(),
      ])
        .then(([ov, cands, j, sk, sc]) => {
          setOverview(ov);
          setCandidates(cands);
          setJobs(j);
          setSkillData(sk);
          setScoreData(sc);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, user]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await candidatesApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ats_candidates.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Delete this job?")) return;
    await jobsApi.delete(jobId);
    setJobs((j) => j.filter((job) => job.id !== jobId));
  };

  const filteredCandidates =
    filterDecision === "ALL"
      ? candidates
      : candidates.filter(
          (c) => (c.final_decision || "").toUpperCase() === filterDecision
        );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00d4ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg px-4 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="section-label mb-1">RECRUITER PANEL</div>
            <h1 className="font-mono text-3xl font-bold text-white">Recruiting Dashboard</h1>
            <p className="text-[#64748b] text-sm mt-1">
              Manage jobs, review candidates, and export reports.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="border-[#2a3a5c] text-[#94a3b8] hover:border-[#00d4ff] hover:text-[#00d4ff]"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Export CSV
            </Button>
            <Link href="/recruiter/jobs/new">
              <Button className="bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-bold">
                <Plus className="h-4 w-4 mr-1" /> New Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <StatsCard value={overview.total_evaluations} label="Evaluations" color="#00d4ff" icon={<Brain className="h-5 w-5 text-[#00d4ff]" />} />
            <StatsCard value={overview.total_candidates} label="Candidates" color="#7c3aed" icon={<Users className="h-5 w-5 text-[#7c3aed]" />} />
            <StatsCard value={overview.total_jobs} label="Active Jobs" color="#f59e0b" icon={<Briefcase className="h-5 w-5 text-[#f59e0b]" />} />
            <StatsCard value={overview.total_selected} label="Selected" color="#10b981" />
            <StatsCard value={overview.total_consider} label="Consider" color="#f59e0b" />
            <StatsCard value={overview.total_rejected} label="Rejected" color="#ef4444" />
            <StatsCard value={`${overview.avg_match_score.toFixed(1)}%`} label="Avg Match" color="#00d4ff" icon={<TrendingUp className="h-5 w-5 text-[#00d4ff]" />} />
          </div>
        )}

        <Tabs defaultValue="candidates">
          <TabsList className="bg-[#111827] border border-[#2a3a5c] mb-6 h-10">
            {[
              { value: "candidates", label: "Candidates" },
              { value: "analytics", label: "Analytics" },
              { value: "jobs", label: "Job Listings" },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0e1a] text-[#94a3b8] font-mono text-xs uppercase tracking-wider"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Candidates Tab */}
          <TabsContent value="candidates">
            <div className="flex gap-2 mb-4">
              {["ALL", "SELECT", "CONSIDER", "REJECT"].map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterDecision(d)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase transition-all ${
                    filterDecision === d
                      ? "bg-[#00d4ff] text-[#0a0e1a]"
                      : "border border-[#2a3a5c] text-[#64748b] hover:border-[#00d4ff] hover:text-[#00d4ff]"
                  }`}
                >
                  {d} {d !== "ALL" && `(${candidates.filter((c) => (c.final_decision || "").toUpperCase() === d).length})`}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredCandidates.slice(0, 50).map((ev) => {
                const isOpen = expanded === ev.id;
                const dec = (ev.final_decision || "REJECT").toUpperCase();
                const decColor = dec === "SELECT" ? "#10b981" : dec === "CONSIDER" ? "#f59e0b" : "#ef4444";

                return (
                  <div key={ev.id} className="card-cyber">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left"
                      onClick={() => setExpanded(isOpen ? null : ev.id)}
                    >
                      <div className="grid grid-cols-4 gap-4 flex-1 text-sm">
                        <div>
                          <div className="text-white font-medium">{ev.job_title || "Unknown Job"}</div>
                          <div className="text-[#64748b] text-xs">{ev.job_company}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono font-bold" style={{ color: decColor }}>
                            {(ev.match_score || 0).toFixed(1)}%
                          </div>
                          <div className="text-[#64748b] text-xs">Match</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-[#00d4ff] font-bold">
                            {(ev.ml_confidence || 0).toFixed(0)}%
                          </div>
                          <div className="text-[#64748b] text-xs">Confidence</div>
                        </div>
                        <div className="text-center">
                          <span
                            className={
                              dec === "SELECT"
                                ? "badge-select"
                                : dec === "CONSIDER"
                                ? "badge-consider"
                                : "badge-reject"
                            }
                          >
                            {dec}
                          </span>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#64748b] ml-3" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#64748b] ml-3" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-[#2a3a5c] pt-5">
                        <EvaluationResult evaluation={ev} />
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredCandidates.length === 0 && (
                <div className="text-center py-12 text-[#64748b]">No candidates found.</div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid lg:grid-cols-2 gap-6">
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
              <div className="card-cyber p-5 lg:col-span-2">
                <div className="section-label mb-4">Top Skills — Matched vs Missing</div>
                <SkillGapChart data={skillData} />
              </div>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="card-cyber p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono font-bold text-white">{job.title}</div>
                      <div className="text-[#64748b] text-xs mt-0.5">{job.company}</div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono ${
                        job.is_active
                          ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30"
                          : "bg-[#64748b]/15 text-[#64748b] border border-[#64748b]/30"
                      }`}
                    >
                      {job.is_active ? "ACTIVE" : "CLOSED"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#2a3a5c] text-[#94a3b8] hover:border-[#ef4444] hover:text-[#ef4444] text-xs"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#7c3aed]/20 border border-[#7c3aed]/30 text-[#7c3aed] hover:bg-[#7c3aed]/30 text-xs"
                      onClick={() => jobsApi.update(job.id, { is_active: !job.is_active }).then(() =>
                        setJobs((j) => j.map((x) => x.id === job.id ? { ...x, is_active: !x.is_active } : x))
                      )}
                    >
                      {job.is_active ? "Close" : "Reopen"}
                    </Button>
                  </div>
                </div>
              ))}
              <Link href="/recruiter/jobs/new">
                <div className="card-cyber p-5 border-dashed border-[#2a3a5c] hover:border-[#7c3aed] flex flex-col items-center justify-center gap-3 h-full min-h-[140px] cursor-pointer transition-all">
                  <Plus className="h-8 w-8 text-[#7c3aed] opacity-60" />
                  <span className="section-label">Post New Job</span>
                </div>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
