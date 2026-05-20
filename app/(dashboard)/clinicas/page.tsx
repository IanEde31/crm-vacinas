import type { PorteClinica } from "@/lib/supabase/types";
import {
  fetchClinicas,
  fetchClinicasStats,
  fetchEstadosDistintos,
  type ClinicaFilters,
  type ClinicaSortKey,
} from "@/lib/clinicas/queries";
import { StatsGrid } from "@/components/clinicas/stats-grid";
import { FiltersBar } from "@/components/clinicas/filters-bar";
import { ViewToggle, type ViewMode } from "@/components/clinicas/view-toggle";
import { ClinicasGrid } from "@/components/clinicas/clinicas-grid";
import { ClinicaTable } from "@/components/clinicas/clinica-table";
import { Pagination } from "@/components/clinicas/pagination";
import { EmptyState } from "@/components/clinicas/empty-state";

export const metadata = { title: "Clínicas | 7Bee CRM" };
export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseFilters(searchParams: { [k: string]: string | string[] | undefined }): {
  filters: ClinicaFilters;
  view: ViewMode;
} {
  const sortRaw = first(searchParams.sort);
  const sort: ClinicaSortKey =
    sortRaw === "reviews" || sortRaw === "recent" || sortRaw === "nome"
      ? sortRaw
      : "rating";

  const porteRaw = first(searchParams.porte);
  const porte: PorteClinica | undefined =
    porteRaw === "pequeno" || porteRaw === "medio" || porteRaw === "grande"
      ? porteRaw
      : undefined;

  const ratingRaw = first(searchParams.ratingMin);
  const ratingMin = ratingRaw ? Number(ratingRaw) : undefined;

  const pageRaw = first(searchParams.page);
  const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1;

  const viewRaw = first(searchParams.view);
  const view: ViewMode = viewRaw === "table" ? "table" : "cards";

  return {
    filters: {
      busca: first(searchParams.busca) || undefined,
      estado: first(searchParams.estado) || undefined,
      cidade: first(searchParams.cidade) || undefined,
      porte,
      ratingMin: Number.isFinite(ratingMin) && (ratingMin ?? 0) > 0 ? ratingMin : undefined,
      sort,
      page,
      perPage: view === "table" ? 30 : 24,
    },
    view,
  };
}

export default async function ClinicasPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const { filters, view } = parseFilters(searchParams);

  const [stats, estados, result] = await Promise.all([
    fetchClinicasStats(),
    fetchEstadosDistintos(),
    fetchClinicas(filters),
  ]);

  const filtered = Boolean(
    filters.busca || filters.estado || filters.cidade || filters.porte || filters.ratingMin,
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clínicas</h1>
          <p className="text-sm text-muted-foreground">
            Base de clínicas mapeadas — independente do estágio no pipeline.
          </p>
        </div>
        <ViewToggle current={view} />
      </header>

      <StatsGrid stats={stats} />

      <FiltersBar estados={estados} />

      {result.rows.length === 0 ? (
        <EmptyState filtered={filtered} />
      ) : (
        <>
          {view === "cards" ? (
            <ClinicasGrid rows={result.rows} />
          ) : (
            <ClinicaTable rows={result.rows} />
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
