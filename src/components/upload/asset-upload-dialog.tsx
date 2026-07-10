"use client";

import { useState, useRef } from "react";
import { uploadSchema, type UploadFormData } from "@/lib/validations/upload";
import { useRouter } from "next/navigation";

export function AssetUploadDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UploadFormData, string>>>({});
  
  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-fill title if empty, removing extension
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      
      // Clear file error when a file is selected
      setFieldErrors(prev => ({ ...prev, file: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate with Zod
    if (!file) {
      setFieldErrors({ file: "Please select a file" });
      return;
    }

    const result = uploadSchema.safeParse({ file, title });
    if (!result.success) {
      const errors: Partial<Record<keyof UploadFormData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof UploadFormData | undefined;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // Create FormData to send to the API route
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Reset and close on success
      setFile(null);
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      router.refresh(); // Refresh dashboard data
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Upload Asset</h2>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="form-group">
            <label className="form-label" htmlFor="file-upload">File</label>
            <input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={loading}
              className={`block w-full text-sm text-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary/10 file:text-primary
                hover:file:bg-primary/20
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                border border-border rounded-md
                ${fieldErrors.file ? "border-destructive" : ""}`}
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            />
            {fieldErrors.file && (
              <span className="field-error mt-1">{fieldErrors.file}</span>
            )}
            <p className="text-xs text-muted mt-1">
              Max 10MB. Images and MP4/WebM videos supported.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="asset-title">Title</label>
            <input
              id="asset-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="E.g., Summer Campaign Logo"
              className={`form-input ${fieldErrors.title ? "form-input-error" : ""}`}
            />
            {fieldErrors.title && (
              <span className="field-error mt-1">{fieldErrors.title}</span>
            )}
          </div>

          {error && (
            <div className="form-error mt-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-demo"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <span className="btn-loading">
                  <svg className="spinner" width="16" height="16" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="15" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                "Upload Asset"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
