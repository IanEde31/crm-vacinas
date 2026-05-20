// Leituras da tabela `buscas` para a página /radar (Server Components).

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Busca = Database["public"]["Tables"]["buscas"]["Row"];

/** Histórico das últimas buscas, mais recentes primeiro. */
export async function fetchBuscasRecentes(limite = 8): Promise<Busca[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("buscas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("fetchBuscasRecentes:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Busca ainda em andamento (running/processing), se houver — permite a página
 * retomar a animação de polling após um reload.
 */
export async function fetchBuscaAtiva(): Promise<Busca | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("buscas")
    .select("*")
    .in("status", ["running", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchBuscaAtiva:", error.message);
    return null;
  }
  return data;
}
