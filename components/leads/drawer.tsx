"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLeadDetailAction } from "@/app/(dashboard)/leads/actions";
import type { LeadDetail } from "@/lib/leads/queries";

// O conteúdo do drawer e seus formulários só são necessários após o clique
// num card. Carregados sob demanda via next/dynamic, eles saem do bundle
// inicial da página /leads. Enquanto o chunk carrega, mostramos o skeleton.
const DrawerBody = dynamic(
  () => import("./drawer-body").then((mod) => mod.DrawerBody),
  { loading: () => <DrawerSkeleton /> },
);

/**
 * Drawer do lead, controlado por estado de cliente (não por URL).
 *
 * Abrir/fechar é instantâneo — sem `router.push`, sem re-render de servidor.
 * O detalhe é buscado sob demanda via Server Action de leitura.
 *
 * `refreshTick`: o board incrementa esse contador sempre que os dados do
 * servidor são revalidados (qualquer formulário filho que chama
 * `router.refresh()`). Quando ele muda com o drawer aberto, o detalhe é
 * re-buscado — assim a timeline/tarefas continuam frescas sem refresh global.
 */
export function LeadDrawer({
  leadId,
  refreshTick = 0,
  onClose,
  onDeleted,
}: {
  leadId: string | null;
  refreshTick?: number;
  onClose: () => void;
  onDeleted: (leadId: string) => void;
}) {
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  // Último lead para o qual a busca terminou (sucesso, vazio ou erro).
  // Distingue "ainda carregando" de "carregou e não achou".
  const loadedLeadId = useRef<string | null>(null);

  useEffect(() => {
    if (!leadId) return;

    let cancelled = false;
    fetchLeadDetailAction(leadId)
      .then((d) => {
        if (cancelled) return;
        loadedLeadId.current = leadId;
        setDetail(d);
      })
      .catch(() => {
        if (cancelled) return;
        loadedLeadId.current = leadId;
        setDetail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [leadId, refreshTick]);

  const open = leadId !== null;
  const finished = open && loadedLeadId.current === leadId;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-[820px]">
        {!open ? null : !finished ? (
          <DrawerSkeleton />
        ) : detail ? (
          <DrawerBody key={detail.id} data={detail} onDeleted={onDeleted} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Lead não encontrado.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Esqueleto de carregamento do drawer — espelha a estrutura do `DrawerBody`
 * (cabeçalho com identidade, abas e as seções em card da Visão Geral) para a
 * troca para o conteúdo real ser suave, sem salto de layout. Usado tanto
 * enquanto o detalhe é buscado quanto enquanto o chunk do `DrawerBody` carrega.
 */
function DrawerSkeleton() {
  return (
    <>
      <SheetHeader className="gap-0 border-b border-foreground/10 px-6 pt-6 pb-5">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-36" />
        <div className="mt-3.5 flex gap-2">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </SheetHeader>

      <div className="flex gap-4 px-6 pt-4">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
