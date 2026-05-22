"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ESTAGIO_IDS } from "@/lib/estagios";
import {
  buscarClinicas,
  fetchLeadDetail,
  type ClinicaBusca,
  type LeadDetail,
} from "@/lib/leads/queries";
import { calcularScore, type ScoreClinica } from "@/lib/scoring";
import { dispararClienteOculto } from "@/lib/n8n/cliente-oculto";

type ActionResult = { ok: true } | { error: string };

const updateEstagioSchema = z.object({
  leadId: z.string().uuid(),
  novoEstagio: z.enum(ESTAGIO_IDS),
});

type EstagioResult = { error: string } | { ok: true; avisoDisparo?: string };

export async function updateLeadEstagio(input: {
  leadId: string;
  novoEstagio: string;
}): Promise<EstagioResult> {
  const parsed = updateEstagioSchema.safeParse(input);
  if (!parsed.success) return { error: "Estágio inválido" };

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ estagio: parsed.data.novoEstagio })
    .eq("id", parsed.data.leadId);

  if (error) return { error: error.message };

  // Entrou em Cliente Oculto: dispara a abordagem via n8n. Best-effort — a
  // mudança de estágio já está persistida e não fica refém do webhook. Uma
  // falha volta como aviso; o disparo continua retentável pelo drawer.
  let avisoDisparo: string | undefined;
  if (parsed.data.novoEstagio === "cliente_oculto") {
    const outcome = await dispararAbordagemClienteOculto(supabase, parsed.data.leadId);
    if (outcome.status === "falhou") {
      avisoDisparo = `Lead movido, mas a abordagem não foi disparada: ${outcome.error}`;
    }
  }

  revalidatePath("/leads");
  return avisoDisparo ? { ok: true, avisoDisparo } : { ok: true };
}

type DisparoOutcome =
  | { status: "disparado" }
  | { status: "ja_disparado" }
  | { status: "falhou"; error: string };

type ClinicaDisparo = {
  nome: string;
  whatsapp: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
};

/**
 * Dispara a abordagem de cliente oculto para o n8n.
 *
 * Idempotente: a tabela `clientes_ocultos` tem `unique (lead_id)`, então o
 * upsert com `ignoreDuplicates` garante no máximo uma linha por lead; o campo
 * `disparo_em` registra que o webhook já foi confirmado e impede um segundo
 * disparo (mesmo que o lead reentre no estágio).
 *
 * `disparo_em` é gravado SÓ depois de o n8n confirmar o recebimento. Se o
 * webhook falhar, o campo fica NULL e o disparo continua retentável. A
 * atividade `whatsapp` na timeline é registrada pelo n8n quando a mensagem
 * de fato sai — não aqui — para não duplicar o evento.
 */
async function dispararAbordagemClienteOculto(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
): Promise<DisparoOutcome> {
  // Garante a linha de cliente oculto sem sobrescrever uma já existente.
  const { error: upsertErr } = await supabase
    .from("clientes_ocultos")
    .upsert({ lead_id: leadId }, { onConflict: "lead_id", ignoreDuplicates: true });
  if (upsertErr) return { status: "falhou", error: upsertErr.message };

  const { data: co, error: coErr } = await supabase
    .from("clientes_ocultos")
    .select("id, disparo_em")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (coErr) return { status: "falhou", error: coErr.message };
  if (!co) return { status: "falhou", error: "Registro de cliente oculto não encontrado." };
  if (co.disparo_em) return { status: "ja_disparado" };

  // Dados que o n8n precisa para abrir a conversa.
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("clinica:clinicas ( nome, whatsapp, telefone, cidade, estado )")
    .eq("id", leadId)
    .maybeSingle();
  if (leadErr) return { status: "falhou", error: leadErr.message };

  const clinica =
    (lead as unknown as { clinica: ClinicaDisparo | null } | null)?.clinica ?? null;
  if (!clinica) return { status: "falhou", error: "Clínica do lead não encontrada." };
  if (!clinica.whatsapp && !clinica.telefone) {
    return {
      status: "falhou",
      error: "Clínica sem WhatsApp ou telefone cadastrado — atualize o contato antes de disparar.",
    };
  }

  const resultado = await dispararClienteOculto({
    lead_id: leadId,
    clientes_ocultos_id: co.id,
    clinica: {
      nome: clinica.nome,
      whatsapp: clinica.whatsapp,
      telefone: clinica.telefone,
      cidade: clinica.cidade,
      estado: clinica.estado,
    },
  });
  if (!resultado.ok) return { status: "falhou", error: resultado.error };

  // Webhook confirmado: marca o disparo. A partir daqui o n8n assume a conversa
  // (preenche `enviado_em` e registra a atividade quando a mensagem sai).
  const { error: updErr } = await supabase
    .from("clientes_ocultos")
    .update({ disparo_em: new Date().toISOString() })
    .eq("id", co.id);
  if (updErr) return { status: "falhou", error: updErr.message };

  return { status: "disparado" };
}

