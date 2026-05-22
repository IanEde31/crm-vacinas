import { createClient } from "@/lib/supabase/server";
import {
  endOfWeek,
  startOfDay,
  subDays,
  isToday,
  isPast,
} from "date-fns";
import type { EstagioLead } from "@/lib/supabase/types";
import { CommandHeader } from "@/components/dashboard/command-header";
import { Section } from "@/components/dashboard/section";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { FunilCard } from "@/components/dashboard/funil";
import { RadarPanel } from "@/components/dashboard/radar-panel";
import { RitmoPanel } from "@/components/dashboard/ritmo";
import { HotLeads } from "@/components/dashboard/hot-leads";
import { TarefasUpcoming } from "@/components/dashboard/tarefas-upcoming";
import { LeadsParados } from "@/components/dashboard/leads-parados";
import {
  ClienteOcultoIntel,
  aggregateClienteOculto,
  type ClienteOcultoRaw,
} from "@/components/dashboard/cliente-oculto-intel";
import {
  aggregateKpis,
  aggregateFunil,
  aggregateRadar,
  aggregateRitmo,
  type MetricsLead,
  type MetricsMudanca,
  type MetricsBusca,
  type MetricsClinica,
} from "@/lib/dashboard/metrics";

export const metadata = { title: "Centro de Comando | 7Bee CRM" };
export const dynamic = "force-dynamic";

const ESTAGIOS_FECHADOS: EstagioLead[] = ["ganho", "perdido", "nutricao"];

