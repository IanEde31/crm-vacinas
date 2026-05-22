"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Phone,
  MessageCircle,
  MapPin,
  CalendarClock,
  Flame,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTAGIO_THEME } from "@/lib/estagios";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  if (score >= 70)
    return "bg-emerald-500 text-white ring-1 ring-emerald-600/20 dark:ring-emerald-400/20";
  if (score >= 40)
    return "bg-amber-500 text-white ring-1 ring-amber-600/20 dark:ring-amber-400/20";
  return "bg-muted text-muted-foreground ring-1 ring-foreground/10";
}

export function LeadCard({
  lead,
  dragging = false,
  onOpen,
  onDelete,
}: {
  lead: LeadKanban;
  dragging?: boolean;
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const theme = ESTAGIO_THEME[lead.estagio];
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
        "group relative shrink-0 cursor-grab touch-none overflow-hidden rounded-xl bg-card text-sm ring-1 ring-foreground/10 shadow-sm transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md hover:ring-foreground/20",
        isDragging && "opacity-30",
        dragging && "scale-[1.02] cursor-grabbing shadow-xl ring-foreground/20",
      )}
    >
      {/* Acento de estágio — assinatura discreta, visível inclusive no DragOverlay. */}
      <span
        aria-hidden
        className={cn("pointer-events-none absolute inset-y-0 left-0 w-[3px]", theme.bar)}
      />

      <div className="p-3.5 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold leading-snug tracking-tight">
              {lead.clinica_nome}
            </div>
            {localizacao && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
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
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-within:opacity-100">
                <QuickAtividadeButton leadId={lead.id} clinicaNome={lead.clinica_nome} />
                {onDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Mais ações"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-xs" }),
                        "text-muted-foreground",
                      )}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Excluir lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>

        {lead.proxima_acao && (
          <div
            className={cn(
              "mt-3 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug ring-1",
              proximaAtrasada
                ? "bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20"
                : "bg-muted/60 text-foreground/80 ring-foreground/5",
            )}
          >
            <CalendarClock className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2">{lead.proxima_acao}</span>
              {proximaData && (
                <span
                  className={cn(
                    "ml-1 tabular-nums",
                    proximaAtrasada ? "font-semibold" : "text-muted-foreground",
                  )}
                >
                  · {format(proximaData, "dd/MM", { locale: ptBR })}
                </span>
              )}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {lead.clinica_whatsapp && (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/15"
                title="WhatsApp disponível"
              >
                <MessageCircle className="h-3 w-3" />
              </span>
            )}
            {lead.clinica_telefone && !lead.clinica_whatsapp && (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-700 ring-1 ring-sky-600/10 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/15"
                title={lead.clinica_telefone}
              >
                <Phone className="h-3 w-3" />
              </span>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
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
