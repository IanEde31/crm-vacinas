import { Users, Crown, Mail, Phone, HelpCircle, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContatoStats } from "@/lib/contatos/queries";

export function StatsGrid({ stats }: { stats: ContatoStats }) {
  const pctDecisor =
    stats.total > 0 ? Math.round((stats.decisores / stats.total) * 100) : 0;
  const pctEmail =
    stats.total > 0 ? Math.round((stats.comEmail / stats.total) * 100) : 0;
  const pctTel =
    stats.total > 0 ? Math.round((stats.comTelefone / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total"
        value={stats.total.toLocaleString("pt-BR")}
        hint="contatos cadastrados"
        icon={Users}
        tone="neutral"
      />
      <StatCard
        label="Decisores"
        value={stats.decisores.toLocaleString("pt-BR")}
        hint={`${pctDecisor}% da base`}
        icon={Crown}
        tone="violet"
        emphasis={stats.decisores > 0}
      />
      <StatCard
        label="Com e-mail"
        value={stats.comEmail.toLocaleString("pt-BR")}
        hint={`${pctEmail}% alcançáveis`}
        icon={Mail}
        tone="indigo"
      />
      <StatCard
        label="Com telefone"
        value={stats.comTelefone.toLocaleString("pt-BR")}
        hint={`${pctTel}% alcançáveis`}
        icon={Phone}
        tone="emerald"
      />
      <StatCard
        label="Sem cargo"
        value={stats.semCargo.toLocaleString("pt-BR")}
        hint="descobrir é fácil-win"
        icon={HelpCircle}
        tone="dashed"
      />
      <StatCard
        label="Tarefas pendentes"
        value={stats.tarefasPendentes.toLocaleString("pt-BR")}
        hint="vinculadas a contatos"
        icon={CheckSquare}
        tone="amber"
      />
    </div>
  );
}

type Tone = "neutral" | "violet" | "indigo" | "emerald" | "amber" | "dashed";

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  dashed: "border border-dashed bg-background text-muted-foreground",
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm",
        emphasis && "ring-1 ring-violet-500/30",
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
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
