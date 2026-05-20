import Link from "next/link";
import { Flame, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ESTAGIOS } from "@/lib/estagios";
import type { EstagioLead } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

function fmtCurrencyCompact(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function scoreColor(s: number) {
  if (s >= 70) return "bg-emerald-500 text-white";
  if (s >= 40) return "bg-amber-500 text-white";
  return "bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
}

type Lead = {
  id: string;
  score: number;
  estagio: EstagioLead;
  valor_estimado: number;
  probabilidade: number;
  clinica_nome: string;
  clinica_local: string | null;
};

export function HotLeads({ leads }: { leads: Lead[] }) {
  const labelMap = Object.fromEntries(ESTAGIOS.map((e) => [e.id, e.label]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              Hot leads
            </CardTitle>
            <CardDescription>Top 5 por score</CardDescription>
          </div>
          <Link
            href="/leads?sort=score"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            ver todos
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum lead quente no momento.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {leads.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/leads?lead=${l.id}`}
                  className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                      scoreColor(l.score),
                    )}
                  >
                    {l.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.clinica_nome}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="truncate">{labelMap[l.estagio]}</span>
                      {l.clinica_local && (
                        <>
                          <span>·</span>
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="truncate">{l.clinica_local}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {l.valor_estimado > 0 && (
                      <div className="text-xs font-semibold tabular-nums">
                        {fmtCurrencyCompact(l.valor_estimado)}
                      </div>
                    )}
                    {l.probabilidade > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        {l.probabilidade}% prob
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
