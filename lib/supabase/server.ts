import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export function createClient() {
  const cookieStore = cookies();

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
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component: cookies are read-only. Middleware refreshes the session.
          }
        },
      },
      global: {
        // O CRM sempre lê dado vivo. Sem `no-store`, o Data Cache do Next
        // serviria leituras desatualizadas — sobretudo porque o n8n escreve
        // direto no Postgres (enviado_em, transcrição, atividades), por fora
        // do Next.js, sem nunca disparar revalidatePath.
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    },
  );
}
