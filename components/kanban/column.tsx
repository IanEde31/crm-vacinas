"use client";

import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTAGIO_THEME } from "@/lib/estagios";
import { LeadCard } from "./card";
import type { KanbanLead as LeadKanban } from "@/lib/leads/queries";
import type { EstagioLead } from "@/lib/supabase/types";

export function KanbanColumn({
  id,
  label,
  leads,
  onOpenLead,
  onDeleteLead,
}: {
  id: EstagioLead;
  label: string;
  leads: LeadKanban[];
  onOpenLead: (leadId: string) => void;
  onDeleteLead: (leadId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const theme = ESTAGIO_THEME[id];

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-muted/30 ring-1 ring-foreground/10">
      <div className={cn("h-1", theme.bar)} />
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", theme.dot)} />
          <span className="truncate text-xs font-semibold uppercase tracking-wide">
            {label}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
            theme.soft,
            theme.text,
          )}
        >
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "scrollbar-discreet flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2.5 transition-all duration-200 ease-out",
          isOver &&
            cn("ring-2 ring-inset", theme.ring, theme.soft, "shadow-inner"),
        )}
      >
        {leads.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 py-10 text-[11px] text-muted-foreground transition-all duration-200 ease-out",
              isOver && cn("border-transparent text-foreground/70", theme.text),
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-200 ease-out",
                isOver && cn(theme.soft, theme.text),
              )}
            >
              <Inbox className="h-4 w-4" />
            </span>
            <span className="font-medium">
              {isOver ? "Soltar aqui" : "Nenhum lead"}
            </span>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onOpen={() => onOpenLead(lead.id)}
              onDelete={() => onDeleteLead(lead.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
