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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AreaTrend } from "@/components/dashboard/charts";
import type { RitmoData } from "@/lib/dashboard/metrics";
import { cn } from "@/lib/utils";

const TIPO: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }
> = {
  ligacao: { icon: Phone, label: "Ligação", tone: "text-sky-600 dark:text-sky-400" },
  whatsapp: {
    icon: MessageCircle,
    label: "WhatsApp",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  email: { icon: Mail, label: "E-mail", tone: "text-indigo-600 dark:text-indigo-400" },
  reuniao: {
    icon: Users,
    label: "Reunião",
    tone: "text-violet-600 dark:text-violet-400",
  },
  nota: {
    icon: StickyNote,
    label: "Nota",
    tone: "text-amber-600 dark:text-amber-400",
  },
  mudanca_estagio: {
    icon: ArrowRightLeft,
    label: "Estágio",
    tone: "text-muted-foreground",
  },
};

export type AtividadeRecente = {
  id: string;
  tipo: string;
  titulo: string | null;
  realizada_em: string;
  lead_id: string | null;
  clinica_nome: string | null;
};

export function RitmoPanel({
  ritmo,
  recentes,
}: {
  ritmo: RitmoData;
  recentes: AtividadeRecente[];
}) {
  const itens = recentes.slice(0, 5);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base">Ritmo de atividade</CardTitle>
              <CardDescription>Interações dos últimos 14 dias</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="font-heading text-2xl font-semibold tabular-nums leading-none">
              {ritmo.total14d}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {ritmo.mediaDia}/dia
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-3">
        {ritmo.total14d === 0 ? (
          <div className="flex h-[168px] items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Nenhuma atividade registrada nos últimos 14 dias.
          </div>
        ) : (
          <AreaTrend data={ritmo.serie} color="#8b5cf6" unit="atividades" />
        )}

        {/* Composição por tipo */}
        {ritmo.porTipo.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
            {ritmo.porTipo.map((t) => {
              const cfg = TIPO[t.tipo] ?? TIPO.nota;
              const Icon = cfg.icon;
              return (
                <span
                  key={t.tipo}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground"
                >
                  <Icon className={cn("h-3 w-3", cfg.tone)} />
                  {cfg.label}
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {t.count}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* Atividade recente */}
        <div className="mt-4 flex-1 border-t pt-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Últimos registros
          </div>
          {itens.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-0.5">
              {itens.map((a) => {
                const cfg = TIPO[a.tipo] ?? TIPO.nota;
                const Icon = cfg.icon;
                const body = (
                  <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className={cn("h-3 w-3", cfg.tone)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">
                        {a.clinica_nome ?? a.titulo ?? cfg.label}
                      </div>
                      {a.clinica_nome && a.titulo && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {a.titulo}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.realizada_em), {
                        locale: ptBR,
                        addSuffix: false,
                      })}
                    </span>
                  </div>
                );
                return (
                  <li key={a.id}>
                    {a.lead_id ? (
                      <Link href={`/leads?lead=${a.lead_id}`} className="block">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