export default async function DashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const todayStart = startOfDay(now).toISOString();
  const sixtyDaysAgo = subDays(now, 60).toISOString();
  const fourteenDaysAgo = subDays(now, 14).getTime();

  // O layout já validou a sessão; aqui só precisamos do e-mail para o header.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userEmail = claimsData?.claims.email ?? null;

  const [
    leadsRes,
    mudancasRes,
    tarefasRes,
    paradosRes,
    hotLeadsRes,
    atividadesRecentesRes,
    atividadesSerieRes,
    clienteOcultoRes,
    buscasRes,
    clinicasRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, estagio, valor_estimado, probabilidade, score, created_at, fechado_em",
      )
      .is("deleted_at", null),
    supabase
      .from("atividades")
      .select("lead_id, descricao")
      .eq("tipo", "mudanca_estagio"),
    supabase
      .from("tarefas")
      .select(
        `
        id, titulo, prazo, prioridade, concluida, lead_id,
        leads ( clinicas ( nome ) )
        `,
      )
      .eq("concluida", false)
      .not("prazo", "is", null)
      .lte("prazo", weekEnd)
      .order("prazo")
      .limit(20),
    supabase
      .from("leads")
      .select(
        `
        id, created_at,
        clinica:clinicas ( nome, cidade ),
        atividades ( realizada_em )
        `,
      )
      .is("deleted_at", null)
      .not("estagio", "in", `(${ESTAGIOS_FECHADOS.join(",")})`)
      .order("realizada_em", { ascending: false, referencedTable: "atividades" })
      .limit(1, { referencedTable: "atividades" }),
    supabase
      .from("leads")
      .select(
        `
        id, score, estagio, valor_estimado, probabilidade,
        clinica:clinicas ( nome, cidade, estado )
        `,
      )
      .is("deleted_at", null)
      .not("estagio", "in", `(${ESTAGIOS_FECHADOS.join(",")})`)
      .order("score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("atividades")
      .select(
        `
        id, tipo, titulo, realizada_em,
        lead:leads ( id, clinica:clinicas ( nome ) )
        `,
      )
      .order("realizada_em", { ascending: false })
      .limit(8),
    supabase
      .from("atividades")
      .select("realizada_em, tipo")
      .gte("realizada_em", sixtyDaysAgo),
    supabase
      .from("clientes_ocultos")
      .select(
        `
        id, respondeu, tentou_agendar, fez_followup, conseguiu_preco,
        qualidade_atendimento, tempo_resposta_minutos, status,
        lead:leads ( id, score, estagio, deleted_at,
          clinica:clinicas ( nome, cidade, estado ) )
        `,
      ),
    supabase
      .from("buscas")
      .select(
        "cidade, estado, status, total_encontradas, novas, atualizadas, descartadas, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("clinicas")
      .select("cidade, estado")
      .is("deleted_at", null),
  ]);

  // ---- 01 · Pulso · 03 · Funil ---------------------------------------------
  const leads = (leadsRes.data as MetricsLead[] | null) ?? [];
  const mudancas = (mudancasRes.data as MetricsMudanca[] | null) ?? [];
  const atividadesSerie =
    (atividadesSerieRes.data as { realizada_em: string; tipo: string }[] | null) ??
    [];

  const kpi = aggregateKpis(
    leads,
    atividadesSerie.map((a) => a.realizada_em),
    now,
  );
  const funil = aggregateFunil(leads, mudancas);

  // ---- 04 · Radar & Ritmo --------------------------------------------------
  const radar = aggregateRadar(
    (buscasRes.data as MetricsBusca[] | null) ?? [],
    (clinicasRes.data as MetricsClinica[] | null) ?? [],
    now,
  );
  const ritmo = aggregateRitmo(
    atividadesSerie.filter(
      (a) => new Date(a.realizada_em).getTime() >= fourteenDaysAgo,
    ),
    now,
  );

  // ---- 02 · Inteligência de Cliente Oculto ---------------------------------
  const clienteOcultoIntel = aggregateClienteOculto(
    (clienteOcultoRes.data as unknown as ClienteOcultoRaw[]) ?? [],
  );

  // ---- Tarefas -------------------------------------------------------------
  type TarefaRow = {
    id: string;
    titulo: string;
    prazo: string | null;
    prioridade: "baixa" | "media" | "alta";
    lead_id: string | null;
    leads: { clinicas: { nome: string } | null } | null;
  };
  const tarefasProximas = ((tarefasRes.data as unknown as TarefaRow[]) ?? []).map(
    (t) => ({
      id: t.id,
      titulo: t.titulo,
      prazo: t.prazo,
      prioridade: t.prioridade,
      lead_id: t.lead_id,
      clinica_nome: t.leads?.clinicas?.nome ?? null,
    }),
  );
  const tarefasHoje = tarefasProximas.filter(
    (t) => t.prazo && isToday(new Date(t.prazo)),
  ).length;
  const tarefasVencidas = tarefasProximas.filter(
    (t) => t.prazo && isPast(new Date(t.prazo)) && !isToday(new Date(t.prazo)),
  ).length;

  // ---- Leads parados -------------------------------------------------------
  type ParadoRow = {
    id: string;
    created_at: string;
    clinica: { nome: string; cidade: string | null } | null;
    atividades: { realizada_em: string }[] | null;
  };
  const paradosRows = (paradosRes.data as unknown as ParadoRow[]) ?? [];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const paradosList = paradosRows
    .map((r) => ({
      id: r.id,
      clinica_nome: r.clinica?.nome ?? "(sem clínica)",
      clinica_cidade: r.clinica?.cidade ?? null,
      ultima_atividade_em: r.atividades?.[0]?.realizada_em ?? r.created_at,
    }))
    .filter(
      (r) => Date.now() - new Date(r.ultima_atividade_em).getTime() > sevenDaysMs,
    )
    .sort(
      (a, b) =>
        new Date(a.ultima_atividade_em).getTime() -
        new Date(b.ultima_atividade_em).getTime(),
    );

  // ---- Hot leads -----------------------------------------------------------
  type HotLeadRow = {
    id: string;
    score: number;
    estagio: EstagioLead;
    valor_estimado: number;
    probabilidade: number;
    clinica: { nome: string; cidade: string | null; estado: string | null } | null;
  };
  const hotLeads = ((hotLeadsRes.data as unknown as HotLeadRow[]) ?? []).map(
    (l) => ({
      id: l.id,
      score: l.score,
      estagio: l.estagio,
      valor_estimado: Number(l.valor_estimado ?? 0),
      probabilidade: Number(l.probabilidade ?? 0),
      clinica_nome: l.clinica?.nome ?? "(sem clínica)",
      clinica_local:
        [l.clinica?.cidade, l.clinica?.estado].filter(Boolean).join(" · ") ||
        null,
    }),
  );

  // ---- Atividade recente ---------------------------------------------------
  type AtividadeRow = {
    id: string;
    tipo: string;
    titulo: string | null;
    realizada_em: string;
    lead: { id: string; clinica: { nome: string } | null } | null;
  };
  const atividadesRecentes = (
    (atividadesRecentesRes.data as unknown as AtividadeRow[]) ?? []
  ).map((a) => ({
    id: a.id,
    tipo: a.tipo,
    titulo: a.titulo,
    realizada_em: a.realizada_em,
    lead_id: a.lead?.id ?? null,
    clinica_nome: a.lead?.clinica?.nome ?? null,
  }));

  return (
    <div className="space-y-7 pb-6">
      <CommandHeader
        userEmail={userEmail}
        valorPipeline={kpi.valorPipeline}
        totalAtivos={kpi.totalAtivos}
        tarefasHoje={tarefasHoje}
        pendencias={tarefasVencidas}
      />

      <Section
        index="01"
        title="Pulso"
        hint="indicadores vs. período anterior"
        delay={80}
      >
        <KpiRow kpi={kpi} />
      </Section>

      <Section
        index="02"
        title="Inteligência de Cliente Oculto"
        hint="o atendimento das clínicas, radiografado"
        delay={160}
      >
        <ClienteOcultoIntel intel={clienteOcultoIntel} />
      </Section>

      <Section
        index="03"
        title="Funil & Conversão"
        hint="onde os leads escapam"
        delay={240}
      >
        <FunilCard funil={funil} />
      </Section>

      <Section
        index="04"
        title="Radar & Ritmo"
        hint="geração de leads e cadência operacional"
        delay={320}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RadarPanel radar={radar} />
          <RitmoPanel ritmo={ritmo} recentes={atividadesRecentes} />
        </div>
      </Section>

      <Section
        index="05"
        title="Ação do dia"
        hint="prioridades operacionais"
        delay={400}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <HotLeads leads={hotLeads} />
          <LeadsParados leads={paradosList} totalAtivos={kpi.totalAtivos} />
          <TarefasUpcoming tarefas={tarefasProximas} todayStart={todayStart} />
        </div>
      </Section>
    </div>
  );
}
