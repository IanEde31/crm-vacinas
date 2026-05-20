"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Trash2, Calendar, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleTarefaConcluida } from "@/app/(dashboard)/leads/actions";
import { deleteTarefa } from "@/app/(dashboard)/tarefas/actions";
import { PriorityBadge } from "./priority-badge";
import type { TarefaItem } from "@/lib/tarefas/queries";

export function TarefaRow({ tarefa }: { tarefa: TarefaItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState(false);

  const prazo = tarefa.prazo ? new Date(tarefa.prazo) : null;
  const overdue = prazo && !tarefa.concluida && isPast(prazo) && !isToday(prazo);
  const today = prazo && isToday(prazo) && !tarefa.concluida;

  async function onToggle(checked: boolean) {
    startTransition(async () => {
      const res = await toggleTarefaConcluida(tarefa.id, checked);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function onDelete() {
    if (!window.confirm("Remover esta tarefa?")) return;
    setRemoving(true);
    const res = await deleteTarefa(tarefa.id);
    setRemoving(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Tarefa removida");
    router.refresh();
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
        tarefa.concluida && "opacity-60",
        overdue && !tarefa.concluida && "border-rose-500/30",
      )}
    >
      <Checkbox
        className="mt-0.5"
        checked={tarefa.concluida}
        disabled={pending || removing}
        onCheckedChange={(v) => onToggle(v === true)}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm font-medium leading-snug",
              tarefa.concluida && "line-through",
            )}
          >
            {tarefa.titulo}
          </h4>
          <PriorityBadge prioridade={tarefa.prioridade} compact />
        </div>

        {tarefa.descricao && (
          <p className="mt-1 text-xs text-muted-foreground">{tarefa.descricao}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {tarefa.lead ? (
            <Link
              href={`/leads?lead=${tarefa.lead.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300"
              title="Abrir lead"
            >
              <Building2 className="h-3 w-3" />
              {tarefa.lead.clinica_nome ?? "(sem clínica)"}
            </Link>
          ) : tarefa.contato ? (
            <Link
              href={`/contatos?id=${tarefa.contato.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-violet-700 transition-colors hover:bg-violet-500/15 dark:text-violet-300"
              title={`${tarefa.contato.cargo ? tarefa.contato.cargo + " · " : ""}${tarefa.contato.clinica_nome ?? ""}`}
            >
              <User className="h-3 w-3" />
              {tarefa.contato.nome ?? "(sem nome)"}
              {tarefa.contato.clinica_nome && (
                <span className="text-muted-foreground">
                  · {tarefa.contato.clinica_nome}
                </span>
              )}
            </Link>
          ) : tarefa.clinica ? (
            <Link
              href={`/clinicas?busca=${encodeURIComponent(tarefa.clinica.nome)}`}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
              title="Ver clínica"
            >
              <Building2 className="h-3 w-3" />
              {tarefa.clinica.nome}
            </Link>
          ) : null}
          {prazo && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue
                  ? "font-medium text-rose-600 dark:text-rose-400"
                  : today
                    ? "font-medium text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground",
              )}
              title={format(prazo, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            >
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(prazo, { addSuffix: true, locale: ptBR })}
              {overdue && " · vencida"}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onDelete}
        disabled={removing || pending}
        className="opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Remover tarefa"
        title="Remover"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
