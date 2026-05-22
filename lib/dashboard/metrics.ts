// =============================================================================
// 7Bee CRM — Cálculo das métricas do dashboard
//
// Funções puras: recebem linhas cruas das queries e devolvem dados prontos
// para os componentes. Tudo roda no servidor (Server Component). Nenhuma
// destas funções toca o banco — quem busca é o page.tsx.
// =============================================================================

import { startOfDay, startOfWeek, subDays, subWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ESTAGIOS, ESTAGIO_IDS } from "@/lib/estagios";
import type { EstagioLead, StatusBusca } from "@/lib/supabase/types";
import { calcDelta } from "@/lib/utils";

type Delta = ReturnType<typeof calcDelta>;

// ---- Tipos de entrada -------------------------------------------------------

export type MetricsLead = {
  id: string;
  estagio: EstagioLead;
  valor_estimado: number;
  probabilidade: number;
  score: number;
  created_at: string;
  fechado_em: string | null;
};

export type MetricsMudanca = { lead_id: string; descricao: string | null };

export type MetricsBusca = {
  cidade: string;
  estado: string;
  status: StatusBusca;
  total_encontradas: number;
  novas: number;
  atualizadas: number;
  descartadas: number;
  created_at: string;
};

export type MetricsClinica = { cidade: string | null; estado: string | null };

// ---- Helpers de janela temporal --------------------------------------------

const FECHADOS: EstagioLead[] = ["ganho", "perdido", "nutricao"];

/** Faixas de início/fim (epoch ms) das últimas n semanas, antiga → recente. */
function weekRanges(n: number, ref: Date) {
  const ranges: { start: number; end: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(ref, i), { weekStartsOn: 1 }).getTime();
    const end = startOfWeek(subWeeks(ref, i - 1), { weekStartsOn: 1 }).getTime();
    ranges.push({ start, end });
  }
  return ranges;
}

function countInRanges(times: number[], ranges: { start: number; end: number }[]) {
  return ranges.map(
    (r) => times.filter((t) => t >= r.start && t < r.end).length,
  );
}

function sumInRanges(
  items: { t: number; v: number }[],
  ranges: { start: number; end: number }[],
) {
  return ranges.map((r) =>
    items
      .filter((x) => x.t >= r.start && x.t < r.end)
      .reduce((s, x) => s + x.v, 0),
  );
}

// =============================================================================
// 01 — PULSO (KPIs com comparativos)
// =============================================================================

export type KpiData = {
  valorPipeline: number;
  mrrProjetado: number;
  totalAtivos: number;
  inflow30d: number;
  inflowDelta: Delta;
  inflowSpark: number[];

  receitaFechada30d: number;
  receitaDelta: Delta;
  receitaSpark: number[];

  conversao30d: number;
  conversaoDelta: Delta;
  conversaoSpark: number[];
  ganhos30d: number;
  perdidos30d: number;

  atividades7d: number;
  atividadesDelta: Delta;
  atividadesSpark: number[];
};

