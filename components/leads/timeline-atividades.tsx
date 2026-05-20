"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, MessageCircle, Mail, Users, FileText, ArrowRightLeft } from "lucide-react";
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

export function TimelineAtividades({ data }: { data: LeadDetail }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-medium">Nova atividade</h3>
        <AtividadeForm leadId={data.id} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium">Histórico</h3>
        {data.atividades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
        ) : (
          <ol className="space-y-3">
            {data.atividades.map((a) => {
              const Icon = ICONS[a.tipo] ?? FileText;
              return (
                <li key={a.id} className="flex gap-3 rounded-md border bg-background p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {a.titulo || TIPO_LABEL[a.tipo] || a.tipo}
                      </span>
                      {a.resultado && (
                        <Badge variant="secondary" className="text-[10px]">
                          {a.resultado}
                        </Badge>
                      )}
                    </div>
                    {a.descricao && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {a.descricao}
                      </p>
                    )}
                    <div className="mt-1.5 text-xs text-muted-foreground">
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
