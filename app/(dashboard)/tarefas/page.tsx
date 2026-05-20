import type { PrioridadeTarefa } from "@/lib/supabase/types";
import {
  fetchTarefas,
  fetchTarefasStats,
  groupByBuckets,
  type TarefaFilters,
  type TarefaScope,
  type TarefaStatus,
} from "@/lib/tarefas/queries";
import { StatsGrid } from "@/components/tarefas/stats-grid";
import { FiltersBar } from "@/components/tarefas/filters-bar";
import { NewTarefaButton } from "@/components/tarefas/new-tarefa-button";
import { TarefasBoard } from "@/components/tarefas/tarefas-board";
import { EmptyState } from "@/components/tarefas/empty-state";

export const metadata = { title: "Tarefas | 7Bee CRM" };
export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseFilters(searchParams: { [k: string]: string | string[] | undefined }): TarefaFilters {
  const statusRaw = first(searchParams.status);
  const status: TarefaStatus =
    statusRaw === "concluidas" || statusRaw === "todas" ? statusRaw : "pendentes";

  const scopeRaw = first(searchParams.scope);
  const scope: TarefaScope = scopeRaw === "minhas" ? "minhas" : "todas";

  const prioridadeRaw = first(searchParams.prioridade);
  const prioridade: PrioridadeTarefa | undefined =
    prioridadeRaw === "baixa" || prioridadeRaw === "media" || prioridadeRaw === "alta"
      ? prioridadeRaw
      : undefined;

  return {
    busca: first(searchParams.busca) || undefined,
    status,
    scope,
    prioridade,
  };
}

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const filters = parseFilters(searchParams);

  const [stats, result] = await Promise.all([
    fetchTarefasStats(),
    fetchTarefas(filters),
  ]);

  const buckets = groupByBuckets(result.tarefas);

  const filtered = Boolean(
    filters.busca ||
      filters.prioridade ||
      filters.status !== "pendentes" ||
      filters.scope !== "todas",
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Follow-ups e ações pendentes — agrupados por prazo.
          </p>
        </div>
        <NewTarefaButton />
      </header>

      <StatsGrid stats={stats} />

      <FiltersBar />

      {buckets.length === 0 ? (
        <EmptyState filtered={filtered} />
      ) : (
        <TarefasBoard buckets={buckets} />
      )}
    </div>
  );
}
