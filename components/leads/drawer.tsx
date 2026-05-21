"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VisaoGeral } from "./visao-geral";
import { TimelineAtividades } from "./timeline-atividades";
import { ClienteOcultoForm } from "./cliente-oculto-form";
import { TarefasList } from "./tarefas-list";
import { fetchLeadDetailAction } from "@/app/(dashboard)/leads/actions";
import type { LeadDetail } from "@/lib/leads/queries";

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
}: {
  leadId: string | null;
  refreshTick?: number;
  onClose: () => void;
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
          <DrawerBody key={detail.id} data={detail} />
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
 * (cabeçalho, abas e as seções da Visão Geral) para a troca para o conteúdo
 * real ser suave, sem salto de layout.
 */
function DrawerSkeleton() {
  return (
    <>
      <SheetHeader className="border-b">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-36" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </SheetHeader>

      <div className="flex gap-2 px-4 pt-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-20" />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="space-y-2 rounded-lg border p-3">
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

function onlyDigits(s: string | null | undefined): string {
  return s ? s.replace(/\D/g, "") : "";
}

function DrawerBody({ data }: { data: LeadDetail }) {
  const { clinica } = data;
  const whatsapp = onlyDigits(clinica?.whatsapp) || onlyDigits(clinica?.telefone);
  const tel = onlyDigits(clinica?.telefone);

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="text-base">{clinica?.nome ?? "(sem clínica)"}</SheetTitle>
        <SheetDescription>
          {[clinica?.cidade, clinica?.estado].filter(Boolean).join(" / ") || "—"}
        </SheetDescription>
        <div className="mt-3 flex gap-2">
          {whatsapp && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener,noreferrer")
              }
            >
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
            </Button>
          )}
          {tel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.location.href = `tel:${tel}`;
              }}
            >
              <Phone className="mr-1.5 h-3.5 w-3.5" /> Ligar
            </Button>
          )}
        </div>
      </SheetHeader>

      <Tabs defaultValue="visao-geral" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 w-fit">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="atividades">
            Atividades ({data.atividades.length})
          </TabsTrigger>
          <TabsTrigger value="cliente-oculto">Cliente Oculto</TabsTrigger>
          <TabsTrigger value="tarefas">
            Tarefas ({data.tarefas.filter((t) => !t.concluida).length})
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="visao-geral">
            <VisaoGeral data={data} />
          </TabsContent>
          <TabsContent value="atividades">
            <TimelineAtividades data={data} />
          </TabsContent>
          <TabsContent value="cliente-oculto">
            <ClienteOcultoForm leadId={data.id} existing={data.cliente_oculto} />
          </TabsContent>
          <TabsContent value="tarefas">
            <TarefasList data={data} />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
