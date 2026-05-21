import { Flame, AlarmClock, Layers } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/board";
import { KanbanFilters } from "@/components/kanban/filters";
import {
  fetchCidadesDistintas,
  fetchKanbanLeads,
  type KanbanFilters as KanbanFiltersType,
} from "@/lib/leads/queries";
import { differenceInCalendarDays } from "date-fns";

export const metadata = { title: "Pipeline | 7Bee CRM" };
export const dynamic = "force-dynamic";

function parseFilters(searchParams: { [k: string]: string | string[] | undefined }): KanbanFiltersType {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const num = (v: string | string[] | undefined) => {
    const s = first(v);
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return {
    busca: first(searchParams.busca) || undefined,
    cidade: first(searchParams.cidade) || undefined,
    minScore: num(searchParams.minScore),
    paradosDias: num(searchParams.paradosDias),
  };
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const filters = parseFilters(searchParams);

  const [leads, cidades] = await Promise.all([
    fetchKanbanLeads(filters),
    fetchCidadesDistintas(),
  ]);

  const ativos = leads.filter(
    (l) => l.estagio !== "ganho" && l.estagio !== "perdido" && l.estagio !== "nutricao",
  );
  const hot = ativos.filter((l) => l.score >= 70).length;
  const parados = ativos.filter(
    (l) => differenceInCalendarDays(new Date(), new Date(l.ultima_atividade_em)) >= 7,
  ).length;

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Arraste os cards para mudar o estágio. Clique para abrir o lead.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Stat icon={<Layers className="h-3.5 w-3.5" />} label="ativos" value={ativos.length} />
          <Stat
            icon={<Flame className="h-3.5 w-3.5 text-amber-500" />}
            label="hot"
            value={hot}
            tone={hot > 0 ? "amber" : "muted"}
          />
          <Stat
            icon={<AlarmClock className="h-3.5 w-3.5 text-rose-500" />}
            label="parados +7d"
            value={parados}
            tone={parados > 0 ? "rose" : "muted"}
          />
        </div>
      </div>

      <KanbanFilters cidades={cidades} />

      {leads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed py-16">
          <div className="text-center">
            <div className="text-sm font-medium">Nenhum lead encontrado</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste os filtros ou importe novos leads.
            </p>
          </div>
        </div>
      ) : (
        <KanbanBoard initialLeads={leads} />
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "muted" | "amber" | "rose";
}) {
  const valueClass =
    tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "rose"
        ? "text-rose-600 dark:text-rose-400"
        : "text-foreground";
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`font-semibold tabular-nums ${valueClass}`}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
