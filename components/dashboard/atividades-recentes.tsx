import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Mail,
  Users,
  StickyNote,
  ArrowRightLeft,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TIPO_ICON: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  ligacao: { icon: Phone, tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  whatsapp: { icon: MessageCircle, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  email: { icon: Mail, tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  reuniao: { icon: Users, tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  nota: { icon: StickyNote, tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  mudanca_estagio: { icon: ArrowRightLeft, tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300" },
};

const TIPO_LABEL: Record<string, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  reuniao: "Reunião",
  nota: "Nota",
  mudanca_estagio: "Mudança de estágio",
};

type Atividade = {
  id: string;
  tipo: string;
  titulo: string | null;
  realizada_em: string;
  resultado: string | null;
  lead_id: string | null;
  clinica_nome: string | null;
};

export function AtividadesRecentes({ atividades }: { atividades: Atividade[] }) {
  const items = atividades.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Atividade recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <ol className="relative space-y-3">
            {items.map((a, idx) => {
              const cfg = TIPO_ICON[a.tipo] ?? TIPO_ICON.nota;
              const Icon = cfg.icon;
              const isLast = idx === items.length - 1;
              return (
                <li key={a.id} className="relative flex gap-3">
                  {!isLast && (
                    <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-border" />
                  )}
                  <span
                    className={cn(
                      "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      cfg.tone,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium">
                        {TIPO_LABEL[a.tipo] ?? a.tipo}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(a.realizada_em), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.lead_id && a.clinica_nome ? (
                        <Link
                          href={`/leads?lead=${a.lead_id}`}
                          className="hover:text-foreground hover:underline"
                        >
                          {a.clinica_nome}
                        </Link>
                      ) : (
                        <span>{a.titulo ?? "—"}</span>
                      )}
                      {a.titulo && a.clinica_nome && (
                        <span className="text-muted-foreground/70"> · {a.titulo}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
