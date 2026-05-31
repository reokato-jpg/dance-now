import { createClient } from "@supabase/supabase-js";

// Server-side admin client using service_role key (bypasses RLS)
// Used in admin API routes only
export function getAdminClient() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
