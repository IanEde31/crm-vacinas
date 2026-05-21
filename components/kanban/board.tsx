"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ESTAGIOS } from "@/lib/estagios";
import type { EstagioLead } from "@/lib/supabase/types";
import type { KanbanLead as LeadKanban } from "@/lib/leads/queries";
import { KanbanColumn } from "./column";
import { LeadCard } from "./card";
import { LeadDrawer } from "@/components/leads/drawer";
import { updateLeadEstagio } from "@/app/(dashboard)/leads/actions";

export type { KanbanLead as LeadKanban } from "@/lib/leads/queries";

export function KanbanBoard({ initialLeads }: { initialLeads: LeadKanban[] }) {
  const [leads, setLeads] = useState<LeadKanban[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  // Incrementado a cada vez que o servidor entrega novos dados. Sinaliza ao
  // drawer aberto que ele deve re-buscar seu detalhe (mantém-o fresco sem
  // depender de um refresh global da página).
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setLeads(initialLeads);
    setRefreshTick((t) => t + 1);
  }, [initialLeads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const novoEstagio = String(over.id) as EstagioLead;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.estagio === novoEstagio) return;

    const previousEstagio = lead.estagio;

    // Update otimista: o card já está na coluna certa e o estado do cliente
    // bate com o banco. Não há `router.refresh()` aqui — ele forçaria um
    // refetch completo da página sem trazer nenhuma informação nova.
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, estagio: novoEstagio } : l)),
    );

    const res = await updateLeadEstagio({ leadId, novoEstagio });
    if ("error" in res) {
      toast.error(res.error);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, estagio: previousEstagio } : l)),
      );
    }
  }

  const leadsByEstagio = ESTAGIOS.reduce<Record<EstagioLead, LeadKanban[]>>(
    (acc, { id }) => {
      acc[id] = leads.filter((l) => l.estagio === id);
      return acc;
    },
    {} as Record<EstagioLead, LeadKanban[]>,
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 min-w-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2">
          {ESTAGIOS.map(({ id, label }) => (
            <KanbanColumn
              key={id}
              id={id}
              label={label}
              leads={leadsByEstagio[id]}
              onOpenLead={setSelectedLeadId}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <LeadDrawer
        leadId={selectedLeadId}
        refreshTick={refreshTick}
        onClose={() => setSelectedLeadId(null)}
      />
    </>
  );
}
