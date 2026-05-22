import { Flame, AlarmClock, Layers, Inbox } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/board";
import { KanbanFilters } from "@/components/kanban/filters";
import { NovoLeadButton } from "@/components/leads/novo-lead-button";
import { cn } from "@/lib/utils";
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
  const autoOpenNovo =
    (Array.isArray(searchParams.novo) ? searchParams.novo[0] : searchParams.novo) === "1";

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Arraste os cards para mudar o estágio. Clique para abrir o lead.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Kpi
              icon={<Layers className="h-4 w-4" />}
              label="ativos"
              value={ativos.length}
              tone="muted"
            />
            <Kpi
              icon={<Flame className="h-4 w-4" />}
              label="hot"
              value={hot}
              tone={hot > 0 ? "amber" : "muted"}
            />
            <Kpi
              icon={<AlarmClock className="h-4 w-4" />}
              label="parados +7d"
              value={parados}
              tone={parados > 0 ? "rose" : "muted"}
            />
          </div>
          <NovoLeadButton autoOpen={autoOpenNovo} />
        </div>
      </div>

      <KanbanFilters cidades={cidades} />

      {leads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-foreground/15 bg-card/40 py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold tracking-tight">
                Nenhum lead encontrado
              </h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Ajuste os filtros acima ou importe novos leads para começar a
                prospecção.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <KanbanBoard initialLeads={leads} />
      )}
    </div>
  );
}

function Kpi({
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
  const active = value > 0 && tone !== "muted";
  const iconClass =
    tone === "amber" && active
      ? "text-amber-500"
      : tone === "rose" && active
        ? "text-rose-500"
        : "text-muted-foreground";
  const valueClass =
    tone === "amber" && active
      ? "text-amber-600 dark:text-amber-400"
      : tone === "rose" && active
        ? "text-rose-600 dark:text-rose-400"
        : "text-foreground";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl bg-card px-3 py-1.5 shadow-sm ring-1 ring-foreground/10 transition-colors duration-200 ease-out",
        active &&
          (tone === "amber"
            ? "ring-amber-500/20"
            : tone === "rose"
              ? "ring-rose-500/20"
              : ""),
      )}
    >
      <span className={iconClass}>{icon}</span>
      <span className={cn("text-base font-semibold leading-none tabular-nums", valueClass)}>
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