/**
 * Reenvia manualmente a abordagem de cliente oculto.
 * Usado pelo botão no drawer quando o disparo automático falhou (n8n fora).
 */
export async function reenviarAbordagemClienteOculto(
  leadId: string,
): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(leadId);
  if (!parsed.success) return { error: "Lead inválido" };

  const supabase = createClient();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("estagio")
    .eq("id", parsed.data)
    .maybeSingle();
  if (leadErr) return { error: leadErr.message };
  if (!lead) return { error: "Lead não encontrado" };
  if (lead.estagio !== "cliente_oculto") {
    return { error: "O lead não está no estágio Cliente Oculto." };
  }

  const outcome = await dispararAbordagemClienteOculto(supabase, parsed.data);
  if (outcome.status === "falhou") return { error: outcome.error };

  revalidatePath("/leads");
  return { ok: true };
}

const tipoAtividade = z.enum(["ligacao", "whatsapp", "email", "reuniao", "nota"]);
const resultadoAtividade = z.enum(["sucesso", "sem_resposta", "reagendado", "objecao"]);

const atividadeSchema = z.object({
  lead_id: z.string().uuid(),
  tipo: tipoAtividade,
  titulo: z.string().trim().max(200).optional(),
  descricao: z.string().trim().max(2000).optional(),
  resultado: resultadoAtividade.optional().nullable(),
  duracao_minutos: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  proxima_acao: z.string().trim().max(200).optional(),
  proxima_acao_data: z.string().optional(),
});

export type AtividadeInput = z.infer<typeof atividadeSchema>;

export async function createAtividade(input: AtividadeInput): Promise<ActionResult> {
  const parsed = atividadeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("atividades").insert({
    lead_id: parsed.data.lead_id,
    tipo: parsed.data.tipo,
    titulo: parsed.data.titulo || null,
    descricao: parsed.data.descricao || null,
    resultado: parsed.data.resultado ?? null,
    duracao_minutos: parsed.data.duracao_minutos ?? null,
    user_id: user?.id ?? null,
  });

  if (error) return { error: error.message };

  if (parsed.data.proxima_acao || parsed.data.proxima_acao_data) {
    await supabase
      .from("leads")
      .update({
        proxima_acao: parsed.data.proxima_acao || null,
        proxima_acao_data: parsed.data.proxima_acao_data || null,
      })
      .eq("id", parsed.data.lead_id);
  }

  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath("/tarefas");
  return { ok: true };
}

const clienteOcultoSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid(),
  enviado_em: z.string().optional(),
  primeira_resposta_em: z.string().optional(),
  respondeu: z.coerce.boolean().optional(),
  tentou_agendar: z.coerce.boolean().optional().nullable(),
  fez_followup: z.coerce.boolean().optional().nullable(),
  qualidade_atendimento: z.coerce.number().int().min(1).max(5).optional().nullable(),
  conseguiu_preco: z.coerce.boolean().optional().nullable(),
  observacoes: z.string().trim().max(2000).optional(),
  transcricao: z.string().trim().max(50000).optional(),
});

