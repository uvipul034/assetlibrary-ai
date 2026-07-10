"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

/** Demo credentials for reviewers — each maps to a different role */
const DEMO_ACCOUNTS = [
  { label: "Admin Demo", email: "admin@assetlibrary.demo", password: "demo-admin-2024!", role: "admin" as const },
  { label: "Manager Demo", email: "manager@assetlibrary.demo", password: "demo-manager-2024!", role: "manager" as const },
  { label: "Editor Demo", email: "editor@assetlibrary.demo", password: "demo-editor-2024!", role: "editor" as const },
];

type FormError = {
  message: string;
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<FormError | null>(null);

  async function handleLogin(loginEmail: string, loginPassword: string) {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (authError) {
      setError({ message: authError.message });
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = await handleLogin(email, password);
    if (success) {
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
  }

  async function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    setError(null);
    setDemoLoading(account.role);

    const success = await handleLogin(account.email, account.password);
    if (success) {
      router.push("/dashboard");
      router.refresh();
    }

    setDemoLoading(null);
  }

  const isDisabled = loading || demoLoading !== null;

  return (
    <main className="login-page">
      <div className="login-container">
        {/* Branding */}
        <div className="login-header">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
              <path d="M12 28V12h4l4 8 4-8h4v16h-4V19l-4 7-4-7v9h-4z" fill="white" />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6C5CE7" />
                  <stop offset="1" stopColor="#A29BFE" />
                </linearGradient>
              </defs>
            </svg>
            <h1>AssetLibrary <span className="login-ai-badge">AI</span></h1>
          </div>
          <p className="login-subtitle">Enterprise Digital Asset Management</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form" id="login-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={isDisabled}
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isDisabled}
              minLength={8}
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="form-error" role="alert" id="login-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span>{error.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isDisabled}
            className="btn btn-primary btn-full"
            id="login-submit"
          >
            {loading ? (
              <span className="btn-loading">
                <svg className="spinner" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="15" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>or sign in with a demo account</span>
        </div>

        {/* Demo Login Buttons */}
        <div className="demo-buttons" id="demo-login-section">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              onClick={() => handleDemoLogin(account)}
              disabled={isDisabled}
              className={`btn btn-demo btn-demo-${account.role}`}
              id={`demo-login-${account.role}`}
              type="button"
            >
              {demoLoading === account.role ? (
                <span className="btn-loading">
                  <svg className="spinner" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="15" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <span className="demo-role-badge">{account.role}</span>
                  {account.label}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Footer Link */}
        <p className="login-footer">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="login-link">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
