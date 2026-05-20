import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente Supabase com service role — ignora RLS.
 *
 * Uso EXCLUSIVO server-side: Server Actions, API Routes e jobs (ex.: ingestão
 * da APIFY, que roda tanto via polling autenticado quanto via webhook sem
 * sessão de usuário). Nunca importar em Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
