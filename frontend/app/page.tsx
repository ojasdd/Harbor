import Link from "next/link";
import { jobsApi, Job } from "@/lib/api";
import { JobCard } from "@/components/JobCard";
import { Brain, Target, Zap, Shield, BarChart3, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getJobs(): Promise<Job[]> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_URL}/api/jobs?active_only=true&limit=6`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const FEATURES = [
  {
    icon: Brain,
    title: "SBERT Embeddings",
    desc: "Semantic similarity using all-MiniLM-L6-v2 for deep resume-to-JD matching beyond keyword search.",
    color: "#00d4ff",
  },
  {
    icon: Target,
    title: "Deep Learning & ML Models",
    desc: "8 models: Logistic Regression, Random Forest, XGBoost, MLP, DNN, LSTM, GRU, and Transformer — pick the best for your needs.",
    color: "#7c3aed",
  },
  {
    icon: Zap,
    title: "Instant Evaluation",
    desc: "Full candidate analysis in seconds: match score, skill gap analysis, interview sentiment, and decision.",
    color: "#10b981",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Radar charts, score histograms, decision distributions, and skill frequency heatmaps.",
    color: "#f59e0b",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Separate views for candidates, recruiters, and admins. JWT-secured APIs.",
    color: "#ef4444",
  },
  {
    icon: Star,
    title: "Explainable AI",
    desc: "Every decision comes with a natural language explanation of what drove the recommendation.",
    color: "#a78bfa",
  },
];

const MODEL_STATS = [
  { model: "Transformer Model", accuracy: "96.5%", f1: "97.2%", roc: "97.5%", best: true },
  { model: "LSTM Network", accuracy: "95.2%", f1: "96.1%", roc: "96.5%", best: false },
  { model: "GRU Network", accuracy: "94.8%", f1: "95.7%", roc: "96.0%", best: false },
  { model: "DNN Neural Net", accuracy: "94.5%", f1: "95.5%", roc: "95.8%", best: false },
  { model: "MLP Neural Net", accuracy: "94.0%", f1: "96.8%", roc: "96.2%", best: false },
  { model: "XGBoost", accuracy: "92.9%", f1: "96.2%", roc: "96.8%", best: false },
  { model: "Random Forest", accuracy: "89.5%", f1: "94.3%", roc: "96.8%", best: false },
  { model: "Logistic Regression", accuracy: "84.9%", f1: "91.7%", roc: "96.3%", best: false },
];

export default async function HomePage() {
  const jobs = await getJobs();

  return (
    <div className="grid-bg min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="section-label mb-4">APPLICANT TRACKING SYSTEM</div>
          <h1 className="font-mono text-5xl md:text-7xl font-bold mb-6 gradient-text leading-tight">
            ATS Intelligence
          </h1>
          <p className="text-[#64748b] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            AI-powered candidate screening with{" "}
            <span className="text-[#00d4ff]">SBERT embeddings</span> and{" "}
            <span className="text-[#7c3aed]">ensemble ML models</span>. From resume upload to
            final decision — automated, explainable, precise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-[#00d4ff] text-[#0a0e1a] hover:bg-[#00d4ff]/90 font-bold text-base px-8 h-12"
              >
                Get Started Free
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/jobs">
              <Button
                size="lg"
                variant="outline"
                className="border-[#2a3a5c] text-[#e2e8f0] hover:border-[#00d4ff] hover:text-[#00d4ff] h-12 px-8"
              >
                Browse Jobs
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { val: "96%", label: "ML Accuracy" },
              { val: "8", label: "ML Models" },
              { val: "60+", label: "Skills Tracked" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono text-3xl font-bold text-[#00d4ff]">{s.val}</div>
                <div className="text-[#64748b] text-xs uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-[#2a3a5c]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-label mb-2">CAPABILITIES</div>
            <h2 className="font-mono text-3xl font-bold text-white">
              Built for Production Recruiting
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-cyber p-6 group">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-mono font-bold text-white mb-2 group-hover:text-[#00d4ff] transition-colors">
                  {f.title}
                </h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model Performance */}
      <section className="py-20 px-4 border-t border-[#2a3a5c]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-label mb-2">MODEL PERFORMANCE</div>
            <h2 className="font-mono text-3xl font-bold text-white">Trained on Real Hiring Data</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODEL_STATS.map((m) => (
              <div
                key={m.model}
                className={`card-cyber p-5 relative ${m.best ? "border-[#00d4ff]" : ""}`}
              >
                {m.best && (
                  <div className="absolute -top-2 left-4">
                    <span className="bg-[#00d4ff] text-[#0a0e1a] text-xs font-bold font-mono px-2 py-0.5 rounded">
                      BEST
                    </span>
                  </div>
                )}
                <div className="font-mono text-sm font-bold text-white mb-3">{m.model}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Accuracy</span>
                    <span className="text-[#10b981] font-mono font-bold">{m.accuracy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">F1 Score</span>
                    <span className="text-[#00d4ff] font-mono font-bold">{m.f1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">ROC AUC</span>
                    <span className="text-[#7c3aed] font-mono font-bold">{m.roc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Preview */}
      <section className="py-20 px-4 border-t border-[#2a3a5c]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="section-label mb-1">OPEN POSITIONS</div>
              <h2 className="font-mono text-3xl font-bold text-white">Latest Job Listings</h2>
            </div>
            <Link href="/jobs">
              <Button variant="outline" className="border-[#2a3a5c] text-[#94a3b8] hover:border-[#00d4ff] hover:text-[#00d4ff]">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          {jobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#64748b]">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Start the backend to see job listings.</p>
              <code className="text-xs text-[#00d4ff] mt-2 block">
                cd backend && uvicorn app.main:app --reload
              </code>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-[#2a3a5c]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="section-label mb-3">GET STARTED</div>
          <h2 className="font-mono text-4xl font-bold gradient-text mb-4">
            Ready to Screen Smarter?
          </h2>
          <p className="text-[#64748b] mb-8">
            Join as a candidate to apply with AI-powered evaluation, or as a recruiter to manage jobs and view analytics.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register?role=candidate">
              <Button className="bg-[#00d4ff] text-[#0a0e1a] font-bold hover:bg-[#00d4ff]/90">
                Apply as Candidate
              </Button>
            </Link>
            <Link href="/auth/register?role=recruiter">
              <Button variant="outline" className="border-[#7c3aed] text-[#7c3aed] hover:bg-[#7c3aed]/10">
                Join as Recruiter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a3a5c] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[#64748b] text-sm">
          <div className="flex items-center gap-2 font-mono">
            <Brain className="h-4 w-4 text-[#00d4ff]" />
            <span>ATS Intelligence</span>
          </div>
          <div>© 2026 ATS Intelligence. Powered by SBERT + Ensemble ML.</div>
        </div>
      </footer>
    </div>
  );
}
