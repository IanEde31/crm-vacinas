import Link from "next/link";
import {
  TrendingUp,
  CircleDollarSign,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
} from "lucide-react";
import { Sparkline } from "@/components/dashboard/charts";
import type { KpiData } from "@/lib/dashboard/metrics";
import { cn, fmtCurrency, fmtCurrencyCompact } from "@/lib/utils";

type Delta = KpiData["inflowDelta"];

export function KpiRow({ kpi }: { kpi: KpiData }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        href="/leads"
        accent="amber"
        icon={<CircleDollarSign className="h-4 w-4" />}
        label="Valor em pipeline"
        value={fmtCurrencyCompact(kpi.valorPipeline)}
        sub={`${fmtCurrency(kpi.mrrProjetado)} projetado (ponderado)`}
        delta={kpi.inflowDelta}
        deltaHint={`${kpi.inflow30d} leads novos em 30d`}
        spark={kpi.inflowSpark}
        sparkColor="#f59e0b"
      />
      <KpiCard
        href="/leads"
        accent="emerald"
        icon={<TrendingUp className="h-4 w-4" />}
        label="Receita fechada · 30d"
        value={fmtCurrencyCompact(kpi.receitaFechada30d)}
        sub={`${kpi.ganhos30d} ${kpi.ganhos30d === 1 ? "negócio ganho" : "negócios ganhos"}`}
        delta={kpi.receitaDelta}
        deltaHint="vs. 30 dias anteriores"
        spark={kpi.receitaSpark}
        sparkColor="#10b981"
      />
      <KpiCard
        href="/leads"
        accent="sky"
        icon={<Target className="h-4 w-4" />}
        label="Conversão · 30d"
        value={`${kpi.conversao30d}%`}
        sub={`${kpi.ganhos30d} ganhos · ${kpi.perdidos30d} perdidos`}
        delta={kpi.conversaoDelta}
        deltaHint="vs. 30 dias anteriores"
        spark={kpi.conversaoSpark}
        sparkColor="#0ea5e9"
      />
      <KpiCard
        href="/tarefas"
        accent="violet"
        icon={<Activity className="h-4 w-4" />}
        label="Ritmo operacional · 7d"
        value={`${kpi.atividades7d}`}
        sub="interações registradas"
        delta={kpi.atividadesDelta}
        deltaHint="vs. semana anterior"
        spark={kpi.atividadesSpark}
        sparkColor="#8b5cf6"
      />
    </div>
  );
}

const ACCENTS = {
  amber: {
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    glow: "from-amber-500/[0.07]",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    glow: "from-emerald-500/[0.07]",
  },
  sky: {
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    glow: "from-sky-500/[0.07]",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    glow: "from-violet-500/[0.07]",
  },
} as const;

function DeltaChip({ delta, hint }: { delta: Delta; hint: string }) {
  let body: React.ReactNode;
  if (delta == null) {
    body = (
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        novo
      </span>
    );
  } else if (delta.dir === "flat") {
    body = (
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
        estável
      </span>
    );
  } else {
    const up = delta.dir === "up";
    body = (
      <span
        className={cn(
          "flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums",
          up
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
        )}
      >
        {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
        {Math.abs(delta.pct)}%
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      {body}
      <span className="hidden text-[10px] text-muted-foreground sm:inline">
        {hint}
      </span>
    </div>
  );
}

function KpiCard({
  href,
  icon,
  label,
  value,
  sub,
  delta,
  deltaHint,
  spark,
  sparkColor,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  delta: Delta;
  deltaHint: string;
  spark: number[];
  sparkColor: string;
  accent: keyof typeof ACCENTS;
}) {
  const styles = ACCENTS[accent];
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent opacity-0 transition-opacity group-hover:opacity-100",
          styles.glow,
        )}
      />
      <div className="relative p-4 pb-0">
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              styles.icon,
            )}
          >
            {icon}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground" />
        </div>
        <div className="mt-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 font-heading text-[1.7rem] font-semibold leading-none tabular-nums tracking-tight">
          {value}
        </div>
        <div className="mt-1.5 truncate text-xs text-muted-foreground">{sub}</div>
        <div className="mt-2.5">
          <DeltaChip delta={delta} hint={deltaHint} />
        </div>
      </div>
      {/* Sparkline encostada na borda inferior */}
      <div className="mt-2 h-12">
        <Sparkline data={spark} color={sparkColor} />
      </div>
    </Link>
  );
}
