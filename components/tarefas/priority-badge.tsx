import { ArrowUp, Minus, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrioridadeTarefa } from "@/lib/supabase/types";

const ICONS = {
  alta: ArrowUp,
  media: Minus,
  baixa: ArrowDown,
} as const;

const STYLES: Record<PrioridadeTarefa, string> = {
  alta: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  media: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  baixa: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

const LABELS: Record<PrioridadeTarefa, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export function PriorityBadge({
  prioridade,
  compact = false,
}: {
  prioridade: PrioridadeTarefa;
  compact?: boolean;
}) {
  const Icon = ICONS[prioridade];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        STYLES[prioridade],
      )}
      title={`Prioridade ${LABELS[prioridade].toLowerCase()}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {!compact && LABELS[prioridade]}
    </span>
  );
}
