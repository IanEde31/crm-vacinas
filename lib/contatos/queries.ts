import { createClient } from "@/lib/supabase/server";
import type { CargoContato, EstagioLead } from "@/lib/supabase/types";

const ESTAGIOS_FINAIS: EstagioLead[] = ["ganho", "perdido", "nutricao"];

export type ContatoSortKey = "decisor" | "nome" | "recent" | "clinica";

export type ContatoFilters = {
  busca?: string;
  cargo?: CargoContato;
  clinicaId?: string;
  decisor?: boolean;
  comTarefa?: boolean;
  sort?: ContatoSortKey;
  page?: number;
  perPage?: number;
  id?: string;
};

export type ContatoCard = {
  id: string;
  nome: string | null;
  cargo: CargoContato | null;
  telefone: string | null;
  email: string | null;
  is_decisor: boolean;
  observacoes: string | null;
  created_at: string;
  clinica: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
    whatsapp: string | null;
    leadsAtivos: number;
  } | null;
  tarefasPendentes: number;
};

export type ContatoStats = {
  total: number;
  decisores: number;
  comEmail: number;
  comTelefone: number;
  semCargo: number;
  tarefasPendentes: number;
};

type ContatoRow = {
  id: string;
  nome: string | null;
  cargo: CargoContato | null;
  telefone: string | null;
  email: string | null;
  is_decisor: boolean;
  observacoes: string | null;
  created_at: string;
  clinica: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
    whatsapp: string | null;
    deleted_at: string | null;
    leads: { id: string; estagio: EstagioLead }[] | null;
  } | null;
  tarefas: { id: string; concluida: boolean }[] | null;
};

function toCard(r: ContatoRow): ContatoCard {
  const leadsAtivos =
    (r.clinica?.leads ?? []).filter((l) => !ESTAGIOS_FINAIS.includes(l.estagio))
      .length ?? 0;
  const tarefasPendentes = (r.tarefas ?? []).filter((t) => !t.concluida).length;

  return {
    id: r.id,
    nome: r.nome,
    cargo: r.cargo,
    telefone: r.telefone,
    email: r.email,
    is_decisor: r.is_decisor,
    observacoes: r.observacoes,
    created_at: r.created_at,
    clinica:
      r.clinica && !r.clinica.deleted_at
        ? {
            id: r.clinica.id,
            nome: r.clinica.nome,
            cidade: r.clinica.cidade,
            estado: r.clinica.estado,
            whatsapp: r.clinica.whatsapp,
            leadsAtivos,
          }
        : null,
    tarefasPendentes,
  };
}

export async function fetchContatos(filters: ContatoFilters): Promise<{
  rows: ContatoCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  const supabase = createClient();
  const perPage = Math.max(1, Math.min(filters.perPage ?? 24, 60));
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("contatos")
    .select(
      `
      id, nome, cargo, telefone, email, is_decisor, observacoes, created_at,
      clinica:clinicas!inner ( id, nome, cidade, estado, whatsapp, deleted_at,
        leads ( id, estagio )
      ),
      tarefas:tarefas!contato_id ( id, concluida )
      `,
      { count: "exact" },
    )
    .is("deleted_at", null)
    .is("clinica.deleted_at", null);

  if (filters.id) {
    query = query.eq("id", filters.id);
  }

  if (filters.busca) {
    const pattern = `%${filters.busca}%`;
    query = query.or(
      `nome.ilike.${pattern},email.ilike.${pattern},telefone.ilike.${pattern}`,
    );
  }
  if (filters.cargo) {
    query = query.eq("cargo", filters.cargo);
  }
  if (filters.clinicaId) {
    query = query.eq("clinica_id", filters.clinicaId);
  }
  if (filters.decisor !== undefined) {
    query = query.eq("is_decisor", filters.decisor);
  }

  switch (filters.sort) {
    case "nome":
      query = query.order("nome", { ascending: true, nullsFirst: false });
      break;
    case "recent":
      query = query.order("created_at", { ascending: false });
      break;
    case "clinica":
      query = query
        .order("nome", { ascending: true, foreignTable: "clinica" })
        .order("nome", { ascending: true, nullsFirst: false });
      break;
    case "decisor":
    default:
      query = query
        .order("is_decisor", { ascending: false })
        .order("nome", { ascending: true, nullsFirst: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ContatoRow[];
  let cards = rows.map(toCard);

  if (filters.comTarefa) {
    cards = cards.filter((c) => c.tarefasPendentes > 0);
  }

  const total = count ?? cards.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return { rows: cards, total, page, perPage, totalPages };
}

export async function fetchContatosStats(): Promise<ContatoStats> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contatos")
    .select(
      `
      cargo, email, telefone, is_decisor,
      tarefas:tarefas!contato_id ( id, concluida )
      `,
    )
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  type Row = {
    cargo: CargoContato | null;
    email: string | null;
    telefone: string | null;
    is_decisor: boolean;
    tarefas: { id: string; concluida: boolean }[] | null;
  };
  const rows = (data ?? []) as Row[];

  let decisores = 0;
  let comEmail = 0;
  let comTelefone = 0;
  let semCargo = 0;
  let tarefasPendentes = 0;

  for (const r of rows) {
    if (r.is_decisor) decisores++;
    if (r.email) comEmail++;
    if (r.telefone) comTelefone++;
    if (!r.cargo) semCargo++;
    tarefasPendentes += (r.tarefas ?? []).filter((t) => !t.concluida).length;
  }

  return {
    total: rows.length,
    decisores,
    comEmail,
    comTelefone,
    semCargo,
    tarefasPendentes,
  };
}

export async function fetchClinicasComContato(): Promise<
  { id: string; nome: string }[]
> {
  const supabase = createClient();
  const { data } = await supabase
    .from("contatos")
    .select("clinica:clinicas!inner ( id, nome, deleted_at )")
    .is("deleted_at", null)
    .is("clinica.deleted_at", null);

  type Row = { clinica: { id: string; nome: string; deleted_at: string | null } | null };
  const rows = (data ?? []) as unknown as Row[];

  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.clinica && !r.clinica.deleted_at) {
      map.set(r.clinica.id, r.clinica.nome);
    }
  }
  return Array.from(map.entries())
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
