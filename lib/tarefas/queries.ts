import { endOfDay, endOfWeek, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { PrioridadeTarefa } from "@/lib/supabase/types";

export type TarefaStatus = "pendentes" | "concluidas" | "todas";
export type TarefaScope = "minhas" | "todas";

export type TarefaFilters = {
  busca?: string;
  prioridade?: PrioridadeTarefa;
  status?: TarefaStatus;
  scope?: TarefaScope;
};

export type TarefaItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  concluida: boolean;
  concluida_em: string | null;
  prioridade: PrioridadeTarefa;
  owner_id: string | null;
  created_at: string;
  lead: {
    id: string;
    clinica_nome: string | null;
  } | null;
  clinica: {
    id: string;
    nome: string;
  } | null;
  contato: {
    id: string;
    nome: string | null;
    cargo: string | null;
    clinica_nome: string | null;
  } | null;
};

export type BucketId =
  | "vencidas"
  | "hoje"
  | "semana"
  | "depois"
  | "sem_prazo"
  | "concluidas";

export type BucketGroup = {
  id: BucketId;
  label: string;
  tarefas: TarefaItem[];
};

export type TarefaStats = {
  totalPendentes: number;
  vencidas: number;
  hoje: number;
  estaSemana: number;
  concluidasSemana: number;
  semPrazo: number;
};

const BUCKET_LABELS: Record<BucketId, string> = {
  vencidas: "Vencidas",
  hoje: "Hoje",
  semana: "Esta semana",
  depois: "Mais tarde",
  sem_prazo: "Sem prazo",
  concluidas: "Concluídas",
};

const BUCKET_ORDER: BucketId[] = [
  "vencidas",
  "hoje",
  "semana",
  "depois",
  "sem_prazo",
  "concluidas",
];

export function bucketOf(t: TarefaItem, now: Date = new Date()): BucketId {
  if (t.concluida) return "concluidas";
  if (!t.prazo) return "sem_prazo";
  const prazo = new Date(t.prazo);
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);
  const endThisWeek = endOfWeek(now, { weekStartsOn: 1 });

  if (prazo < startToday) return "vencidas";
  if (prazo <= endToday) return "hoje";
  if (prazo <= endThisWeek) return "semana";
  return "depois";
}

export function groupByBuckets(tarefas: TarefaItem[]): BucketGroup[] {
  const map = new Map<BucketId, TarefaItem[]>();
  for (const id of BUCKET_ORDER) map.set(id, []);
  for (const t of tarefas) {
    map.get(bucketOf(t))!.push(t);
  }
  return BUCKET_ORDER.map((id) => ({
    id,
    label: BUCKET_LABELS[id],
    tarefas: map.get(id) ?? [],
  })).filter((g) => g.tarefas.length > 0);
}

type TarefaRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  concluida: boolean;
  concluida_em: string | null;
  prioridade: PrioridadeTarefa;
  owner_id: string | null;
  created_at: string;
  lead: {
    id: string;
    clinica: { nome: string | null } | null;
  } | null;
  clinica: { id: string; nome: string } | null;
  contato: {
    id: string;
    nome: string | null;
    cargo: string | null;
    clinica: { nome: string | null } | null;
  } | null;
};

async function fetchAllForUser(currentUserId: string | null): Promise<TarefaItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tarefas")
    .select(
      `
      id, titulo, descricao, prazo, concluida, concluida_em,
      prioridade, owner_id, created_at,
      lead:leads ( id, clinica:clinicas ( nome ) ),
      clinica:clinicas ( id, nome ),
      contato:contatos ( id, nome, cargo, clinica:clinicas ( nome ) )
      `,
    )
    .order("prazo", { ascending: true, nullsFirst: false })
    .order("prioridade", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as TarefaRow[];
  void currentUserId;
  return rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    descricao: r.descricao,
    prazo: r.prazo,
    concluida: r.concluida,
    concluida_em: r.concluida_em,
    prioridade: r.prioridade,
    owner_id: r.owner_id,
    created_at: r.created_at,
    lead: r.lead
      ? {
          id: r.lead.id,
          clinica_nome: r.lead.clinica?.nome ?? null,
        }
      : null,
    clinica: r.clinica ? { id: r.clinica.id, nome: r.clinica.nome } : null,
    contato: r.contato
      ? {
          id: r.contato.id,
          nome: r.contato.nome,
          cargo: r.contato.cargo,
          clinica_nome: r.contato.clinica?.nome ?? null,
        }
      : null,
  }));
}

export async function fetchTarefas(
  filters: TarefaFilters,
): Promise<{ tarefas: TarefaItem[]; currentUserId: string | null }> {
  const supabase = createClient();
  // Verificação local do JWT (ES256) em vez de getUser() — sem round-trip de rede.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub ?? null;

  const all = await fetchAllForUser(userId);

  const status = filters.status ?? "pendentes";
  const scope = filters.scope ?? "todas";

  let filtered = all;

  if (status === "pendentes") {
    filtered = filtered.filter((t) => !t.concluida);
  } else if (status === "concluidas") {
    filtered = filtered.filter((t) => t.concluida);
  }

  if (filters.prioridade) {
    filtered = filtered.filter((t) => t.prioridade === filters.prioridade);
  }

  if (scope === "minhas" && userId) {
    filtered = filtered.filter((t) => t.owner_id === userId);
  }

  if (filters.busca) {
    const needle = filters.busca.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.titulo.toLowerCase().includes(needle) ||
        (t.descricao ?? "").toLowerCase().includes(needle) ||
        (t.lead?.clinica_nome ?? "").toLowerCase().includes(needle) ||
        (t.clinica?.nome ?? "").toLowerCase().includes(needle) ||
        (t.contato?.nome ?? "").toLowerCase().includes(needle) ||
        (t.contato?.clinica_nome ?? "").toLowerCase().includes(needle),
    );
  }

  return { tarefas: filtered, currentUserId: userId };
}

export async function fetchTarefasStats(): Promise<TarefaStats> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tarefas")
    .select("prazo, concluida, concluida_em");
  if (error) throw new Error(error.message);

  type Row = { prazo: string | null; concluida: boolean; concluida_em: string | null };
  const rows = (data ?? []) as Row[];

  const now = new Date();
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);
  const endThisWeek = endOfWeek(now, { weekStartsOn: 1 });
  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  let totalPendentes = 0;
  let vencidas = 0;
  let hoje = 0;
  let estaSemana = 0;
  let semPrazo = 0;
  let concluidasSemana = 0;

  for (const r of rows) {
    if (r.concluida) {
      if (r.concluida_em && new Date(r.concluida_em).getTime() >= weekAgoMs) {
        concluidasSemana++;
      }
      continue;
    }
    totalPendentes++;
    if (!r.prazo) {
      semPrazo++;
      continue;
    }
    const p = new Date(r.prazo);
    if (p < startToday) vencidas++;
    else if (p <= endToday) hoje++;
    else if (p <= endThisWeek) estaSemana++;
  }

  return {
    totalPendentes,
    vencidas,
    hoje,
    estaSemana,
    concluidasSemana,
    semPrazo,
  };
}
