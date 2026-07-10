import type { Metadata } from "next";

/** Force dynamic rendering for auth pages — Supabase client needs runtime env vars */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In — AssetLibrary AI",
  description: "Sign in to your AssetLibrary AI account to manage digital assets, brand approvals, and AI-powered tagging.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
}
