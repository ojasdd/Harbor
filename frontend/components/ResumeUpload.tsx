"use client";

import { useRef, useState } from "react";
import { uploadApi } from "@/lib/api";
import { Upload, FileText, CheckCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeUploadProps {
  onExtracted: (text: string) => void;
  disabled?: boolean;
}

export function ResumeUpload({ onExtracted, disabled }: ResumeUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    setFileName(file.name);
    try {
      const result = await uploadApi.resume(file, true);
      onExtracted(result.extracted_text);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed. Try a PDF, DOCX, or TXT file.");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragging
            ? "border-[#00d4ff] bg-[#00d4ff]/5"
            : "border-[#2a3a5c] hover:border-[#00d4ff]/50 hover:bg-[#00d4ff]/3",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-[#00d4ff] animate-spin" />
            <p className="text-[#94a3b8] text-sm">Extracting text from resume…</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-[#10b981]" />
            <p className="text-[#10b981] text-sm font-medium">{fileName}</p>
            <p className="text-[#64748b] text-xs">Resume loaded successfully</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
              <Upload className="h-6 w-6 text-[#00d4ff]" />
            </div>
            <div>
              <p className="text-[#e2e8f0] font-medium text-sm">
                Drag & drop your resume
              </p>
              <p className="text-[#64748b] text-xs mt-1">
                PDF, DOCX, or TXT · Max 5 MB
              </p>
            </div>
            <span className="section-label">or click to browse</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt"
          onChange={onFileChange}
          disabled={disabled}
        />
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-[#ef4444] text-xs">
          <X className="h-3.5 w-3.5" /> {error}
        </div>
      )}
    </div>
  );
}
