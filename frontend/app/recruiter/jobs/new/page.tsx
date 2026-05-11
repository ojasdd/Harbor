"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { jobsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";

const SKILL_SUGGESTIONS = [
  "python", "javascript", "typescript", "java", "sql", "machine learning",
  "deep learning", "nlp", "docker", "kubernetes", "aws", "gcp", "azure",
  "react", "node.js", "tensorflow", "pytorch", "spark", "airflow",
];

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState(user?.full_name || "");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [salaryRange, setSalaryRange] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSkill = (s: string) => {
    const clean = s.toLowerCase().trim();
    if (clean && !skills.includes(clean)) setSkills([...skills, clean]);
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills(skills.filter((sk) => sk !== s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) { setError("Title and description are required."); return; }
    setError("");
    setLoading(true);
    try {
      await jobsApi.create({
        title, company, description,
        required_skills: skills,
        location, employment_type: employmentType, salary_range: salaryRange,
      });
      router.push("/recruiter");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/recruiter" className="inline-flex items-center gap-1.5 text-[#64748b] hover:text-[#00d4ff] text-sm mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="section-label mb-2">NEW POSITION</div>
        <h1 className="font-mono text-3xl font-bold text-white mb-8">Post a Job</h1>

        <div className="card-cyber p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] text-sm">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Job Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Senior Data Scientist"
                  required
                  className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="TechCorp Inc"
                  className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Remote / New York, NY"
                  className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Employment Type</Label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full h-11 rounded-md border border-[#2a3a5c] bg-[#0a0e1a] text-white px-3 text-sm focus:border-[#00d4ff] outline-none"
                >
                  {["Full-time", "Part-time", "Contract", "Internship"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Salary Range</Label>
                <Input
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="$120,000 – $160,000"
                  className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
                Job Description * (The AI will use this to evaluate candidates)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and what you're looking for…"
                rows={8}
                required
                className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] text-sm"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Type skill and press Enter…"
                  className="bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-10"
                />
                <Button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="bg-[#7c3aed]/20 border border-[#7c3aed]/30 text-[#7c3aed] hover:bg-[#7c3aed]/40 h-10 px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {/* Skill suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 12).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="text-xs px-2 py-1 rounded border border-[#2a3a5c] text-[#64748b] hover:border-[#7c3aed] hover:text-[#a78bfa] transition-all"
                  >
                    + {s}
                  </button>
                ))}
              </div>
              {/* Selected skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="skill-tag flex items-center gap-1 cursor-pointer"
                      onClick={() => removeSkill(s)}
                    >
                      {s} <X className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#00d4ff] text-[#0a0e1a] font-bold hover:bg-[#00d4ff]/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Post Job
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
