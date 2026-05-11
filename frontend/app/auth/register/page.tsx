"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "candidate";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter">(
    defaultRole === "recruiter" ? "recruiter" : "candidate"
  );
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.register({ email, password, full_name: fullName, role });
      login(data.token, data.user);
      if (role === "recruiter") router.push("/recruiter");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 mb-4">
            <Brain className="h-7 w-7 text-[#7c3aed]" />
          </div>
          <div className="section-label mb-1">CREATE ACCOUNT</div>
          <h1 className="font-mono text-2xl font-bold text-white">Join ATS Intelligence</h1>
        </div>

        <div className="card-cyber p-8">
          {/* Role Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-[#0a0e1a] rounded-lg border border-[#2a3a5c]">
            {(["candidate", "recruiter"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all font-mono uppercase tracking-wider ${
                  role === r
                    ? "bg-[#00d4ff] text-[#0a0e1a]"
                    : "text-[#64748b] hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] text-sm">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="pl-9 bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="pl-9 bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={6}
                  className="pl-9 bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
            </div>

            {role === "candidate" && (
              <div className="space-y-1.5">
                <Label className="text-[#94a3b8] text-xs uppercase tracking-wider">
                  Resume (Optional — upload now or later)
                </Label>
                <ResumeUpload onExtracted={setResumeText} />
                {resumeText && (
                  <p className="text-[#10b981] text-xs">
                    ✓ Resume extracted ({resumeText.length} characters)
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-bold"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#64748b]">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#00d4ff] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
