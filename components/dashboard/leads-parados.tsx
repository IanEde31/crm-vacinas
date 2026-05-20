import Link from "next/link";
import { AlertTriangle, MapPin } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  clinica_nome: string;
  clinica_cidade: string | null;
  ultima_atividade_em: string;
};

function severity(dias: number) {
  if (dias >= 30) return { dot: "bg-rose-500", chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" };
  if (dias >= 14) return { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" };
  return { dot: "bg-slate-400", chip: "bg-muted text-muted-foreground" };
}

export function LeadsParados({
  leads,
  totalAtivos,
}: {
  leads: Lead[];
  totalAtivos: number;
}) {
  const pct = totalAtivos > 0 ? Math.round((leads.length / totalAtivos) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  leads.length > 0 ? "text-rose-500" : "text-muted-foreground",
                )}
              />
              Leads parados há +7d
            </CardTitle>
            <CardDescription>
              {leads.length} de {totalAtivos} ativos
              {leads.length > 0 && (
                <span className="text-muted-foreground"> · {pct}% do pipeline</span>
              )}
            </CardDescription>
          </div>
          {leads.length > 5 && (
            <Link
              href="/leads?paradosDias=7"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              ver todos
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <div className="text-sm font-medium">Todo mundo ativo.</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Nenhum lead sem interação há mais de 7 dias.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {leads.slice(0, 6).map((l) => {
              const dias = differenceInCalendarDays(new Date(), new Date(l.ultima_atividade_em));
              const sev = severity(dias);
              return (
                <li key={l.id}>
                  <Link
                    href={`/leads?lead=${l.id}`}
                    className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", sev.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.clinica_nome}</div>
                      {l.clinica_cidade && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="truncate">{l.clinica_cidade}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                        sev.chip,
                      )}
                    >
                      {dias}d
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
