import { CheckSquare } from "lucide-react";

export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CheckSquare className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium">
          {filtered ? "Nenhuma tarefa com esses filtros" : "Caixa vazia"}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {filtered
            ? "Ajuste os filtros ou limpe a busca para ver mais resultados."
            : "Quando você criar tarefas (aqui ou pelo drawer de um lead) elas aparecem nessa página, agrupadas por prazo."}
        </p>
      </div>
    </div>
  );
}
