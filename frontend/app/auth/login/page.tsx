"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      login(data.token, data.user);
      const role = data.user.role;
      if (role === "admin") router.push("/admin");
      else if (role === "recruiter") router.push("/recruiter");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 mb-4">
            <Brain className="h-7 w-7 text-[#00d4ff]" />
          </div>
          <div className="section-label mb-1">SIGN IN</div>
          <h1 className="font-mono text-2xl font-bold text-white">ATS Intelligence</h1>
          <p className="text-[#64748b] text-sm mt-1">Enter your credentials to continue</p>
        </div>

        {/* Form */}
        <div className="card-cyber p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#94a3b8] text-xs uppercase tracking-wider">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                <Input
                  id="email"
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
              <Label htmlFor="password" className="text-[#94a3b8] text-xs uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-9 bg-[#0a0e1a] border-[#2a3a5c] text-white placeholder:text-[#64748b] h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#00d4ff] text-[#0a0e1a] hover:bg-[#00d4ff]/90 font-bold"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#64748b]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-[#00d4ff] hover:underline font-medium">
              Create one
            </Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 card-cyber p-4">
          <div className="section-label mb-3">DEMO ACCOUNTS</div>
          <div className="space-y-2 text-xs text-[#64748b]">
            {[
              { label: "Candidate", email: "candidate@ats.ai", pass: "candidate123", color: "#00d4ff" },
              { label: "Recruiter", email: "recruiter@ats.ai", pass: "recruiter123", color: "#7c3aed" },
              { label: "Admin",     email: "admin@ats.ai",     pass: "admin123",     color: "#f59e0b" },
            ].map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                className="w-full flex justify-between items-center px-3 py-2 rounded-md border border-[#2a3a5c] hover:border-current transition-all"
                style={{ color: acc.color }}
              >
                <span className="font-mono text-xs">{acc.label}</span>
                <code className="text-xs opacity-80">{acc.email}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
