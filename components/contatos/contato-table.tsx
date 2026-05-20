import Link from "next/link";
import { Crown, Activity, CheckSquare, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContatoAvatar } from "./contato-avatar";
import { CargoBadge } from "./cargo-badge";
import { ContatoActions } from "./contato-actions";
import type { ContatoCard } from "@/lib/contatos/queries";

export function ContatoTable({
  rows,
  highlightedId,
}: {
  rows: ContatoCard[];
  highlightedId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th className="pl-4">Contato</Th>
              <Th>Cargo</Th>
              <Th>Clínica</Th>
              <Th>Sinal</Th>
              <Th className="pr-4 text-right">Ações</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr
                key={c.id}
                className={cn(
                  "transition-colors hover:bg-muted/30",
                  highlightedId === c.id && "bg-violet-500/5",
                )}
              >
                <Td className="py-2.5 pl-4">
                  <div className="flex items-center gap-2.5">
                    <ContatoAvatar name={c.nome} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">
                          {c.nome ?? "(sem nome)"}
                        </span>
                        {c.is_decisor && (
                          <Crown className="h-3 w-3 text-violet-500" />
                        )}
                      </div>
                      <div className="flex flex-col text-[11px] text-muted-foreground">
                        {c.email && <span className="truncate">{c.email}</span>}
                        {c.telefone && <span>{c.telefone}</span>}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <CargoBadge cargo={c.cargo} />
                </Td>
                <Td>
                  {c.clinica ? (
                    <Link
                      href={`/clinicas?busca=${encodeURIComponent(c.clinica.nome)}`}
                      className="inline-flex items-center gap-1 text-xs hover:text-foreground hover:underline"
                    >
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{c.clinica.nome}</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {c.clinica && c.clinica.leadsAtivos > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-blue-700 dark:text-blue-300"
                        title="Leads ativos na clínica"
                      >
                        <Activity className="h-2.5 w-2.5" />
                        {c.clinica.leadsAtivos}
                      </span>
                    )}
                    {c.tarefasPendentes > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-amber-700 dark:text-amber-300"
                        title="Tarefas pendentes"
                      >
                        <CheckSquare className="h-2.5 w-2.5" />
                        {c.tarefasPendentes}
                      </span>
                    )}
                  </div>
                </Td>
                <Td className="pr-4 text-right">
                  <div className="flex justify-end">
                    <ContatoActions contato={c} size="xs" />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
