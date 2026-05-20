"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { VisaoGeral } from "./visao-geral";
import { TimelineAtividades } from "./timeline-atividades";
import { ClienteOcultoForm } from "./cliente-oculto-form";
import { TarefasList } from "./tarefas-list";
import type { LeadDetail } from "@/lib/leads/queries";

export function LeadDrawer({ data }: { data: LeadDetail | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = Boolean(searchParams.get("lead"));

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lead");
    const query = params.toString();
    router.replace(`/leads${query ? `?${query}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-[820px]">
        {open && !data ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : data ? (
          <DrawerBody data={data} />
        ) : null}
      </SheetContent>
    </Sheet>
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