export type ClienteOcultoInput = z.infer<typeof clienteOcultoSchema>;

export async function upsertClienteOculto(input: ClienteOcultoInput): Promise<ActionResult> {
  const parsed = clienteOcultoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const payload = {
    lead_id: parsed.data.lead_id,
    enviado_em: parsed.data.enviado_em || null,
    primeira_resposta_em: parsed.data.primeira_resposta_em || null,
    respondeu: parsed.data.respondeu ?? false,
    tentou_agendar: parsed.data.tentou_agendar ?? null,
    fez_followup: parsed.data.fez_followup ?? null,
    qualidade_atendimento: parsed.data.qualidade_atendimento ?? null,
    conseguiu_preco: parsed.data.conseguiu_preco ?? null,
    observacoes: parsed.data.observacoes || null,
    transcricao: parsed.data.transcricao || null,
  };

  // upsert por lead_id: a constraint unique (lead_id) garante uma linha por
  // lead. Cobre o caso de a linha já ter sido criada pelo disparo automático
  // do cliente oculto enquanto este formulário exibia um snapshot antigo.
  const { error } = await supabase
    .from("clientes_ocultos")
    .upsert(payload, { onConflict: "lead_id" });

  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

const tarefaSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  titulo: z.string().trim().min(1, "Título obrigatório").max(200),
  descricao: z.string().trim().max(2000).optional(),
  prazo: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta"]).default("media"),
});

export type TarefaInput = z.infer<typeof tarefaSchema>;

export async function createTarefa(input: TarefaInput): Promise<ActionResult> {
  const parsed = tarefaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tarefas").insert({
    lead_id: parsed.data.lead_id || null,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    prazo: parsed.data.prazo || null,
    prioridade: parsed.data.prioridade,
    owner_id: user?.id ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath("/tarefas");
  return { ok: true };
}

export async function toggleTarefaConcluida(
  tarefaId: string,
  concluida: boolean,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tarefas")
    .update({
      concluida,
      concluida_em: concluida ? new Date().toISOString() : null,
    })
    .eq("id", tarefaId);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath("/tarefas");
  return { ok: true };
}

const updatePipelineSchema = z.object({
  lead_id: z.string().uuid(),
  qualificacao: z.enum(["qualificado", "nao_qualificado", "pendente"]).nullable().optional(),
  motivo_desqualificacao: z.string().trim().max(1000).optional(),
  score: z.coerce.number().int().min(0).max(100),
  valor_estimado: z.coerce.number().min(0),
  probabilidade: z.coerce.number().int().min(0).max(100),
  proxima_acao: z.string().trim().max(200).optional(),
  proxima_acao_data: z.string().optional(),
});

export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;

export async function updateLeadPipeline(input: UpdatePipelineInput): Promise<ActionResult> {
  const parsed = updatePipelineSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      qualificacao: parsed.data.qualificacao ?? null,
      motivo_desqualificacao: parsed.data.motivo_desqualificacao || null,
      score: parsed.data.score,
      valor_estimado: parsed.data.valor_estimado,
      probabilidade: parsed.data.probabilidade,
      proxima_acao: parsed.data.proxima_acao || null,
      proxima_acao_data: parsed.data.proxima_acao_data || null,
    })
    .eq("id", parsed.data.lead_id);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

