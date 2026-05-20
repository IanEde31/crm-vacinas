import type { CargoContato } from "@/lib/supabase/types";
import {
  fetchClinicasComContato,
  fetchContatos,
  fetchContatosStats,
  type ContatoFilters,
  type ContatoSortKey,
} from "@/lib/contatos/queries";
import { StatsGrid } from "@/components/contatos/stats-grid";
import { FiltersBar } from "@/components/contatos/filters-bar";
import { ViewToggle, type ViewMode } from "@/components/contatos/view-toggle";
import { ContatosGrid } from "@/components/contatos/contatos-grid";
import { ContatoTable } from "@/components/contatos/contato-table";
import { Pagination } from "@/components/contatos/pagination";
import { EmptyState } from "@/components/contatos/empty-state";

export const metadata = { title: "Contatos | 7Bee CRM" };
export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseFilters(searchParams: { [k: string]: string | string[] | undefined }): {
  filters: ContatoFilters;
  view: ViewMode;
} {
  const sortRaw = first(searchParams.sort);
  const sort: ContatoSortKey =
    sortRaw === "nome" || sortRaw === "recent" || sortRaw === "clinica"
      ? sortRaw
      : "decisor";

  const cargoRaw = first(searchParams.cargo);
  const cargo: CargoContato | undefined =
    cargoRaw === "socio" ||
    cargoRaw === "gestor" ||
    cargoRaw === "recepcao" ||
    cargoRaw === "medico" ||
    cargoRaw === "outro"
      ? cargoRaw
      : undefined;

  const pageRaw = first(searchParams.page);
  const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1;

  const viewRaw = first(searchParams.view);
  const view: ViewMode = viewRaw === "table" ? "table" : "cards";

  return {
    filters: {
      busca: first(searchParams.busca) || undefined,
      cargo,
      clinicaId: first(searchParams.clinicaId) || undefined,
      decisor: first(searchParams.decisor) === "1" ? true : undefined,
      comTarefa: first(searchParams.comTarefa) === "1" ? true : undefined,
      id: first(searchParams.id) || undefined,
      sort,
      page,
      perPage: view === "table" ? 30 : 24,
    },
    view,
  };
}

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const { filters, view } = parseFilters(searchParams);

  const [stats, clinicas, result] = await Promise.all([
    fetchContatosStats(),
    fetchClinicasComContato(),
    fetchContatos(filters),
  ]);

  const filtered = Boolean(
    filters.busca ||
      filters.cargo ||
      filters.clinicaId ||
      filters.decisor ||
      filters.comTarefa ||
      filters.id,
  );

  const highlightedId = filters.id;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            Tomadores de decisão e pessoas-chave nas clínicas mapeadas.
          </p>
        </div>
        <ViewToggle current={view} />
      </header>

      <StatsGrid stats={stats} />

      <FiltersBar clinicas={clinicas} />

      {result.rows.length === 0 ? (
        <EmptyState filtered={filtered} />
      ) : (
        <>
          {view === "cards" ? (
            <ContatosGrid rows={result.rows} highlightedId={highlightedId} />
          ) : (
            <ContatoTable rows={result.rows} highlightedId={highlightedId} />
          )}

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            perPage={result.perPage}
            total={result.total}
          />
        </>
      )}
    </div>
  );
}
