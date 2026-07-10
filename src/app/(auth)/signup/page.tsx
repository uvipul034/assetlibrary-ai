"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { z } from "zod";

/**
 * Zod schema for signup validation.
 * Enforces email format and a strong password policy.
 */
const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

type FieldErrors = Partial<Record<keyof SignupFormData, string>>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation with Zod
    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignupFormData | undefined;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    // Only call supabase.auth.signUp() — the database trigger
    // handle_new_user() automatically creates the profiles row.
    const { error: authError } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="login-page">
        <div className="login-container">
          <div className="signup-success" id="signup-success">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="24" cy="24" r="24" fill="#00B894" opacity="0.15" />
                <path d="M16 24l6 6 10-12" stroke="#00B894" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h2>Check your email</h2>
            <p>
              We sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="btn btn-primary btn-full"
              type="button"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-container">
        {/* Branding */}
        <div className="login-header">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="40" height="40" rx="10" fill="url(#logo-gradient-signup)" />
              <path d="M12 28V12h4l4 8 4-8h4v16h-4V19l-4 7-4-7v9h-4z" fill="white" />
              <defs>
                <linearGradient id="logo-gradient-signup" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6C5CE7" />
                  <stop offset="1" stopColor="#A29BFE" />
                </linearGradient>
              </defs>
            </svg>
            <h1>Create Account</h1>
          </div>
          <p className="login-subtitle">Start managing your digital assets with AI</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="login-form" id="signup-form">
          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={loading}
              className={`form-input ${fieldErrors.email ? "form-input-error" : ""}`}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className={`form-input ${fieldErrors.password ? "form-input-error" : ""}`}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password" className="form-label">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className={`form-input ${fieldErrors.confirmPassword ? "form-input-error" : ""}`}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {error && (
            <div className="form-error" role="alert" id="signup-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
            id="signup-submit"
          >
            {loading ? (
              <span className="btn-loading">
                <svg className="spinner" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="15" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="login-footer">
          Already have an account?{" "}
          <Link href="/login" className="login-link">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