const updateClinicaSchema = z.object({
  clinica_id: z.string().uuid(),
  nome: z.string().trim().min(1, "Nome obrigatório").max(200),
  razao_social: z.string().trim().max(200).optional(),
  cnpj: z.string().trim().max(20).optional(),
  telefone: z.string().trim().max(50).optional(),
  whatsapp: z.string().trim().max(50).optional(),
  endereco: z.string().trim().max(500).optional(),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().max(50).optional(),
  cep: z.string().trim().max(20).optional(),
  website: z.string().trim().max(500).optional(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  total_reviews: z.coerce.number().int().min(0).optional().nullable(),
  porte_estimado: z.enum(["pequeno", "medio", "grande"]).optional().nullable(),
});

export type UpdateClinicaInput = z.infer<typeof updateClinicaSchema>;

export async function updateClinica(input: UpdateClinicaInput): Promise<ActionResult> {
  const parsed = updateClinicaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("clinicas")
    .update({
      nome: parsed.data.nome,
      razao_social: parsed.data.razao_social || null,
      cnpj: parsed.data.cnpj || null,
      telefone: parsed.data.telefone || null,
      whatsapp: parsed.data.whatsapp || null,
      endereco: parsed.data.endereco || null,
      cidade: parsed.data.cidade || null,
      estado: parsed.data.estado || null,
      cep: parsed.data.cep || null,
      website: parsed.data.website || null,
      rating: parsed.data.rating ?? null,
      total_reviews: parsed.data.total_reviews ?? null,
      porte_estimado: parsed.data.porte_estimado ?? null,
    })
    .eq("id", parsed.data.clinica_id);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

const contatoSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  clinica_id: z.string().uuid(),
  nome: z.string().trim().max(200).optional(),
  cargo: z.enum(["socio", "gestor", "recepcao", "medico", "outro"]).optional().nullable(),
  telefone: z.string().trim().max(50).optional(),
  email: z.string().trim().max(200).optional(),
  is_decisor: z.coerce.boolean().optional(),
  observacoes: z.string().trim().max(1000).optional(),
});

export type ContatoInput = z.infer<typeof contatoSchema>;

