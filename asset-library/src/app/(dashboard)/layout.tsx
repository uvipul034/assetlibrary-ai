"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    }
    fetchProfile();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-surface px-6 shadow-sm">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 28V12h4l4 8 4-8h4v16h-4V19l-4 7-4-7v9h-4z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-lg font-bold">AssetLibrary AI</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted hidden sm:inline-block">
                {profile.email}
              </span>
              <span className={`demo-role-badge ${profile.role === 'admin' ? 'bg-destructive-bg text-destructive-foreground' :
                  profile.role === 'manager' ? 'bg-warning-bg text-warning-foreground' :
                    'bg-success-bg text-success-foreground'
                }`}>
                {profile.role}
              </span>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
