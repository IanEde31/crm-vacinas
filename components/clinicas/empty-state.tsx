import { Building2 } from "lucide-react";

export function EmptyState({
  filtered,
}: {
  filtered: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Building2 className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium">
          {filtered ? "Nenhuma clínica nesses filtros" : "Nenhuma clínica cadastrada ainda"}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {filtered
            ? "Ajuste os filtros ou limpe a busca para ver mais resultados."
            : "Importe via APIFY ou cadastre manualmente clínicas pra começar a prospecção."}
        </p>
      </div>
    </div>
  );
}
