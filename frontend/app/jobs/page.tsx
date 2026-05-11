import { Job, jobsApi } from "@/lib/api";
import { JobCard } from "@/components/JobCard";
import { Search, Briefcase } from "lucide-react";

async function getJobs(): Promise<Job[]> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_URL}/api/jobs?active_only=true&limit=50`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Browse Jobs — ATS Intelligence",
  description: "Browse open positions and apply with AI-powered resume screening.",
};

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <div className="min-h-screen grid-bg px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="section-label mb-2">OPEN POSITIONS</div>
          <h1 className="font-mono text-4xl font-bold text-white mb-2">Browse Jobs</h1>
          <p className="text-[#64748b]">
            Select a role to apply. Our AI will evaluate your resume against the job description instantly.
          </p>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6 text-[#94a3b8] text-sm">
          <Briefcase className="h-4 w-4 text-[#00d4ff]" />
          <span>
            <span className="text-[#00d4ff] font-mono font-bold">{jobs.length}</span> positions available
          </span>
        </div>

        {jobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-[#64748b]">
            <Briefcase className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No jobs available right now.</p>
            <p className="text-sm mt-2">Make sure the backend is running and the database is seeded.</p>
            <code className="text-xs text-[#00d4ff] mt-3 block">
              psql -d ats_intelligence -f backend/seed.sql
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
