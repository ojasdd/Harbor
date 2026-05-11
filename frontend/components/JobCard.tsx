"use client";

import Link from "next/link";
import { Job } from "@/lib/api";
import { MapPin, Building2, Clock, DollarSign, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: Job;
  showApply?: boolean;
}

export function JobCard({ job, showApply = true }: JobCardProps) {
  return (
    <div className="card-cyber p-6 flex flex-col gap-4 group">
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="section-label mb-1">
            {job.employment_type || "Full-time"}
          </div>
          <h3 className="font-mono text-lg font-bold text-white group-hover:text-[#00d4ff] transition-colors">
            {job.title}
          </h3>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
          <Zap className="h-5 w-5 text-[#00d4ff]" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[#64748b]">
        {job.company && (
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" /> {job.company}
          </span>
        )}
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {job.location}
          </span>
        )}
        {job.salary_range && (
          <span className="flex items-center gap-1 text-[#10b981]">
            <DollarSign className="h-3 w-3" /> {job.salary_range}
          </span>
        )}
      </div>

      <p className="text-[#94a3b8] text-sm line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      {job.required_skills && job.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.required_skills.slice(0, 6).map((skill) => (
            <span key={skill} className="skill-tag text-xs">
              {skill}
            </span>
          ))}
          {job.required_skills.length > 6 && (
            <span className="text-[#64748b] text-xs px-2 py-0.5">
              +{job.required_skills.length - 6} more
            </span>
          )}
        </div>
      )}

      {showApply && (
        <div className="pt-2 border-t border-[#2a3a5c]">
          <Link href={`/jobs/${job.id}`}>
            <Button className="w-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0e1a] transition-all group/btn">
              Apply Now
              <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
