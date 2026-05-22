"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, MessageCircle, Mail, Users, FileText, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AtividadeForm } from "./atividade-form";
import type { LeadDetail } from "@/lib/leads/queries";

const ICONS = {
  ligacao: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reuniao: Users,
  nota: FileText,
  mudanca_estagio: ArrowRightLeft,
} as const;

const TIPO_LABEL: Record<keyof typeof ICONS, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  reuniao: "Reunião",
  nota: "Nota",
  mudanca_estagio: "Mudança de estágio",
};

/** Cor de fundo/ícone do medalhão, por tipo de atividade — sutil, dark-aware. */
const TIPO_TONE: Record<keyof typeof ICONS, string> = {
  ligacao:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  whatsapp:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  email:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  reuniao:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  nota:
    "bg-muted text-muted-foreground",
  mudanca_estagio:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export function TimelineAtividades({ data }: { data: LeadDetail }) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
        <h3 className="font-heading mb-3 text-sm font-semibold tracking-tight">
          Nova atividade
        </h3>
        <AtividadeForm leadId={data.id} />
      </section>

      <section className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
        <h3 className="font-heading mb-4 text-sm font-semibold tracking-tight">
          Histórico
        </h3>
        {data.atividades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
        ) : (
          <ol className="space-y-5">
            {data.atividades.map((a, i) => {
              const Icon = ICONS[a.tipo] ?? FileText;
              const tone = TIPO_TONE[a.tipo] ?? TIPO_TONE.nota;
              const isLast = i === data.atividades.length - 1;
              return (
                <li key={a.id} className="relative flex gap-3.5">
                  {/* Linha vertical conectando os pontos */}
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-[15px] top-8 bottom-[-1.25rem] w-px bg-foreground/10"
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 ring-foreground/10",
                      tone,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {a.titulo || TIPO_LABEL[a.tipo] || a.tipo}
                      </span>
                      {a.resultado && (
                        <Badge variant="secondary" className="rounded-md text-[10px]">
                          {a.resultado}
                        </Badge>
                      )}
                    </div>
                    {a.descricao && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {a.descricao}
                      </p>
                    )}
                    <div className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                      {format(new Date(a.realizada_em), "dd MMM yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}{" "}
                      ·{" "}
                      {formatDistanceToNow(new Date(a.realizada_em), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                      {a.duracao_minutos ? ` · ${a.duracao_minutos} min` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
