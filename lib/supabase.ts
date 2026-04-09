import { createClient } from "@supabase/supabase-js";

// Server-side client with service role key (never expose to browser)
// Uses cache: "no-store" to prevent Next.js 14 from caching Supabase fetch calls
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
