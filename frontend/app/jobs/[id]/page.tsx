"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { jobsApi, evaluateApi, Job } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ResumeUpload } from "@/components/ResumeUpload";
import { EvaluationResult } from "@/components/EvaluationResult";
import { SkillTags } from "@/components/SkillTags";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Brain,
  Loader2,
  ArrowLeft,
  Lock,
} from "lucide-react";
import Link from "next/link";



export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeText, setResumeText] = useState<string>("");
  const [transcript, setTranscript] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    jobsApi.get(jobId).then(setJob).finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    if (user?.resume_text) setResumeText(user.resume_text);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (!resumeText || !resumeText.trim()) { setError("Please provide your resume text or upload a file."); return; }
    setError("");
    setSubmitting(true);
    try {
      const ev = await evaluateApi.submit({
        job_id: jobId,
        resume_text: resumeText,
        transcript,
        model_name: "rag_evaluator",
      });
      setResult(ev);
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Evaluation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00d4ff] animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#64748b]">Job not found.</p>
        <Link href="/jobs"><Button>Back to Jobs</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-[#64748b] hover:text-[#00d4ff] text-sm mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Job Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-cyber p-6">
              <div className="section-label mb-2">{job.employment_type || "Full-time"}</div>
              <h1 className="font-mono text-2xl font-bold text-white mb-1">{job.title}</h1>
              <div className="space-y-1.5 mt-3 text-sm text-[#64748b]">
                {job.company && <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{job.company}</div>}
                {job.location && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{job.location}</div>}
                {job.salary_range && <div className="flex items-center gap-1.5 text-[#10b981]"><DollarSign className="h-3.5 w-3.5" />{job.salary_range}</div>}
              </div>
            </div>

            <div className="card-cyber p-6">
              <div className="section-label mb-3">Job Description</div>
              <p className="text-[#94a3b8] text-sm leading-relaxed">{job.description}</p>
            </div>

            {job.required_skills && job.required_skills.length > 0 && (
              <div className="card-cyber p-6">
                <div className="section-label mb-3">Required Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {job.required_skills.map((s) => (
                    <span key={s} className="skill-tag">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Application Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card-cyber p-6">
              <div className="flex items-center gap-2 mb-5">
                <Brain className="h-5 w-5 text-[#00d4ff]" />
                <div className="section-label">Submit Your Application</div>
              </div>

              {!isAuthenticated && (
                <div className="p-4 mb-5 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-[#7c3aed]" />
                  <div>
                    <p className="text-[#e2e8f0] text-sm font-medium">Sign in to apply</p>
                    <Link href="/auth/login" className="text-[#00d4ff] text-xs hover:underline">
                      Login or create account →
                    </Link>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Resume Upload */}
                <div className="space-y-2">
                  <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
                    Resume (Upload file or paste text)
                  </Label>
                  <ResumeUpload onExtracted={setResumeText} disabled={!isAuthenticated} />
                  <Textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Or paste your resume text here…"
                    rows={5}
                    className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] text-sm"
                    disabled={!isAuthenticated}
                  />
                </div>

                {/* Transcript */}
                <div className="space-y-1.5">
                  <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
                    Interview Transcript (Optional)
                  </Label>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste interview Q&A here to get communication and confidence scores…"
                    rows={4}
                    className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] text-sm"
                    disabled={!isAuthenticated}
                  />
                </div>



                {error && (
                  <p className="text-[#ef4444] text-sm p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting || !isAuthenticated}
                  className="w-full h-11 bg-[#00d4ff] text-[#0a0e1a] font-bold hover:bg-[#00d4ff]/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Evaluating with AI…
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Evaluate My Application
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Results */}
            {result && (
              <div id="results" className="space-y-2">
                <div className="section-label">Evaluation Results</div>
                <EvaluationResult evaluation={result} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
