"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TarefaRow } from "./tarefa-row";
import type { BucketId, TarefaItem } from "@/lib/tarefas/queries";

const BUCKET_STYLES: Record<BucketId, { dot: string; text?: string }> = {
  vencidas: { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
  hoje: { dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  semana: { dot: "bg-indigo-500" },
  depois: { dot: "bg-slate-400" },
  sem_prazo: { dot: "bg-muted-foreground/50" },
  concluidas: { dot: "bg-emerald-500" },
};

export function TarefaBucket({
  id,
  label,
  tarefas,
  collapsedByDefault = false,
}: {
  id: BucketId;
  label: string;
  tarefas: TarefaItem[];
  collapsedByDefault?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  const style = BUCKET_STYLES[id];

  return (
    <section>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="mb-2 flex w-full items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className={cn("inline-flex h-2 w-2 rounded-full", style.dot)} />
        <span className={style.text}>{label}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {tarefas.length}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {tarefas.map((t) => (
            <TarefaRow key={t.id} tarefa={t} />
          ))}
        </div>
      )}
    </section>
  );
}
