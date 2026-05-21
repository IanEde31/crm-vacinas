"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, MessageCircle, MapPin, CalendarClock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAtividadeButton } from "./quick-atividade-button";
import type { KanbanLead as LeadKanban } from "@/lib/leads/queries";

function diasParado(ultimaAtividadeIso: string): number {
  return Math.max(0, differenceInCalendarDays(new Date(), new Date(ultimaAtividadeIso)));
}

function staleStyle(dias: number) {
  if (dias >= 7) {
    return {
      chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
      tone: "rose" as const,
    };
  }
  if (dias >= 3) {
    return {
      chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      tone: "amber" as const,
    };
  }
  return {
    chip: "bg-muted text-muted-foreground",
    tone: "neutral" as const,
  };
}

function scoreStyle(score: number) {
  if (score >= 70) return "bg-emerald-500 text-white";
  if (score >= 40) return "bg-amber-500 text-white";
  return "bg-muted text-muted-foreground";
}

export function LeadCard({
  lead,
  dragging = false,
  onOpen,
}: {
  lead: LeadKanban;
  dragging?: boolean;
  onOpen?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const dias = diasParado(lead.ultima_atividade_em);
  const stale = staleStyle(dias);
  const localizacao = [lead.clinica_cidade, lead.clinica_estado].filter(Boolean).join(" / ");
  const proximaData = lead.proxima_acao_data ? new Date(lead.proxima_acao_data) : null;
  const proximaAtrasada = proximaData ? proximaData.getTime() < Date.now() : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className={cn(
        "group relative shrink-0 cursor-grab touch-none overflow-hidden rounded-lg bg-card text-sm ring-1 ring-foreground/10 shadow-sm transition",
        "hover:-translate-y-0.5 hover:shadow-md hover:ring-foreground/20",
        isDragging && "opacity-30",
        dragging && "rotate-1 cursor-grabbing shadow-xl ring-foreground/20",
      )}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium leading-tight">{lead.clinica_nome}</div>
            {localizacao && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{localizacao}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {lead.score > 0 && (
              <span
                className={cn(
                  "inline-flex h-6 min-w-[28px] items-center justify-center gap-0.5 rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
                  scoreStyle(lead.score),
                )}
                title={`Score ${lead.score}`}
              >
                {lead.score >= 70 && <Flame className="h-2.5 w-2.5" />}
                {lead.score}
              </span>
            )}
            {!dragging && (
              <QuickAtividadeButton leadId={lead.id} clinicaNome={lead.clinica_nome} />
            )}
          </div>
        </div>

        {lead.proxima_acao && (
          <div
            className={cn(
              "mt-2.5 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug",
              proximaAtrasada
                ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                : "bg-muted/60 text-foreground/80",
            )}
          >
            <CalendarClock className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2">{lead.proxima_acao}</span>
              {proximaData && (
                <span
                  className={cn(
                    "ml-1 tabular-nums",
                    proximaAtrasada ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  · {format(proximaData, "dd/MM", { locale: ptBR })}
                </span>
              )}
            </span>
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {lead.clinica_whatsapp && (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                title="WhatsApp disponível"
              >
                <MessageCircle className="h-3 w-3" />
              </span>
            )}
            {lead.clinica_telefone && !lead.clinica_whatsapp && (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                title={lead.clinica_telefone}
              >
                <Phone className="h-3 w-3" />
              </span>
            )}
          </div>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
              stale.chip,
            )}
            title={`Última atividade há ${dias}d`}
          >
            {dias === 0 ? "hoje" : `${dias}d`}
          </span>
        </div>
      </div>
    </div>
  );
}
