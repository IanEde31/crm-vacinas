// Ingestão: parser -> dedupe -> upsert clínicas -> criação de leads.
// Idempotente do ponto de vista de leads: nunca cria lead duplicado para uma
// clínica que já tem lead ativo.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { calcularScore } from "@/lib/scoring";
import { parseApifyPlace, type ApifyPlace, type ClinicaInsert } from "./parser";

type DB = SupabaseClient<Database>;

export type IngestResult = {
  /** Total de places recebidos da APIFY. */
  total: number;
  /** Clínicas inseridas pela primeira vez. */
  novas: number;
  /** Clínicas que já existiam e foram atualizadas. */
  atualizadas: number;
  /** Inválidas, fechadas ou duplicadas no resultado. */
  descartadas: number;
};

const BATCH = 100;

/**
 * Processa um lote de places brutos da APIFY.
 *
 * @param supabase  cliente com permissão de escrita (service role).
 * @param places    itens brutos do dataset da APIFY.
 * @param ownerId   usuário que disparou a busca (vira owner dos leads novos).
 * @param uf        sigla do estado da busca — grava em `clinicas.estado`.
 */
export async function ingestPlaces(
  supabase: DB,
  places: ApifyPlace[],
  ownerId: string | null,
  uf?: string,
): Promise<IngestResult> {
  const total = places.length;

  // 1. Parse + descarte de inválidos/fechados.
  const parsed = places
    .map((p) => parseApifyPlace(p, uf))
    .filter((c): c is ClinicaInsert => c !== null);

  // 2. Dedupe intra-lote por google_place_id (mesmo place pode vir de termos
  //    diferentes). Mantém a primeira ocorrência.
  const porPlaceId = new Map<string, ClinicaInsert>();
  for (const c of parsed) {
    const pid = c.google_place_id;
    if (pid && !porPlaceId.has(pid)) porPlaceId.set(pid, c);
  }
  const unicos = Array.from(porPlaceId.values());
  const placeIds = Array.from(porPlaceId.keys());
  const descartadas = total - unicos.length;

  if (unicos.length === 0) {
    return { total, novas: 0, atualizadas: 0, descartadas };
  }

  // 3. Quais google_place_id já existiam? (define novas vs atualizadas)
  const { data: existentes, error: errExist } = await supabase
    .from("clinicas")
    .select("google_place_id")
    .in("google_place_id", placeIds);
  if (errExist) {
    throw new Error(`Falha ao consultar clínicas: ${errExist.message}`);
  }
  const jaExistiam = new Set(
    (existentes ?? []).map((r) => r.google_place_id).filter(Boolean),
  );

  // 4. Upsert das clínicas em lotes de 100.
  const clinicaIds: string[] = [];
  for (let i = 0; i < unicos.length; i += BATCH) {
    const chunk = unicos.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("clinicas")
      .upsert(chunk, { onConflict: "google_place_id" })
      .select("id");
    if (error) {
      throw new Error(`Falha ao gravar clínicas: ${error.message}`);
    }
    for (const row of data ?? []) clinicaIds.push(row.id);
  }

  const novas = unicos.filter(
    (c) => !jaExistiam.has(c.google_place_id ?? ""),
  ).length;
  const atualizadas = unicos.length - novas;

  // 5. Quais dessas clínicas já têm lead ativo? Só cria lead para as demais —
  //    a chave de dedupe de lead é "existe lead ativo p/ esta clinica_id".
  const { data: leadsExistentes, error: errLeads } = await supabase
    .from("leads")
    .select("clinica_id")
    .in("clinica_id", clinicaIds)
    .is("deleted_at", null);
  if (errLeads) {
    throw new Error(`Falha ao consultar leads: ${errLeads.message}`);
  }
  const comLead = new Set((leadsExistentes ?? []).map((r) => r.clinica_id));
  const semLead = clinicaIds.filter((id) => !comLead.has(id));

  // 6. Cria os leads novos, com score calculado.
  if (semLead.length > 0) {
    const { data: dados, error: errDados } = await supabase
      .from("clinicas")
      .select("id, whatsapp, rating, total_reviews, cidade, estado")
      .in("id", semLead);
    if (errDados) {
      throw new Error(`Falha ao ler clínicas p/ score: ${errDados.message}`);
    }

    const novosLeads = (dados ?? []).map((c) => ({
      clinica_id: c.id,
      estagio: "lead_bruto" as const,
      qualificacao: "pendente" as const,
      origem: "apify" as const,
      owner_id: ownerId,
      score: calcularScore(c, []),
    }));

    for (let i = 0; i < novosLeads.length; i += BATCH) {
      const chunk = novosLeads.slice(i, i + BATCH);
      const { error } = await supabase.from("leads").insert(chunk);
      if (error) {
        throw new Error(`Falha ao criar leads: ${error.message}`);
      }
    }
  }

  return { total, novas, atualizadas, descartadas };
}
