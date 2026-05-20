import { AlertTriangle, CalendarCheck2, CalendarDays, CalendarClock, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TarefaStats } from "@/lib/tarefas/queries";

export function StatsGrid({ stats }: { stats: TarefaStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Pendentes"
        value={stats.totalPendentes}
        icon={CalendarCheck2}
        tone="neutral"
      />
      <StatCard
        label="Vencidas"
        value={stats.vencidas}
        icon={AlertTriangle}
        tone="rose"
        emphasis={stats.vencidas > 0}
      />
      <StatCard label="Hoje" value={stats.hoje} icon={CalendarClock} tone="blue" />
      <StatCard
        label="Esta semana"
        value={stats.estaSemana}
        icon={CalendarDays}
        tone="indigo"
      />
      <StatCard label="Sem prazo" value={stats.semPrazo} icon={CircleDashed} tone="dashed" />
      <StatCard
        label="Concluídas (7d)"
        value={stats.concluidasSemana}
        icon={CheckCircle2}
        tone="emerald"
      />
    </div>
  );
}

type Tone = "neutral" | "rose" | "blue" | "indigo" | "emerald" | "dashed";

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  dashed: "border border-dashed bg-background text-muted-foreground",
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  emphasis,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm",
        emphasis && "ring-1 ring-rose-500/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", TONE_BG[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {value.toLocaleString("pt-BR")}
      </div>
    </div>
  );
}
