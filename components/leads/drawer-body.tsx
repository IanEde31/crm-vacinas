"use client";

import {
  Phone,
  MessageCircle,
  Flame,
  MapPin,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ESTAGIO_THEME, ESTAGIOS } from "@/lib/estagios";
import { VisaoGeral } from "./visao-geral";
import { TimelineAtividades } from "./timeline-atividades";
import { ClienteOcultoForm } from "./cliente-oculto-form";
import { ClienteOcultoDisparo } from "./cliente-oculto-disparo";
import { TarefasList } from "./tarefas-list";
import type { LeadDetail } from "@/lib/leads/queries";

function onlyDigits(s: string | null | undefined): string {
  return s ? s.replace(/\D/g, "") : "";
}

/**
 * Cor do chip de score, alinhada aos limiares do kanban:
 * ≥70 emerald (lead quente), ≥40 amber, <40 neutro.
 */
function scoreTone(score: number): string {
  if (score >= 70)
    return "bg-emerald-100 text-emerald-700 ring-emerald-300/60 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30";
  if (score >= 40)
    return "bg-amber-100 text-amber-700 ring-amber-300/60 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30";
  return "bg-muted text-muted-foreground ring-foreground/10";
}

/**
 * Conteúdo do drawer do lead. Vive em arquivo próprio para ser carregado via
 * `next/dynamic` — junto com os formulários pesados (timeline, cliente oculto,
 * tarefas, edição de clínica/contatos), ele só entra no bundle após o primeiro
 * clique num card, não no carregamento inicial da página /leads.
 */
export function DrawerBody({
  data,
  onDeleted,
}: {
  data: LeadDetail;
  onDeleted: (leadId: string) => void;
}) {
  const { clinica } = data;
  const whatsapp = onlyDigits(clinica?.whatsapp) || onlyDigits(clinica?.telefone);
  const tel = onlyDigits(clinica?.telefone);

  const tema = ESTAGIO_THEME[data.estagio];
  const estagioLabel =
    ESTAGIOS.find((e) => e.id === data.estagio)?.label ?? data.estagio;
  const local = [clinica?.cidade, clinica?.estado].filter(Boolean).join(" / ");

  return (
    <>
      <SheetHeader className="gap-0 border-b border-foreground/10 px-6 pt-6 pb-5">
        <SheetTitle className="font-heading pr-8 text-lg leading-tight font-semibold tracking-tight text-foreground">
          {clinica?.nome ?? "(sem clínica)"}
        </SheetTitle>
        <SheetDescription className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {local || "—"}
        </SheetDescription>

        {/* Identidade do lead: estágio + score, sutis e intencionais */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
              tema.soft,
              tema.text,
              tema.ring,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", tema.dot)} />
            {estagioLabel}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset",
              scoreTone(data.score),
            )}
          >
            {data.score >= 70 && <Flame className="h-3 w-3" />}
            <span className="opacity-70">Score</span>
            {data.score}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {whatsapp && (
            <Button
              size="sm"
              variant="outline"
              className="transition-all duration-200 ease-out"
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
              className="transition-all duration-200 ease-out"
              onClick={() => {
                window.location.href = `tel:${tel}`;
              }}
            >
              <Phone className="mr-1.5 h-3.5 w-3.5" /> Ligar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Mais ações"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "ml-auto transition-all duration-200 ease-out",
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleted(data.id)}
              >
                <Trash2 className="h-4 w-4" /> Excluir lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetHeader>

      <Tabs defaultValue="visao-geral" className="flex flex-1 flex-col overflow-hidden">
        <TabsList variant="line" className="mx-6 mt-4 w-full justify-start gap-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="atividades">
            Atividades
            <span className="ml-1 tabular-nums text-muted-foreground">
              {data.atividades.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cliente-oculto">Cliente Oculto</TabsTrigger>
          <TabsTrigger value="tarefas">
            Tarefas
            <span className="ml-1 tabular-nums text-muted-foreground">
              {data.tarefas.filter((t) => !t.concluida).length}
            </span>
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <TabsContent value="visao-geral">
            <VisaoGeral data={data} />
          </TabsContent>
          <TabsContent value="atividades">
            <TimelineAtividades data={data} />
          </TabsContent>
          <TabsContent value="cliente-oculto">
            {data.estagio === "cliente_oculto" && (
              <ClienteOcultoDisparo
                leadId={data.id}
                disparoEm={data.cliente_oculto?.disparo_em ?? null}
              />
            )}
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
