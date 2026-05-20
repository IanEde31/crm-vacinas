import { CircleDashed, CircleDot, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTAGIOS } from "@/lib/estagios";
import type { StatusDerivado } from "@/lib/clinicas/queries";

const BASE = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

export function PipelineStatusBadge({ status }: { status: StatusDerivado }) {
  if (status.kind === "sem_prospeccao") {
    return (
      <span className={cn(BASE, "border border-dashed border-border text-muted-foreground")}>
        <CircleDashed className="h-3 w-3" />
        Sem prospecção
      </span>
    );
  }
  if (status.kind === "ativo") {
    const label = ESTAGIOS.find((e) => e.id === status.lead.estagio)?.label ?? status.lead.estagio;
    return (
      <span className={cn(BASE, "bg-blue-500/10 text-blue-700 dark:text-blue-300")}>
        <CircleDot className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (status.kind === "ganho") {
    return (
      <span className={cn(BASE, "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}>
        <CheckCircle2 className="h-3 w-3" />
        Ganho
      </span>
    );
  }
  if (status.kind === "perdido") {
    return (
      <span className={cn(BASE, "bg-rose-500/10 text-rose-700 dark:text-rose-300")}>
        <XCircle className="h-3 w-3" />
        Perdido
      </span>
    );
  }
  return (
    <span className={cn(BASE, "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
      <Clock className="h-3 w-3" />
      Nutrição
    </span>
  );
}