export async function upsertContato(input: ContatoInput): Promise<ActionResult> {
  const parsed = contatoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const payload = {
    clinica_id: parsed.data.clinica_id,
    nome: parsed.data.nome || null,
    cargo: parsed.data.cargo ?? null,
    telefone: parsed.data.telefone || null,
    email: parsed.data.email || null,
    is_decisor: parsed.data.is_decisor ?? false,
    observacoes: parsed.data.observacoes || null,
  };

  const { error } = parsed.data.id
    ? await supabase.from("contatos").update(payload).eq("id", parsed.data.id)
    : await supabase.from("contatos").insert({ ...payload, fonte: "manual" });

  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteContato(contatoId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("contatos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", contatoId);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

/**
 * Carrega o detalhe de um lead para o drawer.
 * É uma Server Action de leitura: o drawer abre por estado de cliente
 * (sem navegação) e busca o detalhe sob demanda — uma consulta enxuta,
 * em vez de re-renderizar a página inteira a cada clique de card.
 */
export async function fetchLeadDetailAction(
  leadId: string,
): Promise<LeadDetail | null> {
  const parsed = z.string().uuid().safeParse(leadId);
  if (!parsed.success) return null;
  try {
    return await fetchLeadDetail(parsed.data);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  CRUD do lead — criação e exclusão (soft delete)                           */
/* -------------------------------------------------------------------------- */

/**
 * Busca clínicas por nome para o formulário de novo lead.
 * Server Action de leitura — falha silenciosamente para uma lista vazia, já que
 * é chamada a cada tecla digitada.
 */
export async function buscarClinicasParaLead(termo: string): Promise<ClinicaBusca[]> {
  if (typeof termo !== "string") return [];
  try {
    return await buscarClinicas(termo);
  } catch {
    return [];
  }
}

const clinicaNovaSchema = z.object({
  nome: z.string().trim().min(1, "Nome da clínica é obrigatório").max(200),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().max(50).optional(),
  telefone: z.string().trim().max(50).optional(),
  whatsapp: z.string().trim().max(50).optional(),
  endereco: z.string().trim().max(500).optional(),
  cnpj: z.string().trim().max(20).optional(),
  website: z.string().trim().max(500).optional(),
});

const createLeadSchema = z
  .object({
    // Modo 1: vincular a uma clínica existente.
    clinica_id: z.string().uuid().optional().nullable(),
    // Modo 2: cadastrar uma clínica nova junto.
    clinica_nova: clinicaNovaSchema.optional().nullable(),
    // Campos do lead.
    estagio: z.enum(ESTAGIO_IDS).default("lead_bruto"),
    origem: z.enum(["apify", "indicacao", "inbound"]).optional().nullable(),
    origem_detalhe: z.string().trim().max(200).optional(),
    valor_estimado: z.coerce.number().min(0).default(2300),
  })
  .refine((d) => !!d.clinica_id || !!d.clinica_nova, {
    message: "Selecione uma clínica existente ou cadastre uma nova",
  });

export type CreateLeadInput = z.input<typeof createLeadSchema>;

type CreateLeadResult = { ok: true; leadId: string } | { error: string };

/**
 * Cria um lead manual (indicação/inbound). Resolve a clínica primeiro — usa uma
 * existente ou cadastra uma nova — e só então insere o lead, com o score
 * inicial calculado a partir dos dados da clínica.
 */
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  const parsed = createLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let clinicaId = parsed.data.clinica_id ?? null;
  let scoreClinica: ScoreClinica;

  if (clinicaId) {
    const { data: cli, error } = await supabase
      .from("clinicas")
      .select("whatsapp, rating, total_reviews, cidade, estado")
      .eq("id", clinicaId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!cli) return { error: "Clínica não encontrada." };
    scoreClinica = cli;
  } else {
    const nova = parsed.data.clinica_nova!;
    // Conflito de CNPJ único: avisa de forma amigável antes de tentar inserir.
    if (nova.cnpj) {
      const { data: existente } = await supabase
        .from("clinicas")
        .select("id")
        .eq("cnpj", nova.cnpj)
        .maybeSingle();
      if (existente) {
        return { error: "Já existe uma clínica cadastrada com este CNPJ." };
      }
    }
    const { data: inserted, error } = await supabase
      .from("clinicas")
      .insert({
        nome: nova.nome,
        cidade: nova.cidade || null,
        estado: nova.estado || null,
        telefone: nova.telefone || null,
        whatsapp: nova.whatsapp || null,
        endereco: nova.endereco || null,
        cnpj: nova.cnpj || null,
        website: nova.website || null,
        fonte: "manual",
      })
      .select("id, whatsapp, rating, total_reviews, cidade, estado")
      .single();
    if (error) {
      if (error.code === "23505") {
        return { error: "Já existe uma clínica cadastrada com este CNPJ." };
      }
      return { error: error.message };
    }
    clinicaId = inserted.id;
    scoreClinica = inserted;
  }

  const score = calcularScore(scoreClinica, []);

  const { data: leadInserted, error: leadErr } = await supabase
    .from("leads")
    .insert({
      clinica_id: clinicaId,
      estagio: parsed.data.estagio,
      origem: parsed.data.origem ?? null,
      origem_detalhe: parsed.data.origem_detalhe || null,
      valor_estimado: parsed.data.valor_estimado,
      score,
      owner_id: user?.id ?? null,
    })
    .select("id")
    .single();
  if (leadErr) return { error: leadErr.message };

  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true, leadId: leadInserted.id };
}

/**
 * Exclui um lead (soft delete) — preenche `deleted_at`. As queries da página já
 * filtram `deleted_at IS NULL`, então o lead some do kanban mas o dado é
 * preservado. Reversível por `restoreLead`.
 */
export async function softDeleteLead(leadId: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(leadId);
  if (!parsed.success) return { error: "Lead inválido" };

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

/** Restaura um lead excluído — usado pelo "Desfazer" do toast de exclusão. */
export async function restoreLead(leadId: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(leadId);
  if (!parsed.success) return { error: "Lead inválido" };

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: null })
    .eq("id", parsed.data);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}
