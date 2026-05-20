import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, History, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Busca } from "@/lib/buscas/queries";

function StatusPill({ status }: { status: Busca["status"] }) {
  if (status === "concluida") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        Concluída
      </span>
    );
  }
  if (status === "falhou") {
    return (
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
        Falhou
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      Em andamento
    </span>
  );
}

export function HistoricoBuscas({ buscas }: { buscas: Busca[] }) {
  if (buscas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <History className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhuma busca ainda. Sua primeira varredura aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Buscas recentes</h3>
      </div>
      <ul className="divide-y">
        {buscas.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {b.cidade}, {b.estado}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(b.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
                <span aria-hidden>·</span>
                {b.quantidade} alvo
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {b.status === "concluida" && (
                <div className="hidden text-right text-xs sm:block">
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      b.novas > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground",
                    )}
                  >
                    +{b.novas}
                  </span>{" "}
                  <span className="text-muted-foreground">novas</span>
                </div>
              )}
              <StatusPill status={b.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
