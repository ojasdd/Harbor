"use client";

interface SkillTagsProps {
  matched: string[];
  missing: string[];
}

export function SkillTags({ matched, missing }: SkillTagsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {matched.map((skill) => (
        <span key={`m-${skill}`} className="skill-tag">
          ✓ {skill}
        </span>
      ))}
      {missing.map((skill) => (
        <span key={`x-${skill}`} className="skill-tag skill-tag-missing">
          ✗ {skill}
        </span>
      ))}
    </div>
  );
}
