import { createClient } from "@/lib/supabase/server";
import type {
  EstagioLead,
  PorteClinica,
  PrioridadeTarefa,
  ResultadoAtividade,
  TipoAtividade,
} from "@/lib/supabase/types";

export type KanbanFilters = {
  busca?: string;
  cidade?: string;
  minScore?: number;
  paradosDias?: number;
  ownerId?: string;
};

export type KanbanLead = {
  id: string;
  estagio: EstagioLead;
  score: number;
  proxima_acao: string | null;
  proxima_acao_data: string | null;
  clinica_nome: string;
  clinica_cidade: string | null;
  clinica_estado: string | null;
  clinica_telefone: string | null;
  clinica_whatsapp: string | null;
  ultima_atividade_em: string;
};

type KanbanLeadRow = {
  id: string;
  estagio: EstagioLead;
  score: number;
  proxima_acao: string | null;
  proxima_acao_data: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  clinica: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
    telefone: string | null;
    whatsapp: string | null;
  } | null;
  atividades: { realizada_em: string }[] | null;
};

export async function fetchKanbanLeads(filters: KanbanFilters): Promise<KanbanLead[]> {
  const supabase = createClient();

  let query = supabase
    .from("leads")
    .select(
      `
      id, estagio, score, proxima_acao, proxima_acao_data, owner_id, created_at, updated_at,
      clinica:clinicas ( id, nome, cidade, estado, telefone, whatsapp ),
      atividades ( realizada_em )
      `,
    )
    .is("deleted_at", null)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("realizada_em", { ascending: false, referencedTable: "atividades" })
    .limit(1, { referencedTable: "atividades" });

  if (filters.ownerId) {
    query = query.eq("owner_id", filters.ownerId);
  }
  if (filters.minScore !== undefined && filters.minScore > 0) {
    query = query.gte("score", filters.minScore);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as KanbanLeadRow[];

  let leads: KanbanLead[] = rows.map((l) => ({
    id: l.id,
    estagio: l.estagio,
    score: l.score,
    proxima_acao: l.proxima_acao,
    proxima_acao_data: l.proxima_acao_data,
    clinica_nome: l.clinica?.nome ?? "(sem clínica)",
    clinica_cidade: l.clinica?.cidade ?? null,
    clinica_estado: l.clinica?.estado ?? null,
    clinica_telefone: l.clinica?.telefone ?? null,
    clinica_whatsapp: l.clinica?.whatsapp ?? null,
    ultima_atividade_em: l.atividades?.[0]?.realizada_em ?? l.created_at,
  }));

  if (filters.busca) {
    const needle = filters.busca.toLowerCase();
    leads = leads.filter((l) => l.clinica_nome.toLowerCase().includes(needle));
  }
  if (filters.cidade) {
    const needle = filters.cidade.toLowerCase();
    leads = leads.filter((l) => (l.clinica_cidade ?? "").toLowerCase().includes(needle));
  }
  if (filters.paradosDias !== undefined && filters.paradosDias > 0) {
    const cutoff = Date.now() - filters.paradosDias * 24 * 60 * 60 * 1000;
    leads = leads.filter((l) => new Date(l.ultima_atividade_em).getTime() <= cutoff);
  }

  return leads;
}

export type Contato = {
  id: string;
  nome: string | null;
  cargo: string | null;
  telefone: string | null;
  email: string | null;
  is_decisor: boolean;
  observacoes: string | null;
};

export type LeadDetail = {
  id: string;
  estagio: EstagioLead;
  qualificacao: string | null;
  motivo_desqualificacao: string | null;
  owner_id: string | null;
  score: number;
  proxima_acao: string | null;
  proxima_acao_data: string | null;
  valor_estimado: number;
  probabilidade: number;
  origem: string | null;
  origem_detalhe: string | null;
  created_at: string;
  updated_at: string;
  clinica: {
    id: string;
    nome: string;
    telefone: string | null;
    whatsapp: string | null;
    endereco: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    rating: number | null;
    total_reviews: number | null;
    website: string | null;
    cnpj: string | null;
    razao_social: string | null;
    porte_estimado: PorteClinica | null;
    contatos: Contato[];
  } | null;
  atividades: {
    id: string;
    tipo: TipoAtividade;
    titulo: string | null;
    descricao: string | null;
    resultado: ResultadoAtividade | null;
    duracao_minutos: number | null;
    realizada_em: string;
    user_id: string | null;
  }[];
  cliente_oculto: {
    id: string;
    disparo_em: string | null;
    enviado_em: string | null;
    primeira_resposta_em: string | null;
    tempo_resposta_minutos: number | null;
    respondeu: boolean;
    tentou_agendar: boolean | null;
    fez_followup: boolean | null;
    qualidade_atendimento: number | null;
    conseguiu_preco: boolean | null;
    observacoes: string | null;
    transcricao: string | null;
  } | null;
  tarefas: {
    id: string;
    titulo: string;
    descricao: string | null;
    prazo: string | null;
    concluida: boolean;
    concluida_em: string | null;
    prioridade: PrioridadeTarefa;
  }[];
};

export async function fetchLeadDetail(leadId: string): Promise<LeadDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      id, estagio, qualificacao, motivo_desqualificacao, owner_id,
      score, proxima_acao, proxima_acao_data, valor_estimado,
      probabilidade, origem, origem_detalhe, created_at, updated_at,
      clinica:clinicas (
        id, nome, telefone, whatsapp, endereco, cidade, estado, cep,
        rating, total_reviews, website, cnpj, razao_social, porte_estimado,
        contatos ( id, nome, cargo, telefone, email, is_decisor, observacoes, deleted_at )
      ),
      atividades ( id, tipo, titulo, descricao, resultado, duracao_minutos, realizada_em, user_id ),
      clientes_ocultos ( id, disparo_em, enviado_em, primeira_resposta_em, tempo_resposta_minutos, respondeu, tentou_agendar, fez_followup, qualidade_atendimento, conseguiu_preco, observacoes, transcricao, created_at ),
      tarefas ( id, titulo, descricao, prazo, concluida, concluida_em, prioridade )
      `,
    )
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    estagio: EstagioLead;
    qualificacao: string | null;
    motivo_desqualificacao: string | null;
    owner_id: string | null;
    score: number;
    proxima_acao: string | null;
    proxima_acao_data: string | null;
    valor_estimado: number;
    probabilidade: number;
    origem: string | null;
    origem_detalhe: string | null;
    created_at: string;
    updated_at: string;
    clinica:
      | (Omit<NonNullable<LeadDetail["clinica"]>, "contatos"> & {
          contatos: (Contato & { deleted_at: string | null })[];
        })
      | null;
    atividades: LeadDetail["atividades"];
    clientes_ocultos: LeadDetail["cliente_oculto"][];
    tarefas: LeadDetail["tarefas"];
  };

  const atividades = (row.atividades ?? []).slice().sort(
    (a, b) => new Date(b.realizada_em).getTime() - new Date(a.realizada_em).getTime(),
  );

  const tarefas = (row.tarefas ?? []).slice().sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    const pa = a.prazo ? new Date(a.prazo).getTime() : Number.POSITIVE_INFINITY;
    const pb = b.prazo ? new Date(b.prazo).getTime() : Number.POSITIVE_INFINITY;
    return pa - pb;
  });

  const contatosAtivos = (row.clinica?.contatos ?? []).filter((c) => !c.deleted_at);

  const ocultos = row.clientes_ocultos ?? [];
  const clienteOculto = ocultos.length > 0 ? ocultos[0] : null;

  return {
    id: row.id,
    estagio: row.estagio,
    qualificacao: row.qualificacao,
    motivo_desqualificacao: row.motivo_desqualificacao,
    owner_id: row.owner_id,
    score: row.score,
    proxima_acao: row.proxima_acao,
    proxima_acao_data: row.proxima_acao_data,
    valor_estimado: row.valor_estimado,
    probabilidade: row.probabilidade,
    origem: row.origem,
    origem_detalhe: row.origem_detalhe,
    created_at: row.created_at,
    updated_at: row.updated_at,
    clinica: row.clinica
      ? {
          id: row.clinica.id,
          nome: row.clinica.nome,
          telefone: row.clinica.telefone,
          whatsapp: row.clinica.whatsapp,
          endereco: row.clinica.endereco,
          cidade: row.clinica.cidade,
          estado: row.clinica.estado,
          cep: row.clinica.cep,
          rating: row.clinica.rating,
          total_reviews: row.clinica.total_reviews,
          website: row.clinica.website,
          cnpj: row.clinica.cnpj,
          razao_social: row.clinica.razao_social,
          porte_estimado: row.clinica.porte_estimado,
          contatos: contatosAtivos.map((c) => {
            const { deleted_at, ...rest } = c;
            void deleted_at;
            return rest;
          }),
        }
      : null,
    atividades,
    cliente_oculto: clienteOculto,
    tarefas,
  };
}

export async function fetchCidadesDistintas(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clinicas")
    .select("cidade")
    .is("deleted_at", null)
    .not("cidade", "is", null);

  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.cidade) set.add(row.cidade);
  }
  return Array.from(set).sort();
}
