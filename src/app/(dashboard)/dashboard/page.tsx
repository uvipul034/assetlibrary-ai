import { createClient } from "@/lib/supabase/server";

/**
 * Dashboard home page — placeholder for Day 4 asset grid.
 * Fetches the current user's profile to display role information.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileEmail: string | null = null;
  let profileRole: string | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("id", user.id)
      .single();

    if (data) {
      profileEmail = data.email;
      profileRole = data.role;
    }
  }

  return (
    <main style={{ padding: "var(--space-8)" }}>
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: "var(--space-4)" }}>
        Dashboard
      </h1>
      <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>
        Welcome back{profileEmail ? `, ${profileEmail}` : ""}. 
        {profileRole && (
          <span style={{
            display: "inline-flex",
            marginLeft: "var(--space-2)",
            padding: "2px 8px",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}>
            {profileRole}
          </span>
        )}
      </p>
      <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-4)" }}>
        The full asset grid, analytics panel, and upload dialog will be built in Days 2–5.
      </p>
    </main>
  );
}
