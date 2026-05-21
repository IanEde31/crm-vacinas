"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ESTAGIO_IDS } from "@/lib/estagios";
import { fetchLeadDetail, type LeadDetail } from "@/lib/leads/queries";

type ActionResult = { ok: true } | { error: string };

const updateEstagioSchema = z.object({
  leadId: z.string().uuid(),
  novoEstagio: z.enum(ESTAGIO_IDS),
});

export async function updateLeadEstagio(input: {
  leadId: string;
  novoEstagio: string;
}): Promise<ActionResult> {
  const parsed = updateEstagioSchema.safeParse(input);
  if (!parsed.success) return { error: "Estágio inválido" };

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ estagio: parsed.data.novoEstagio })
    .eq("id", parsed.data.leadId);

  if (error) return { error: error.message };
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

  const { error } = parsed.data.id
    ? await supabase.from("clientes_ocultos").update(payload).eq("id", parsed.data.id)
    : await supabase.from("clientes_ocultos").insert(payload);

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
