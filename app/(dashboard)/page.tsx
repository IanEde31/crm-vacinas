import { createClient } from "@/lib/supabase/server";
import { endOfWeek, startOfDay, subDays } from "date-fns";
import { ESTAGIOS } from "@/lib/estagios";
import type { EstagioLead } from "@/lib/supabase/types";
import { DashboardHero } from "@/components/dashboard/hero";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { FunilCard } from "@/components/dashboard/funil";
import { HotLeads } from "@/components/dashboard/hot-leads";
import { AtividadesRecentes } from "@/components/dashboard/atividades-recentes";
import { TarefasUpcoming } from "@/components/dashboard/tarefas-upcoming";
import { LeadsParados } from "@/components/dashboard/leads-parados";

export const metadata = { title: "Dashboard | 7Bee CRM" };
export const dynamic = "force-dynamic";

const ESTAGIOS_FECHADOS: EstagioLead[] = ["ganho", "perdido", "nutricao"];

export default async function DashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const todayStart = startOfDay(now).toISOString();
  const thirtyDaysAgo = subDays(now, 30).toISOString();

  // Verificação local do JWT — o layout já validou a sessão; aqui só
  // precisamos do e-mail para o hero.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userEmail = claimsData?.claims.email ?? null;

  const [
    leadsPipelineRes,
    leadsFechadosRes,
    tarefasRes,
    paradosRes,
    hotLeadsRes,
    atividadesRes,
    atividadesSemanaRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("estagio, valor_estimado, probabilidade")
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("estagio, valor_estimado, fechado_em")
      .is("deleted_at", null)
      .in("estagio", ["ganho", "perdido"])
      .gte("fechado_em", thirtyDaysAgo),
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
        id, tipo, titulo, realizada_em, resultado,
        lead:leads ( id, clinica:clinicas ( nome ) )
        `,
      )
      .order("realizada_em", { ascending: false })
      .limit(8),
    supabase
      .from("atividades")
      .select("id", { count: "exact", head: true })
      .gte("realizada_em", subDays(now, 7).toISOString()),
  ]);

  type PipelineRow = { estagio: EstagioLead; valor_estimado: number; probabilidade: number };
  const pipeline = (leadsPipelineRes.data as PipelineRow[] | null) ?? [];

  const funilStats = ESTAGIOS.map((e) => {
    const leadsNoEstagio = pipeline.filter((l) => l.estagio === e.id);
    const valor = leadsNoEstagio.reduce(
      (s, l) => s + Number(l.valor_estimado ?? 0),
      0,
    );
    return {
      id: e.id,
      label: e.label,
      count: leadsNoEstagio.length,
      valor,
    };
  });

  const ativos = pipeline.filter((l) => !ESTAGIOS_FECHADOS.includes(l.estagio));
  const totalAtivos = ativos.length;
  const valorPipeline = ativos.reduce(
    (s, l) => s + Number(l.valor_estimado ?? 0),
    0,
  );
  const mrrProjetado = ativos.reduce(
    (s, l) =>
      s + (Number(l.valor_estimado ?? 0) * Number(l.probabilidade ?? 0)) / 100,
    0,
  );

  type FechadoRow = { estagio: EstagioLead; valor_estimado: number; fechado_em: string | null };
  const fechados = (leadsFechadosRes.data as FechadoRow[] | null) ?? [];
  const ganhos = fechados.filter((l) => l.estagio === "ganho");
  const perdidos = fechados.filter((l) => l.estagio === "perdido");
  const taxaConversao =
    fechados.length > 0 ? Math.round((ganhos.length / fechados.length) * 100) : 0;
  const mrrFechado30d = ganhos.reduce(
    (s, l) => s + Number(l.valor_estimado ?? 0),
    0,
  );

  type TarefaRow = {
    id: string;
    titulo: string;
    prazo: string | null;
    prioridade: "baixa" | "media" | "alta";
    lead_id: string | null;
    leads: { clinicas: { nome: string } | null } | null;
  };
  const tarefasProximas = ((tarefasRes.data as unknown as TarefaRow[]) ?? []).map((t) => ({
    id: t.id,
    titulo: t.titulo,
    prazo: t.prazo,
    prioridade: t.prioridade,
    lead_id: t.lead_id,
    clinica_nome: t.leads?.clinicas?.nome ?? null,
  }));

  const atividadesSemanaCount = atividadesSemanaRes.count ?? 0;

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
    .filter((r) => Date.now() - new Date(r.ultima_atividade_em).getTime() > sevenDaysMs)
    .sort(
      (a, b) =>
        new Date(a.ultima_atividade_em).getTime() -
        new Date(b.ultima_atividade_em).getTime(),
    );

  type HotLeadRow = {
    id: string;
    score: number;
    estagio: EstagioLead;
    valor_estimado: number;
    probabilidade: number;
    clinica: { nome: string; cidade: string | null; estado: string | null } | null;
  };
  const hotLeads = ((hotLeadsRes.data as unknown as HotLeadRow[]) ?? []).map((l) => ({
    id: l.id,
    score: l.score,
    estagio: l.estagio,
    valor_estimado: Number(l.valor_estimado ?? 0),
    probabilidade: Number(l.probabilidade ?? 0),
    clinica_nome: l.clinica?.nome ?? "(sem clínica)",
    clinica_local:
      [l.clinica?.cidade, l.clinica?.estado].filter(Boolean).join(" · ") || null,
  }));

  type AtividadeRow = {
    id: string;
    tipo: string;
    titulo: string | null;
    realizada_em: string;
    resultado: string | null;
    lead: { id: string; clinica: { nome: string } | null } | null;
  };
  const atividadesRecentes = ((atividadesRes.data as unknown as AtividadeRow[]) ?? []).map(
    (a) => ({
      id: a.id,
      tipo: a.tipo,
      titulo: a.titulo,
      realizada_em: a.realizada_em,
      resultado: a.resultado,
      lead_id: a.lead?.id ?? null,
      clinica_nome: a.lead?.clinica?.nome ?? null,
    }),
  );

  return (
    <div className="space-y-6">
      <DashboardHero userEmail={userEmail} />

      <KpiRow
        mrrProjetado={mrrProjetado}
        mrrFechado30d={mrrFechado30d}
        valorPipeline={valorPipeline}
        totalAtivos={totalAtivos}
        taxaConversao={taxaConversao}
        ganhos={ganhos.length}
        perdidos={perdidos.length}
        atividadesSemana={atividadesSemanaCount}
        tarefasSemana={tarefasProximas.length}
        todayStart={todayStart}
        tarefas={tarefasProximas}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FunilCard stats={funilStats} />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <HotLeads leads={hotLeads} />
          <AtividadesRecentes atividades={atividadesRecentes} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeadsParados leads={paradosList} totalAtivos={totalAtivos} />
        <TarefasUpcoming tarefas={tarefasProximas} todayStart={todayStart} />
      </div>
    </div>
  );
}
