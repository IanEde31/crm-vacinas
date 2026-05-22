import Link from "next/link";
import { CheckSquare, AlarmClock, CalendarClock, CalendarRange } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tarefa = {
  id: string;
  titulo: string;
  prazo: string | null;
  prioridade: "baixa" | "media" | "alta";
  lead_id: string | null;
  clinica_nome: string | null;
};

const PRIO_DOT: Record<string, string> = {
  alta: "bg-rose-500",
  media: "bg-amber-500",
  baixa: "bg-slate-400",
};

function TarefaItem({ t }: { t: Tarefa }) {
  const prazo = t.prazo ? new Date(t.prazo) : null;
  const overdue = prazo && isPast(prazo) && !isToday(prazo);
  return (
    <li className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIO_DOT[t.prioridade])} />
      <div className="min-w-0 flex-1">
        {t.lead_id ? (
          <Link
            href={`/leads?lead=${t.lead_id}`}
            className="block truncate text-sm hover:underline"
          >
            {t.titulo}
          </Link>
        ) : (
          <span className="block truncate text-sm">{t.titulo}</span>
        )}
        {t.clinica_nome && (
          <span className="block truncate text-[11px] text-muted-foreground">
            {t.clinica_nome}
          </span>
        )}
      </div>
      {prazo && (
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
            overdue
              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
              : isToday(prazo)
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                : "bg-muted text-muted-foreground",
          )}
        >
          {format(prazo, "dd/MM", { locale: ptBR })}
        </span>
      )}
    </li>
  );
}

export function TarefasUpcoming({
  tarefas,
  todayStart,
}: {
  tarefas: Tarefa[];
  todayStart: string;
}) {
  const vencidas = tarefas.filter(
    (t) => t.prazo && isPast(new Date(t.prazo)) && !isToday(new Date(t.prazo)),
  );
  const hoje = tarefas.filter(
    (t) => t.prazo && new Date(t.prazo) >= new Date(todayStart) && isToday(new Date(t.prazo)),
  );
  const semana = tarefas.filter(
    (t) => t.prazo && !isToday(new Date(t.prazo)) && !isPast(new Date(t.prazo)),
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
              <CheckSquare className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Tarefas da semana</CardTitle>
              <CardDescription>
                {tarefas.length} no total · {hoje.length} hoje
                {vencidas.length > 0 && (
                  <>
                    {" · "}
                    <span className="text-rose-600 dark:text-rose-400">
                      {vencidas.length} vencidas
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <Link
            href="/tarefas"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            abrir todas
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {tarefas.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Você está em dia. Nada pendente até o fim da semana.
          </p>
        )}

        {vencidas.length > 0 && (
          <Section
            icon={<AlarmClock className="h-3 w-3" />}
            label={`Vencidas (${vencidas.length})`}
            tone="rose"
          >
            <ul>
              {vencidas.slice(0, 4).map((t) => (
                <TarefaItem key={t.id} t={t} />
              ))}
            </ul>
          </Section>
        )}

        {hoje.length > 0 && (
          <Section
            icon={<CalendarClock className="h-3 w-3" />}
            label={`Hoje (${hoje.length})`}
            tone="amber"
          >
            <ul>
              {hoje.slice(0, 4).map((t) => (
                <TarefaItem key={t.id} t={t} />
              ))}
            </ul>
          </Section>
        )}

        {semana.length > 0 && (
          <Section
            icon={<CalendarRange className="h-3 w-3" />}
            label={`Próximos dias (${semana.length})`}
            tone="slate"
          >
            <ul>
              {semana.slice(0, 5).map((t) => (
                <TarefaItem key={t.id} t={t} />
              ))}
            </ul>
          </Section>
        )}
      </CardContent>
    </Card>
  );
}

const TONES = {
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  slate: "text-muted-foreground",
} as const;

function Section({
  icon,
  label,
  tone,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={cn("mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider", TONES[tone])}>
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
