import Link from "next/link";
import { ChevronDown, AlertTriangle, Gauge, Trophy, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ESTAGIO_THEME } from "@/lib/estagios";
import type { FunilData } from "@/lib/dashboard/metrics";
import { cn, fmtCurrencyCompact } from "@/lib/utils";

export function FunilCard({ funil }: { funil: FunilData }) {
  const {
    stages,
    totalEntrada,
    ganhos,
    perdidos,
    nutricao,
    convGlobal,
    bottleneckId,
    velocidadeMediaDias,
  } = funil;

  const max = Math.max(1, totalEntrada);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
              <Filter className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base">Funil estratégico</CardTitle>
              <CardDescription>
                {totalEntrada} leads percorreram o pipeline — onde eles escapam
              </CardDescription>
            </div>
          </div>
          <div className="flex items-stretch gap-2">
            <SummaryStat
              icon={<Trophy className="h-3.5 w-3.5" />}
              label="Conversão global"
              value={`${convGlobal}%`}
              tone="emerald"
            />
            <SummaryStat
              icon={<Gauge className="h-3.5 w-3.5" />}
              label="Ciclo médio"
              value={
                velocidadeMediaDias != null
                  ? `${velocidadeMediaDias}d`
                  : "—"
              }
              tone="sky"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="space-y-1">
          {stages.map((s, i) => {
            const pct = (s.reached / max) * 100;
            const theme = ESTAGIO_THEME[s.id];
            const next = stages[i + 1];
            const isBottleneckEdge =
              next != null && next.id === bottleneckId;
            return (
              <div key={s.id}>
                <Link
                  href={`/leads?estagio=${s.id}`}
                  className="group block rounded-lg px-1.5 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          theme.dot,
                        )}
                      />
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 text-right">
                      <span className="font-heading text-base font-semibold tabular-nums">
                        {s.reached}
                      </span>
                      {s.atual > 0 && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {s.atual} aqui
                          {s.valor > 0 && ` · ${fmtCurrencyCompact(s.valor)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 h-6 overflow-hidden rounded-md bg-muted/60">
                    <div
                      className={cn(
                        "h-full rounded-md transition-all duration-500 group-hover:brightness-110",
                        theme.bar,
                      )}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </Link>

                {/* Conector de conversão entre etapas */}
                {next && (
                  <div className="flex items-center gap-2 py-0.5 pl-3.5">
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 shrink-0",
                        isBottleneckEdge
                          ? "text-rose-500"
                          : "text-muted-foreground/40",
                      )}
                    />
                    <span
                      className={cn(
                        "font-mono text-[10px] font-semibold tabular-nums",
                        isBottleneckEdge
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {next.convFromPrev != null
                        ? `${next.convFromPrev}% avançam`
                        : "—"}
                    </span>
                    {isBottleneckEdge && (
                      <span className="flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Gargalo
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Saídas do funil */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
          <ExitStat label="Ganhos" value={ganhos} tone="emerald" />
          <ExitStat label="Perdidos" value={perdidos} tone="rose" />
          <ExitStat label="Nutrição" value={nutricao} tone="slate" />
        </div>
      </CardContent>
    </Card>
  );
}

const SUMMARY_TONES = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  sky: "text-sky-600 dark:text-sky-400",
} as const;

function SummaryStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: keyof typeof SUMMARY_TONES;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-1.5 ring-1 ring-foreground/5">
      <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-heading text-lg font-semibold tabular-nums leading-none",
          SUMMARY_TONES[tone],
        )}
      >
        {value}
      </div>
    </div>
  );
}

const EXIT_TONES = {
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25",
  rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25",
  slate:
    "bg-muted text-muted-foreground ring-foreground/10",
} as const;

function ExitStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof EXIT_TONES;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 ring-1 ring-inset",
        EXIT_TONES[tone],
      )}
    >
      <span className="font-mono text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="font-heading text-lg font-semibold tabular-nums leading-none">
        {value}
      </span>
    </div>
  );
}
