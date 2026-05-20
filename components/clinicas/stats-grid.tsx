import {
  Building2,
  MapPin,
  Star,
  Activity,
  CircleDashed,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClinicaStats } from "@/lib/clinicas/queries";

export function StatsGrid({ stats }: { stats: ClinicaStats }) {
  const pctSemProspeccao =
    stats.total > 0 ? Math.round((stats.semProspeccao / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total"
        value={stats.total.toLocaleString("pt-BR")}
        hint="clínicas na base"
        icon={Building2}
        tone="neutral"
      />
      <StatCard
        label="Cobertura"
        value={`${stats.cidades}`}
        hint={`${stats.estados} estados`}
        icon={MapPin}
        tone="neutral"
      />
      <StatCard
        label="Rating médio"
        value={stats.ratingMedio !== null ? stats.ratingMedio.toFixed(1) : "—"}
        hint="dentre as com avaliação"
        icon={Star}
        tone="amber"
      />
      <StatCard
        label="Com lead ativo"
        value={stats.comLeadAtivo.toLocaleString("pt-BR")}
        hint={
          stats.total > 0
            ? `${Math.round((stats.comLeadAtivo / stats.total) * 100)}% da base`
            : ""
        }
        icon={Activity}
        tone="blue"
      />
      <StatCard
        label="Sem prospecção"
        value={stats.semProspeccao.toLocaleString("pt-BR")}
        hint={`${pctSemProspeccao}% • potencial inexplorado`}
        icon={CircleDashed}
        tone="dashed"
      />
      <StatCard
        label="Conquistadas"
        value={stats.ganhos.toLocaleString("pt-BR")}
        hint="ao menos um lead 'ganho'"
        icon={Trophy}
        tone="emerald"
      />
    </div>
  );
}

type Tone = "neutral" | "amber" | "blue" | "emerald" | "dashed";

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  dashed: "border border-dashed bg-background text-muted-foreground",
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
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
