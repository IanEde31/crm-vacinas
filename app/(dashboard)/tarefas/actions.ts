"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function deleteTarefa(
  tarefaId: string,
): Promise<{ ok: true } | { error: string }> {
  const parsed = z.string().uuid().safeParse(tarefaId);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = createClient();
  const { error } = await supabase.from("tarefas").delete().eq("id", parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/tarefas");
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

const standaloneSchema = z.object({
  titulo: z.string().trim().min(1, "Título obrigatório").max(200),
  descricao: z.string().trim().max(2000).optional(),
  prazo: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta"]).default("media"),
  lead_id: z.string().uuid().optional().nullable(),
  clinica_id: z.string().uuid().optional().nullable(),
  contato_id: z.string().uuid().optional().nullable(),
});

export type StandaloneTarefaInput = z.infer<typeof standaloneSchema>;

export async function createStandaloneTarefa(
  input: StandaloneTarefaInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = standaloneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tarefas").insert({
    lead_id: parsed.data.lead_id ?? null,
    clinica_id: parsed.data.clinica_id ?? null,
    contato_id: parsed.data.contato_id ?? null,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    prazo: parsed.data.prazo || null,
    prioridade: parsed.data.prioridade,
    owner_id: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/tarefas");
  revalidatePath("/leads");
  revalidatePath("/clinicas");
  revalidatePath("/");
  return { ok: true };
}

export type SearchResult =
  | {
      type: "lead";
      lead_id: string;
      clinica_id: string;
      clinica_nome: string;
      cidade: string | null;
      estado: string | null;
      estagio: string;
    }
  | {
      type: "clinica";
      clinica_id: string;
      clinica_nome: string;
      cidade: string | null;
      estado: string | null;
    }
  | {
      type: "contato";
      contato_id: string;
      contato_nome: string;
      cargo: string | null;
      is_decisor: boolean;
      clinica_id: string;
      clinica_nome: string;
    };

const ESTAGIOS_FINAIS = ["ganho", "perdido", "nutricao"] as const;

type LeadSearchRow = {
  id: string;
  estagio: string;
  score: number | null;
  updated_at: string;
  clinicas: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
    deleted_at: string | null;
  } | null;
};

type ClinicaSearchRow = {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
};

type ContatoSearchRow = {
  id: string;
  nome: string | null;
  cargo: string | null;
  is_decisor: boolean;
  clinicas: { id: string; nome: string; deleted_at: string | null } | null;
};

function mergeResults(
  leadRows: LeadSearchRow[],
  clinicaRows: ClinicaSearchRow[],
  contatoRows: ContatoSearchRow[],
  limit: number,
): SearchResult[] {
  const leadsByClinica = new Set<string>();
  const results: SearchResult[] = [];

  for (const l of leadRows) {
    const c = l.clinicas;
    if (!c || c.deleted_at) continue;
    leadsByClinica.add(c.id);
    results.push({
      type: "lead",
      lead_id: l.id,
      clinica_id: c.id,
      clinica_nome: c.nome,
      cidade: c.cidade,
      estado: c.estado,
      estagio: l.estagio,
    });
  }

  for (const c of contatoRows) {
    const clinica = c.clinicas;
    if (!clinica || clinica.deleted_at) continue;
    if (!c.nome) continue;
    results.push({
      type: "contato",
      contato_id: c.id,
      contato_nome: c.nome,
      cargo: c.cargo,
      is_decisor: c.is_decisor,
      clinica_id: clinica.id,
      clinica_nome: clinica.nome,
    });
  }

  for (const c of clinicaRows) {
    if (leadsByClinica.has(c.id)) continue;
    results.push({
      type: "clinica",
      clinica_id: c.id,
      clinica_nome: c.nome,
      cidade: c.cidade,
      estado: c.estado,
    });
  }

  return results.slice(0, limit);
}

export async function searchLinkTargets(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  const supabase = createClient();

  // Modo "lista inicial": sem busca, mistura curada — leads ativos mais quentes,
  // decisores conhecidos, depois clínicas alfabética.
  if (trimmed.length < 2) {
    const [leadsRes, contatosRes, clinicasRes] = await Promise.all([
      supabase
        .from("leads")
        .select(
          `
          id, estagio, score, updated_at,
          clinicas!inner ( id, nome, cidade, estado, deleted_at )
          `,
        )
        .is("deleted_at", null)
        .not("estagio", "in", `(${ESTAGIOS_FINAIS.join(",")})`)
        .order("score", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("contatos")
        .select(
          `
          id, nome, cargo, is_decisor,
          clinicas!inner ( id, nome, deleted_at )
          `,
        )
        .is("deleted_at", null)
        .eq("is_decisor", true)
        .not("nome", "is", null)
        .order("nome", { ascending: true })
        .limit(5),
      supabase
        .from("clinicas")
        .select("id, nome, cidade, estado")
        .is("deleted_at", null)
        .order("nome", { ascending: true })
        .limit(15),
    ]);

    if (leadsRes.error || contatosRes.error || clinicasRes.error) return [];

    return mergeResults(
      (leadsRes.data ?? []) as unknown as LeadSearchRow[],
      (clinicasRes.data ?? []) as unknown as ClinicaSearchRow[],
      (contatosRes.data ?? []) as unknown as ContatoSearchRow[],
      12,
    );
  }

  const pattern = `%${trimmed}%`;

  const [clinicasRes, leadsRes, contatosRes] = await Promise.all([
    supabase
      .from("clinicas")
      .select("id, nome, cidade, estado")
      .is("deleted_at", null)
      .ilike("nome", pattern)
      .order("nome", { ascending: true })
      .limit(8),
    supabase
      .from("leads")
      .select(
        `
        id, estagio, score, updated_at,
        clinicas!inner ( id, nome, cidade, estado, deleted_at )
        `,
      )
      .is("deleted_at", null)
      .ilike("clinicas.nome", pattern)
      .limit(8),
    supabase
      .from("contatos")
      .select(
        `
        id, nome, cargo, is_decisor,
        clinicas!inner ( id, nome, deleted_at )
        `,
      )
      .is("deleted_at", null)
      .ilike("nome", pattern)
      .order("is_decisor", { ascending: false })
      .order("nome", { ascending: true })
      .limit(8),
  ]);

  if (clinicasRes.error || leadsRes.error || contatosRes.error) return [];

  return mergeResults(
    (leadsRes.data ?? []) as unknown as LeadSearchRow[],
    (clinicasRes.data ?? []) as unknown as ClinicaSearchRow[],
    (contatosRes.data ?? []) as unknown as ContatoSearchRow[],
    12,
  );
}

// Compat shim — código antigo importa esse nome.
export const searchLeadsAndClinicas = searchLinkTargets;
