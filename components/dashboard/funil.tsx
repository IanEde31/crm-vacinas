import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Cor por agrupamento de estágio para reforçar progressão do funil.
const COR_ESTAGIO: Record<EstagioLead, string> = {
  lead_bruto: "bg-slate-400/80",
  qualificado: "bg-sky-400/80",
  cliente_oculto: "bg-sky-500/85",
  primeiro_contato: "bg-indigo-500/85",
  conversa_iniciada: "bg-indigo-600/85",
  diagnostico_agendado: "bg-violet-500/85",
  proposta_enviada: "bg-amber-500/90",
  negociacao: "bg-amber-600/90",
  ganho: "bg-emerald-500",
  perdido: "bg-rose-400/80",
  nutricao: "bg-zinc-400/80",
};

const DOT_ESTAGIO: Record<EstagioLead, string> = {
  lead_bruto: "bg-slate-400",
  qualificado: "bg-sky-400",
  cliente_oculto: "bg-sky-500",
  primeiro_contato: "bg-indigo-500",
  conversa_iniciada: "bg-indigo-600",
  diagnostico_agendado: "bg-violet-500",
  proposta_enviada: "bg-amber-500",
  negociacao: "bg-amber-600",
  ganho: "bg-emerald-500",
  perdido: "bg-rose-400",
  nutricao: "bg-zinc-400",
};

type Stat = { id: EstagioLead; label: string; count: number; valor: number };

export function FunilCard({ stats }: { stats: Stat[] }) {
  const ativos = stats.filter(
    (s) => s.id !== "ganho" && s.id !== "perdido" && s.id !== "nutricao",
  );
  const fechados = stats.filter(
    (s) => s.id === "ganho" || s.id === "perdido" || s.id === "nutricao",
  );

  const maxAtivos = Math.max(1, ...ativos.map((s) => s.count));
  const totalAtivos = ativos.reduce((s, c) => s + c.count, 0);
  const valorAtivos = ativos.reduce((s, c) => s + c.valor, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-end justify-between gap-4">
          <div>
            <CardTitle>Funil de conversão</CardTitle>
            <CardDescription>
              {totalAtivos} leads ativos · {fmtCurrencyCompact(valorAtivos)} potenciais
            </CardDescription>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {fechados.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", DOT_ESTAGIO[f.id])} />
                <span className="capitalize">{f.label.replace("Fechado-", "")}</span>
                <span className="font-medium tabular-nums text-foreground">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {ativos.map((s) => {
            const pct = maxAtivos > 0 ? (s.count / maxAtivos) * 100 : 0;
            const sharePct = totalAtivos > 0 ? Math.round((s.count / totalAtivos) * 100) : 0;
            return (
              <li key={s.id}>
                <Link
                  href={`/leads?estagio=${s.id}`}
                  className="group flex items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted/60"
                >
                  <div className="flex w-44 shrink-0 items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT_ESTAGIO[s.id])} />
                    <span className="truncate text-sm">{s.label}</span>
                  </div>
                  <div className="relative flex-1">
                    <div className="h-7 overflow-hidden rounded-md bg-muted/60">
                      <div
                        className={cn(
                          "h-full rounded-md transition-all group-hover:brightness-110",
                          COR_ESTAGIO[s.id],
                        )}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                    {s.count > 0 && (
                      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs font-medium text-white mix-blend-luminosity">
                        {sharePct}%
                      </span>
                    )}
                  </div>
                  <div className="flex w-24 shrink-0 flex-col items-end leading-tight">
                    <span className="text-sm font-semibold tabular-nums">{s.count}</span>
                    {s.valor > 0 && (
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {fmtCurrencyCompact(s.valor)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
