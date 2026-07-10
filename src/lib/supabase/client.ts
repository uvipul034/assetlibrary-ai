"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Creates a Supabase client for use in Client Components (browser).
 * This client respects RLS policies using the anon key.
 * Safe to call multiple times — Supabase SDK handles deduplication internally.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
