import { ContatoCardItem } from "./contato-card";
import type { ContatoCard } from "@/lib/contatos/queries";

export function ContatosGrid({
  rows,
  highlightedId,
}: {
  rows: ContatoCard[];
  highlightedId?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((c) => (
        <ContatoCardItem
          key={c.id}
          contato={c}
          highlighted={highlightedId === c.id}
        />
      ))}
    </div>
  );
}
