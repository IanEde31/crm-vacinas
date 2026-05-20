import { createClient } from "@/lib/supabase/server";
import type { EstagioLead, PorteClinica } from "@/lib/supabase/types";

const ESTAGIOS_FINAIS: EstagioLead[] = ["ganho", "perdido", "nutricao"];

export type ClinicaSortKey = "rating" | "reviews" | "recent" | "nome";

export type ClinicaFilters = {
  busca?: string;
  estado?: string;
  cidade?: string;
  porte?: PorteClinica;
  ratingMin?: number;
  sort?: ClinicaSortKey;
  page?: number;
  perPage?: number;
};

export type ClinicaLeadResumo = {
  id: string;
  estagio: EstagioLead;
  score: number;
  updated_at: string;
};

export type ClinicaDecisor = {
  id: string;
  nome: string | null;
  cargo: string | null;
};

export type ClinicaCard = {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  rating: number | null;
  total_reviews: number | null;
  cnpj: string | null;
  website: string | null;
  porte_estimado: PorteClinica | null;
  created_at: string;
  leads: ClinicaLeadResumo[];
  decisor: ClinicaDecisor | null;
};

export type ClinicaStats = {
  total: number;
  cidades: number;
  estados: number;
  ratingMedio: number | null;
  comLeadAtivo: number;
  semProspeccao: number;
  ganhos: number;
};

export type StatusDerivado =
  | { kind: "sem_prospeccao" }
  | { kind: "ativo"; lead: ClinicaLeadResumo }
  | { kind: "ganho"; lead: ClinicaLeadResumo }
  | { kind: "perdido"; lead: ClinicaLeadResumo }
  | { kind: "nutricao"; lead: ClinicaLeadResumo };

export function deriveStatus(leads: ClinicaLeadResumo[]): StatusDerivado {
  if (!leads.length) return { kind: "sem_prospeccao" };
  const sorted = [...leads].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const ativo = sorted.find((l) => !ESTAGIOS_FINAIS.includes(l.estagio));
  if (ativo) return { kind: "ativo", lead: ativo };
  const last = sorted[0];
  if (last.estagio === "ganho") return { kind: "ganho", lead: last };
  if (last.estagio === "perdido") return { kind: "perdido", lead: last };
  return { kind: "nutricao", lead: last };
}

export async function fetchClinicasStats(): Promise<ClinicaStats> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinicas")
    .select("cidade, estado, rating, leads ( estagio )")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  type Row = {
    cidade: string | null;
    estado: string | null;
    rating: number | null;
    leads: { estagio: EstagioLead }[] | null;
  };
  const rows = (data ?? []) as Row[];

  const cidades = new Set<string>();
  const estados = new Set<string>();
  const ratings: number[] = [];
  let comLeadAtivo = 0;
  let semProspeccao = 0;
  let ganhos = 0;

  for (const r of rows) {
    if (r.cidade) cidades.add(r.cidade);
    if (r.estado) estados.add(r.estado);
    if (r.rating !== null) ratings.push(r.rating);
    const leads = r.leads ?? [];
    if (leads.length === 0) {
      semProspeccao++;
    } else if (leads.some((l) => !ESTAGIOS_FINAIS.includes(l.estagio))) {
      comLeadAtivo++;
    }
    if (leads.some((l) => l.estagio === "ganho")) ganhos++;
  }

  const ratingMedio = ratings.length
    ? ratings.reduce((s, n) => s + n, 0) / ratings.length
    : null;

  return {
    total: rows.length,
    cidades: cidades.size,
    estados: estados.size,
    ratingMedio,
    comLeadAtivo,
    semProspeccao,
    ganhos,
  };
}

export async function fetchClinicas(
  filters: ClinicaFilters,
): Promise<{
  rows: ClinicaCard[];
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
    .from("clinicas")
    .select(
      `
      id, nome, cidade, estado, telefone, whatsapp, endereco,
      rating, total_reviews, cnpj, website, porte_estimado, created_at,
      leads ( id, estagio, score, updated_at ),
      contatos ( id, nome, cargo, is_decisor, deleted_at )
      `,
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (filters.busca) {
    query = query.ilike("nome", `%${filters.busca}%`);
  }
  if (filters.estado) {
    query = query.eq("estado", filters.estado);
  }
  if (filters.cidade) {
    query = query.eq("cidade", filters.cidade);
  }
  if (filters.porte) {
    query = query.eq("porte_estimado", filters.porte);
  }
  if (filters.ratingMin !== undefined && filters.ratingMin > 0) {
    query = query.gte("rating", filters.ratingMin);
  }

  switch (filters.sort) {
    case "reviews":
      query = query
        .order("total_reviews", { ascending: false, nullsFirst: false })
        .order("rating", { ascending: false, nullsFirst: false });
      break;
    case "recent":
      query = query.order("created_at", { ascending: false });
      break;
    case "nome":
      query = query.order("nome", { ascending: true });
      break;
    case "rating":
    default:
      query = query
        .order("rating", { ascending: false, nullsFirst: false })
        .order("total_reviews", { ascending: false, nullsFirst: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  type RawClinica = Omit<ClinicaCard, "decisor"> & {
    contatos:
      | {
          id: string;
          nome: string | null;
          cargo: string | null;
          is_decisor: boolean;
          deleted_at: string | null;
        }[]
      | null;
  };

  const raw = (data ?? []) as unknown as RawClinica[];
  const rows: ClinicaCard[] = raw.map(({ contatos, ...rest }) => {
    const decisor =
      (contatos ?? [])
        .filter((c) => !c.deleted_at && c.is_decisor)
        .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"))[0] ?? null;
    return {
      ...rest,
      decisor: decisor
        ? { id: decisor.id, nome: decisor.nome, cargo: decisor.cargo }
        : null,
    };
  });

  const total = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return { rows, total, page, perPage, totalPages };
}

export async function fetchEstadosDistintos(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clinicas")
    .select("estado")
    .is("deleted_at", null)
    .not("estado", "is", null);
  const set = new Set<string>();
  for (const r of data ?? []) if (r.estado) set.add(r.estado);
  return Array.from(set).sort();
}

export async function fetchCidadesDistintas(estado?: string): Promise<string[]> {
  const supabase = createClient();
  let q = supabase
    .from("clinicas")
    .select("cidade")
    .is("deleted_at", null)
    .not("cidade", "is", null);
  if (estado) q = q.eq("estado", estado);
  const { data } = await q;
  const set = new Set<string>();
  for (const r of data ?? []) if (r.cidade) set.add(r.cidade);
  return Array.from(set).sort();
}
