import Link from "next/link";
import { MapPin, Phone, FileText, Globe, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClinicaAvatar } from "./clinica-avatar";
import { RatingDisplay } from "./rating-display";
import { PipelineStatusBadge } from "./pipeline-status-badge";
import { ClinicaActions } from "./clinica-actions";
import { deriveStatus, type ClinicaCard as ClinicaCardType } from "@/lib/clinicas/queries";

const PORTE_LABEL: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export function ClinicaCardItem({ clinica }: { clinica: ClinicaCardType }) {
  const status = deriveStatus(clinica.leads);
  const localizacao = [clinica.cidade, clinica.estado].filter(Boolean).join(" / ");

  return (
    <article className="group relative flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <header className="flex items-start gap-3">
        <ClinicaAvatar name={clinica.nome} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-tight">
            {clinica.nome}
          </h3>
          <div className="mt-1.5">
            <RatingDisplay rating={clinica.rating} count={clinica.total_reviews} />
          </div>
        </div>
        {clinica.porte_estimado && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {PORTE_LABEL[clinica.porte_estimado] ?? clinica.porte_estimado}
          </Badge>
        )}
      </header>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {localizacao && (
          <Row icon={MapPin}>
            {clinica.endereco ? (
              <>
                <span className="line-clamp-1">{clinica.endereco}</span>
                <span className="mt-0.5 block text-[11px]">{localizacao}</span>
              </>
            ) : (
              localizacao
            )}
          </Row>
        )}
        {clinica.telefone && <Row icon={Phone}>{clinica.telefone}</Row>}
        {clinica.cnpj && (
          <Row icon={FileText}>
            <span className="font-mono text-[11px]">{clinica.cnpj}</span>
          </Row>
        )}
        {clinica.website && (
          <Row icon={Globe}>
            <a
              href={clinica.website.startsWith("http") ? clinica.website : `https://${clinica.website}`}
              target="_blank"
              rel="noreferrer"
              className="truncate underline-offset-2 hover:underline"
            >
              {clinica.website.replace(/^https?:\/\//, "")}
            </a>
          </Row>
        )}
      </div>

      {clinica.decisor && (
        <Link
          href={`/contatos?id=${clinica.decisor.id}`}
          className="group/dec inline-flex items-center gap-1.5 self-start rounded-md bg-violet-500/10 px-2 py-1 text-[11px] text-violet-700 transition-colors hover:bg-violet-500/15 dark:text-violet-300"
          title="Abrir contato"
        >
          <Crown className="h-3 w-3" />
          <span className="font-medium">{clinica.decisor.nome ?? "(decisor)"}</span>
          {clinica.decisor.cargo && (
            <span className="text-muted-foreground">· {clinica.decisor.cargo}</span>
          )}
        </Link>
      )}

      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <PipelineStatusBadge status={status} />
        <ClinicaActions clinica={clinica} status={status} size="xs" />
      </div>
    </article>
  );
}

function Row({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 h-3 w-3 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
