"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TarefaForm } from "./tarefa-form";
import { toggleTarefaConcluida } from "@/app/(dashboard)/leads/actions";
import type { LeadDetail } from "@/lib/leads/queries";

export function TarefasList({ data }: { data: LeadDetail }) {
  const router = useRouter();

  async function onToggle(id: string, concluida: boolean) {
    const res = await toggleTarefaConcluida(id, concluida);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-medium">Nova tarefa</h3>
        <TarefaForm leadId={data.id} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium">
          Tarefas ({data.tarefas.filter((t) => !t.concluida).length} pendentes)
        </h3>
        {data.tarefas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>
        ) : (
          <ul className="space-y-2">
            {data.tarefas.map((t) => {
              const prazo = t.prazo ? new Date(t.prazo) : null;
              const overdue = prazo && !t.concluida && isPast(prazo) && !isToday(prazo);
              return (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border bg-background p-3",
                    t.concluida && "opacity-60",
                  )}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={t.concluida}
                    onCheckedChange={(v) => onToggle(t.id, v === true)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          t.concluida && "line-through",
                        )}
                      >
                        {t.titulo}
                      </span>
                      <Badge
                        variant={
                          t.prioridade === "alta"
                            ? "destructive"
                            : t.prioridade === "media"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {t.prioridade}
                      </Badge>
                    </div>
                    {t.descricao && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{t.descricao}</p>
                    )}
                    {prazo && (
                      <div
                        className={cn(
                          "mt-1 text-xs",
                          overdue ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        Prazo:{" "}
                        {format(prazo, "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        {overdue && " · vencida"}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
