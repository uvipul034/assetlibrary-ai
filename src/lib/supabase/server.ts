import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses the anon key so all queries go through RLS.
 *
 * This client reads/writes cookies for session management.
 * Must be called inside a request context (not at module level).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies cannot be set. This is expected when refreshing the
            // session in middleware — the middleware will handle setting cookies.
          }
        },
      },
    }
  );
}
