// ============================================================
// CLIENT SUPABASE ADMIN — Utilise la clé service role
//
// Ce client a des droits élevés (création users, etc.)
// Ne jamais l'utiliser côté client — uniquement Server Actions
// ============================================================

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}