export function aggregateKpis(
  leads: MetricsLead[],
  atividadeDates: string[],
  now: Date,
): KpiData {
  const d7 = subDays(now, 7).getTime();
  const d14 = subDays(now, 14).getTime();
  const d30 = subDays(now, 30).getTime();
  const d60 = subDays(now, 60).getTime();

  const ativos = leads.filter((l) => !FECHADOS.includes(l.estagio));
  const valorPipeline = ativos.reduce(
    (s, l) => s + Number(l.valor_estimado ?? 0),
    0,
  );
  const mrrProjetado = ativos.reduce(
    (s, l) =>
      s + (Number(l.valor_estimado ?? 0) * Number(l.probabilidade ?? 0)) / 100,
    0,
  );

  // Inflow — leads novos entrando no pipeline.
  const criadosTimes = leads.map((l) => new Date(l.created_at).getTime());
  const inflow30d = criadosTimes.filter((t) => t >= d30).length;
  const inflowPrev = criadosTimes.filter((t) => t >= d60 && t < d30).length;

  // Fechamentos.
  const ganhos = leads.filter((l) => l.estagio === "ganho" && l.fechado_em);
  const perdidos = leads.filter((l) => l.estagio === "perdido" && l.fechado_em);
  const ganhoTime = (l: MetricsLead) => new Date(l.fechado_em as string).getTime();

  const ganhos30d = ganhos.filter((l) => ganhoTime(l) >= d30);
  const ganhosPrev = ganhos.filter(
    (l) => ganhoTime(l) >= d60 && ganhoTime(l) < d30,
  );
  const perdidos30d = perdidos.filter((l) => ganhoTime(l) >= d30);
  const perdidosPrev = perdidos.filter(
    (l) => ganhoTime(l) >= d60 && ganhoTime(l) < d30,
  );

  const receitaFechada30d = ganhos30d.reduce(
    (s, l) => s + Number(l.valor_estimado ?? 0),
    0,
  );
  const receitaPrev = ganhosPrev.reduce(
    (s, l) => s + Number(l.valor_estimado ?? 0),
    0,
  );

  const fechados30 = ganhos30d.length + perdidos30d.length;
  const fechadosPrev = ganhosPrev.length + perdidosPrev.length;
  const conversao30d = fechados30
    ? Math.round((ganhos30d.length / fechados30) * 100)
    : 0;
  const conversaoPrev = fechadosPrev
    ? Math.round((ganhosPrev.length / fechadosPrev) * 100)
    : 0;

  // Atividades — ritmo operacional.
  const ativTimes = atividadeDates.map((d) => new Date(d).getTime());
  const atividades7d = ativTimes.filter((t) => t >= d7).length;
  const atividadesPrev = ativTimes.filter((t) => t >= d14 && t < d7).length;

  // Sparklines.
  const weeks8 = weekRanges(8, now);
  const inflowSpark = countInRanges(criadosTimes, weeks8);
  const receitaSpark = sumInRanges(
    ganhos.map((l) => ({ t: ganhoTime(l), v: Number(l.valor_estimado ?? 0) })),
    weeks8,
  );
  const conversaoSpark = countInRanges(
    ganhos.map((l) => ganhoTime(l)),
    weeks8,
  );
  // Ritmo operacional: contagem diária dos últimos 14 dias.
  const atividadesSpark: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = startOfDay(subDays(now, i)).getTime();
    const dayEnd = dayStart + 86_400_000;
    atividadesSpark.push(
      ativTimes.filter((t) => t >= dayStart && t < dayEnd).length,
    );
  }

  return {
    valorPipeline,
    mrrProjetado,
    totalAtivos: ativos.length,
    inflow30d,
    inflowDelta: calcDelta(inflow30d, inflowPrev),
    inflowSpark,
    receitaFechada30d,
    receitaDelta: calcDelta(receitaFechada30d, receitaPrev),
    receitaSpark,
    conversao30d,
    conversaoDelta: calcDelta(conversao30d, conversaoPrev),
    conversaoSpark,
    ganhos30d: ganhos30d.length,
    perdidos30d: perdidos30d.length,
    atividades7d,
    atividadesDelta: calcDelta(atividades7d, atividadesPrev),
    atividadesSpark,
  };
}

// =============================================================================
// 03 — FUNIL ESTRATÉGICO (taxa de conversão entre etapas)
// =============================================================================

const FUNIL_IDS = ESTAGIO_IDS.slice(0, 9); // lead_bruto .. ganho
const FUNIL_INDEX = new Map<EstagioLead, number>(
  FUNIL_IDS.map((id, i) => [id, i]),
);
const LABELS = new Map(ESTAGIOS.map((e) => [e.id, e.label]));

