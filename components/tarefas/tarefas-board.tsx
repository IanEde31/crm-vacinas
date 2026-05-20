import { TarefaBucket } from "./tarefa-bucket";
import type { BucketGroup } from "@/lib/tarefas/queries";

export function TarefasBoard({ buckets }: { buckets: BucketGroup[] }) {
  return (
    <div className="space-y-6">
      {buckets.map((b) => (
        <TarefaBucket
          key={b.id}
          id={b.id}
          label={b.label}
          tarefas={b.tarefas}
          collapsedByDefault={b.id === "concluidas"}
        />
      ))}
    </div>
  );
}
