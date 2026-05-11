// Centralized API client with automatic JWT token injection

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ats_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("ats_token");
      localStorage.removeItem("ats_user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string; role?: string }) =>
    api.post("/api/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data).then((r) => r.data),
  me: () => api.get("/api/auth/me").then((r) => r.data),
  updateMe: (data: { full_name?: string; resume_text?: string }) =>
    api.patch("/api/auth/me", data).then((r) => r.data),
};

// ─── Jobs ────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (activeOnly = true) =>
    api.get("/api/jobs", { params: { active_only: activeOnly } }).then((r) => r.data),
  get: (id: string) => api.get(`/api/jobs/${id}`).then((r) => r.data),
  create: (data: JobCreatePayload) => api.post("/api/jobs", data).then((r) => r.data),
  update: (id: string, data: Partial<JobCreatePayload>) =>
    api.patch(`/api/jobs/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/jobs/${id}`),
};

// ─── Evaluate ────────────────────────────────────────────────────────────────
export const evaluateApi = {
  submit: (data: EvaluatePayload) => api.post("/api/evaluate", data).then((r) => r.data),
  get: (id: string) => api.get(`/api/evaluate/${id}`).then((r) => r.data),
};

// ─── Candidates ──────────────────────────────────────────────────────────────
export const candidatesApi = {
  list: (params?: { decision?: string; job_id?: string }) =>
    api.get("/api/candidates", { params }).then((r) => r.data),
  my: () => api.get("/api/candidates/my").then((r) => r.data),
  exportCsv: () =>
    api.get("/api/candidates/export/csv", { responseType: "blob" }).then((r) => r.data),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  overview: () => api.get("/api/analytics/overview").then((r) => r.data),
  scores: () => api.get("/api/analytics/scores").then((r) => r.data),
  skills: () => api.get("/api/analytics/skills").then((r) => r.data),
  modelPerformance: () => api.get("/api/analytics/model-performance").then((r) => r.data),
  jobsBreakdown: () => api.get("/api/analytics/jobs-breakdown").then((r) => r.data),
};

// ─── Upload ──────────────────────────────────────────────────────────────────
export const uploadApi = {
  resume: (file: File, saveToProfile = true) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post(`/api/upload/resume?save_to_profile=${saveToProfile}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface JobCreatePayload {
  title: string;
  company?: string;
  description: string;
  required_skills?: string[];
  location?: string;
  employment_type?: string;
  salary_range?: string;
  is_active?: boolean;
}

export interface EvaluatePayload {
  job_id: string;
  resume_text: string;
  transcript: string;
  model_name: string;
  thresh_select?: number;
  thresh_consider?: number;
}

export interface Job {
  id: string;
  title: string;
  company?: string;
  description: string;
  required_skills?: string[];
  location?: string;
  employment_type?: string;
  salary_range?: string;
  is_active: boolean;
  created_at: string;
}

export interface Evaluation {
  id: string;
  candidate_id?: string;
  job_id?: string;
  match_score?: number;
  skill_match_ratio?: number;
  num_matched_skills?: number;
  num_missing_skills?: number;
  num_candidate_skills?: number;
  comm_score?: number;
  conf_score?: number;
  subj_score?: number;
  tech_score?: number;
  response_len?: number;
  sentence_cmplx?: number;
  ml_decision?: string;
  ml_confidence?: number;
  rule_decision?: string;
  final_decision?: string;
  explanation?: string;
  model_used?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  job_title?: string;
  job_company?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "candidate" | "recruiter" | "admin";
  resume_text?: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_candidates: number;
  total_selected: number;
  total_consider: number;
  total_rejected: number;
  avg_match_score: number;
  total_jobs: number;
  total_evaluations: number;
}