export type FunilStage = {
  id: EstagioLead;
  label: string;
  reached: number; // leads que alcançaram esta etapa (histórico)
  atual: number; // leads parados exatamente aqui agora
  valor: number; // valor em aberto nesta etapa
  convFromPrev: number | null; // % de conversão vindo da etapa anterior
};

export type FunilData = {
  stages: FunilStage[];
  totalEntrada: number;
  ganhos: number;
  perdidos: number;
  nutricao: number;
  convGlobal: number; // lead_bruto → ganho
  bottleneckId: EstagioLead | null;
  bottleneckConv: number | null;
  velocidadeMediaDias: number | null;
};

export function aggregateFunil(
  leads: MetricsLead[],
  mudancas: MetricsMudanca[],
): FunilData {
  // Reconstrói o histórico do funil a partir do log de mudança de estágio
  // (gravado automaticamente pelo trigger log_mudanca_estagio).
  const targetsPorLead = new Map<string, Set<EstagioLead>>();
  for (const m of mudancas) {
    if (!m.descricao) continue;
    const match = m.descricao.match(/para "([a-z_]+)"/);
    if (!match) continue;
    const stage = match[1] as EstagioLead;
    if (!FUNIL_INDEX.has(stage)) continue;
    let set = targetsPorLead.get(m.lead_id);
    if (!set) {
      set = new Set();
      targetsPorLead.set(m.lead_id, set);
    }
    set.add(stage);
  }

  // Índice da etapa mais avançada que cada lead já alcançou.
  const leadMaxIdx = leads.map((l) => {
    let idx = FUNIL_INDEX.get(l.estagio) ?? 0;
    const targets = targetsPorLead.get(l.id);
    if (targets) {
      for (const t of Array.from(targets)) {
        idx = Math.max(idx, FUNIL_INDEX.get(t) ?? 0);
      }
    }
    return idx;
  });

  const stages: FunilStage[] = FUNIL_IDS.map((id, i) => {
    const reached = leadMaxIdx.filter((idx) => idx >= i).length;
    const naEtapa = leads.filter((l) => l.estagio === id);
    return {
      id,
      label: LABELS.get(id) ?? id,
      reached,
      atual: naEtapa.length,
      valor: naEtapa.reduce((s, l) => s + Number(l.valor_estimado ?? 0), 0),
      convFromPrev: null,
    };
  });

  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].reached;
    stages[i].convFromPrev = prev > 0
      ? Math.round((stages[i].reached / prev) * 100)
      : null;
  }

  // Gargalo: menor conversão entre etapas que de fato tiveram fluxo.
  let bottleneckId: EstagioLead | null = null;
  let bottleneckConv: number | null = null;
  for (let i = 1; i < stages.length; i++) {
    const c = stages[i].convFromPrev;
    if (c == null || stages[i - 1].reached < 3) continue;
    if (bottleneckConv == null || c < bottleneckConv) {
      bottleneckConv = c;
      bottleneckId = stages[i].id;
    }
  }

  const totalEntrada = stages[0]?.reached ?? leads.length;
  const ganhos = leads.filter((l) => l.estagio === "ganho").length;
  const perdidos = leads.filter((l) => l.estagio === "perdido").length;
  const nutricao = leads.filter((l) => l.estagio === "nutricao").length;
  const convGlobal = totalEntrada > 0
    ? Math.round((ganhos / totalEntrada) * 100)
    : 0;

  // Velocidade: dias entre criação e fechamento dos leads ganhos.
  const duracoes = leads
    .filter((l) => l.estagio === "ganho" && l.fechado_em)
    .map(
      (l) =>
        (new Date(l.fechado_em as string).getTime() -
          new Date(l.created_at).getTime()) /
        86_400_000,
    )
    .filter((d) => d >= 0);
  const velocidadeMediaDias = duracoes.length
    ? Math.round(duracoes.reduce((s, d) => s + d, 0) / duracoes.length)
    : null;

  return {
    stages,
    totalEntrada,
    ganhos,
    perdidos,
    nutricao,
    convGlobal,
    bottleneckId,
    bottleneckConv,
    velocidadeMediaDias,
  };
}

