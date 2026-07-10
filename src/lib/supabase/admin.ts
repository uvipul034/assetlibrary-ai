import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Creates a Supabase admin client using the SERVICE_ROLE_KEY.
 * 
 * ⚠️ CRITICAL SECURITY RULES:
 * 1. This client BYPASSES all RLS policies entirely.
 * 2. Only use in server-side API routes (Route Handlers) — NEVER in Client Components.
 * 3. Never import this file from any file that runs in the browser.
 * 4. Used exclusively for trusted operations:
 *    - AI tag insertion (from /api/analyze-asset)
 *    - Updating asset alt_text after AI analysis
 *    - Admin-level data operations
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. " +
      "Ensure these are set in your .env.local file."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
