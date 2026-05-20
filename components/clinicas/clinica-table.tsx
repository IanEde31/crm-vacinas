import { ClinicaAvatar } from "./clinica-avatar";
import { RatingDisplay } from "./rating-display";
import { PipelineStatusBadge } from "./pipeline-status-badge";
import { ClinicaActions } from "./clinica-actions";
import { Badge } from "@/components/ui/badge";
import { deriveStatus, type ClinicaCard } from "@/lib/clinicas/queries";

const PORTE_LABEL: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export function ClinicaTable({ rows }: { rows: ClinicaCard[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th className="pl-4">Clínica</Th>
              <Th>Localização</Th>
              <Th>Rating</Th>
              <Th>Porte</Th>
              <Th>Status</Th>
              <Th className="pr-4 text-right">Ações</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => {
              const status = deriveStatus(c.leads);
              return (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <Td className="py-2.5 pl-4">
                    <div className="flex items-center gap-2.5">
                      <ClinicaAvatar name={c.nome} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.nome}</div>
                        {c.telefone && (
                          <div className="text-[11px] text-muted-foreground">
                            {c.telefone}
                          </div>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-xs">
                      {c.cidade ?? "—"}
                      {c.estado && (
                        <span className="text-muted-foreground"> / {c.estado}</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <RatingDisplay
                      rating={c.rating}
                      count={c.total_reviews}
                      compact
                    />
                  </Td>
                  <Td>
                    {c.porte_estimado ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {PORTE_LABEL[c.porte_estimado] ?? c.porte_estimado}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>
                    <PipelineStatusBadge status={status} />
                  </Td>
                  <Td className="pr-4 text-right">
                    <div className="flex justify-end">
                      <ClinicaActions clinica={c} status={status} size="xs" />
                    </div>
                  </Td>
                </tr>
              );
            })}
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