// =============================================================================
// 04 — RADAR DE PROSPECÇÃO (geração de leads via APIFY)
// =============================================================================

export type RadarData = {
  buscas30d: number;
  encontrados30d: number;
  novas30d: number;
  atualizadas30d: number;
  descartadas30d: number;
  taxaNovos: number; // % de leads inéditos por varredura
  ultimaBusca: {
    cidade: string;
    estado: string;
    quando: string;
    novas: number;
    status: StatusBusca;
  } | null;
  topCidades: { cidade: string; estado: string; total: number }[];
  baseClinicas: number;
};

export function aggregateRadar(
  buscas: MetricsBusca[],
  clinicas: MetricsClinica[],
  now: Date,
): RadarData {
  const d30 = subDays(now, 30).getTime();
  const recentes = buscas.filter(
    (b) => new Date(b.created_at).getTime() >= d30,
  );
  const concluidas = recentes.filter((b) => b.status === "concluida");

  const novas30d = concluidas.reduce((s, b) => s + (b.novas ?? 0), 0);
  const atualizadas30d = concluidas.reduce(
    (s, b) => s + (b.atualizadas ?? 0),
    0,
  );
  const descartadas30d = concluidas.reduce(
    (s, b) => s + (b.descartadas ?? 0),
    0,
  );
  const encontrados30d = novas30d + atualizadas30d + descartadas30d;
  const taxaNovos = encontrados30d
    ? Math.round((novas30d / encontrados30d) * 100)
    : 0;

  const ordenadas = [...buscas].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const ultima = ordenadas[0] ?? null;

  // Ranking de cidades pela base de clínicas.
  const cidadeMap = new Map<string, { cidade: string; estado: string; total: number }>();
  for (const c of clinicas) {
    if (!c.cidade) continue;
    const key = `${c.cidade}|${c.estado ?? ""}`;
    const cur = cidadeMap.get(key);
    if (cur) cur.total += 1;
    else
      cidadeMap.set(key, {
        cidade: c.cidade,
        estado: c.estado ?? "",
        total: 1,
      });
  }
  const topCidades = Array.from(cidadeMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    buscas30d: recentes.length,
    encontrados30d,
    novas30d,
    atualizadas30d,
    descartadas30d,
    taxaNovos,
    ultimaBusca: ultima
      ? {
          cidade: ultima.cidade,
          estado: ultima.estado,
          quando: ultima.created_at,
          novas: ultima.novas ?? 0,
          status: ultima.status,
        }
      : null,
    topCidades,
    baseClinicas: clinicas.length,
  };
}

// =============================================================================
// 04 — RITMO DE ATIVIDADE (série temporal)
// =============================================================================

export type RitmoData = {
  serie: { label: string; value: number }[];
  total14d: number;
  mediaDia: number;
  porTipo: { tipo: string; count: number }[];
};

export function aggregateRitmo(
  atividades: { realizada_em: string; tipo: string }[],
  now: Date,
): RitmoData {
  const dias: { ts: number; label: string }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = startOfDay(subDays(now, i));
    dias.push({ ts: d.getTime(), label: format(d, "dd/MM", { locale: ptBR }) });
  }

  const serie = dias.map((d) => ({
    label: d.label,
    value: atividades.filter(
      (a) => startOfDay(new Date(a.realizada_em)).getTime() === d.ts,
    ).length,
  }));

  const total14d = serie.reduce((s, d) => s + d.value, 0);

  const tipoMap = new Map<string, number>();
  for (const a of atividades) {
    tipoMap.set(a.tipo, (tipoMap.get(a.tipo) ?? 0) + 1);
  }
  const porTipo = Array.from(tipoMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  return {
    serie,
    total14d,
    mediaDia: Math.round((total14d / 14) * 10) / 10,
    porTipo,
  };
}
