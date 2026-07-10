import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Root page — redirects to /dashboard if authenticated, /login if not.
 * This is a Server Component that checks auth status before rendering.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
