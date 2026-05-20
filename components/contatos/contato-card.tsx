import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  Crown,
  Activity,
  CheckSquare,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContatoAvatar } from "./contato-avatar";
import { CargoBadge } from "./cargo-badge";
import { ContatoActions } from "./contato-actions";
import type { ContatoCard as ContatoCardType } from "@/lib/contatos/queries";

export function ContatoCardItem({
  contato,
  highlighted = false,
}: {
  contato: ContatoCardType;
  highlighted?: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        highlighted && "ring-2 ring-violet-500/40",
      )}
    >
      <header className="flex items-start gap-3">
        <ContatoAvatar name={contato.nome} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold leading-tight">
              {contato.nome ?? "(sem nome)"}
            </h3>
            {contato.is_decisor && (
              <span
                className="inline-flex h-4 items-center gap-0.5 rounded-full bg-violet-500/15 px-1 text-[9px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300"
                title="Tomador de decisão"
              >
                <Crown className="h-2.5 w-2.5" />
                Decisor
              </span>
            )}
          </div>
          <div className="mt-1">
            <CargoBadge cargo={contato.cargo} />
          </div>
        </div>
      </header>

      {contato.clinica && (
        <Link
          href={`/clinicas?busca=${encodeURIComponent(contato.clinica.nome)}`}
          className="group/clinic flex items-center justify-between rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="truncate font-medium">{contato.clinica.nome}</span>
              {(contato.clinica.cidade || contato.clinica.estado) && (
                <span className="ml-1 text-muted-foreground">
                  · {[contato.clinica.cidade, contato.clinica.estado]
                    .filter(Boolean)
                    .join("/")}
                </span>
              )}
            </span>
          </span>
          <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/clinic:opacity-100" />
        </Link>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        {contato.telefone && (
          <Row icon={Phone}>
            <a
              href={`tel:${contato.telefone.replace(/\D/g, "")}`}
              className="underline-offset-2 hover:underline"
            >
              {contato.telefone}
            </a>
          </Row>
        )}
        {contato.email && (
          <Row icon={Mail}>
            <a
              href={`mailto:${contato.email}`}
              className="truncate underline-offset-2 hover:underline"
            >
              {contato.email}
            </a>
          </Row>
        )}
        {contato.observacoes && (
          <p className="line-clamp-2 pt-1 text-[11px]">
            {contato.observacoes}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <div className="flex items-center gap-1.5 text-[11px]">
          {contato.clinica && contato.clinica.leadsAtivos > 0 && (
            <Link
              href={`/leads?busca=${encodeURIComponent(contato.clinica.nome)}`}
              className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300"
              title={`${contato.clinica.leadsAtivos} lead(s) ativo(s) na clínica`}
            >
              <Activity className="h-2.5 w-2.5" />
              {contato.clinica.leadsAtivos} lead
              {contato.clinica.leadsAtivos > 1 && "s"}
            </Link>
          )}
          {contato.tarefasPendentes > 0 && (
            <Link
              href={`/tarefas?busca=${encodeURIComponent(contato.nome ?? "")}`}
              className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-amber-700 transition-colors hover:bg-amber-500/15 dark:text-amber-300"
              title="Tarefas pendentes vinculadas"
            >
              <CheckSquare className="h-2.5 w-2.5" />
              {contato.tarefasPendentes} pendente
              {contato.tarefasPendentes > 1 && "s"}
            </Link>
          )}
        </div>
        <ContatoActions contato={contato} size="xs" />
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
