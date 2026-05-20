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
}: {
  id: EstagioLead;
  label: string;
  leads: LeadKanban[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const theme = ESTAGIO_THEME[id];

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-muted/30 ring-1 ring-foreground/5">
      <div className={cn("h-1", theme.bar)} />
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", theme.dot)} />
          <span className="truncate text-xs font-semibold uppercase tracking-wider">
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
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 transition-all",
          isOver && cn("ring-2 ring-inset", theme.ring, "bg-background/50"),
        )}
      >
        {leads.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-8 text-[11px] text-muted-foreground transition-colors",
              isOver && "border-foreground/30 text-foreground/60",
            )}
          >
            <Inbox className="h-4 w-4 opacity-50" />
            <span>{isOver ? "Soltar aqui" : "Vazio"}</span>
          </div>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}
