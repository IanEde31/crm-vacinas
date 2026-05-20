import Link from "next/link";
import {
  TrendingUp,
  CircleDollarSign,
  Target,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtCurrencyCompact(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

type Props = {
  mrrProjetado: number;
  mrrFechado30d: number;
  valorPipeline: number;
  totalAtivos: number;
  taxaConversao: number;
  ganhos: number;
  perdidos: number;
  atividadesSemana: number;
  tarefasSemana: number;
  todayStart: string;
  tarefas: { prazo: string | null }[];
};

export function KpiRow({
  mrrProjetado,
  mrrFechado30d,
  valorPipeline,
  totalAtivos,
  taxaConversao,
  ganhos,
  perdidos,
  atividadesSemana,
  tarefasSemana,
  todayStart,
  tarefas,
}: Props) {
  const tarefasHoje = tarefas.filter(
    (t) => t.prazo && new Date(t.prazo) >= new Date(todayStart) && isToday(new Date(t.prazo)),
  ).length;
  const tarefasVencidas = tarefas.filter(
    (t) => t.prazo && isPast(new Date(t.prazo)) && !isToday(new Date(t.prazo)),
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Kpi
        href="/leads"
        icon={<CircleDollarSign className="h-4 w-4" />}
        accent="amber"
        label="MRR projetado"
        value={fmtCurrency(mrrProjetado)}
        sub={
          <>
            <span className="font-medium text-foreground">{fmtCurrencyCompact(valorPipeline)}</span>{" "}
            em pipeline total
          </>
        }
      />
      <Kpi
        href="/leads"
        icon={<TrendingUp className="h-4 w-4" />}
        accent="emerald"
        label="Pipeline ativo"
        value={`${totalAtivos}`}
        sub={
          <>
            <span className="font-medium text-foreground">{fmtCurrencyCompact(mrrFechado30d)}</span>{" "}
            fechados em 30d
          </>
        }
      />
      <Kpi
        href="/leads"
        icon={<Target className="h-4 w-4" />}
        accent={taxaConversao >= 30 ? "emerald" : taxaConversao >= 15 ? "amber" : "rose"}
        label="Conversão 30d"
        value={`${taxaConversao}%`}
        sub={
          <>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{ganhos} ganhos</span>
            {" · "}
            <span className="text-muted-foreground">{perdidos} perdidos</span>
          </>
        }
        bar={taxaConversao}
      />
      <Kpi
        href="/tarefas"
        icon={<Activity className="h-4 w-4" />}
        accent={tarefasVencidas > 0 ? "rose" : "indigo"}
        label="Esta semana"
        value={`${atividadesSemana}`}
        sub={
          <>
            <span className="font-medium text-foreground">{tarefasSemana}</span> tarefas
            {tarefasVencidas > 0 && (
              <>
                {" · "}
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {tarefasVencidas} vencidas
                </span>
              </>
            )}
            {tarefasVencidas === 0 && tarefasHoje > 0 && (
              <>
                {" · "}
                <span className="text-muted-foreground">{tarefasHoje} hoje</span>
              </>
            )}
          </>
        }
      />
    </div>
  );
}

const ACCENTS = {
  amber: {
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    bar: "bg-rose-500",
  },
  indigo: {
    icon: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    bar: "bg-indigo-500",
  },
} as const;

function Kpi({
  href,
  icon,
  label,
  value,
  sub,
  accent,
  bar,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
  accent: keyof typeof ACCENTS;
  bar?: number;
}) {
  const styles = ACCENTS[accent];
  return (
    <Link
      href={href}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="relative h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="pt-1">
          <div className="flex items-start justify-between">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                styles.icon,
              )}
            >
              {icon}
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
          </div>
          <div className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 font-heading text-3xl font-semibold tabular-nums tracking-tight">
            {value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
          {typeof bar === "number" && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", styles.bar)}
                style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
