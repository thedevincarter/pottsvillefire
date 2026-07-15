import { createClient } from "@supabase/supabase-js";

// Server-side client with service role (full access, no RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
