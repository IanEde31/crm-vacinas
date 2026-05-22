import Link from "next/link";
import {
  ScanSearch,
  Star,
  Clock,
  MessageSquareReply,
  Target,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EstagioLead, StatusClienteOculto } from "@/lib/supabase/types";

// =============================================================================
// Tipos
// =============================================================================

/** Linha crua de `clientes_ocultos` + lead/clínica, como vem da query. */
export type ClienteOcultoRaw = {
  id: string;
  respondeu: boolean;
  tentou_agendar: boolean | null;
  fez_followup: boolean | null;
  conseguiu_preco: boolean | null;
  qualidade_atendimento: number | null;
  tempo_resposta_minutos: number | null;
  status: StatusClienteOculto | null;
  lead: {
    id: string;
    score: number;
    estagio: EstagioLead;
    deleted_at: string | null;
    clinica: { nome: string; cidade: string | null; estado: string | null } | null;
  } | null;
};

type Dor = { label: string; pct: number; base: number };

type Alvo = {
  leadId: string;
  clinica: string;
  local: string | null;
  nota: number | null;
  motivo: string;
  score: number;
};

export type ClienteOcultoIntelData = {
  total: number;
  concluidos: number;
  emAndamento: number;
  notaMedia: number | null;
  tempoMedioMin: number | null;
  tempoMaxMin: number | null;
  taxaResposta: number | null;
  dores: Dor[];
  distribuicaoNotas: { nota: number; count: number }[];
  alvos: Alvo[];
};

// =============================================================================
// Agregação — roda no servidor, sem mexer no banco
// =============================================================================

const EM_ANDAMENTO: StatusClienteOculto[] = ["aguardando_resposta", "em_conversa"];

export function aggregateClienteOculto(
  rowsRaw: ClienteOcultoRaw[],
): ClienteOcultoIntelData {
  // Ignora diagnósticos de leads excluídos (soft delete).
  const rows = rowsRaw.filter((r) => r.lead && !r.lead.deleted_at);
  const total = rows.length;

  const emAndamento = rows.filter(
    (r) => r.status != null && EM_ANDAMENTO.includes(r.status),
  ).length;
  // Concluídos = encerrados, desistidos ou preenchidos manualmente (status nulo).
  const concluidos = rows.filter(
    (r) => r.status == null || !EM_ANDAMENTO.includes(r.status),
  );
  const nConcluidos = concluidos.length;

  const notas = concluidos
    .map((r) => r.qualidade_atendimento)
    .filter((n): n is number => n != null);
  const notaMedia = notas.length
    ? notas.reduce((s, n) => s + n, 0) / notas.length
    : null;

  const tempos = concluidos
    .map((r) => r.tempo_resposta_minutos)
    .filter((n): n is number => n != null && n >= 0);
  const tempoMedioMin = tempos.length
    ? Math.round(tempos.reduce((s, n) => s + n, 0) / tempos.length)
    : null;
  const tempoMaxMin = tempos.length ? Math.max(...tempos) : null;

  const responderam = concluidos.filter((r) => r.respondeu);
  const taxaResposta = nConcluidos
    ? Math.round((responderam.length / nConcluidos) * 100)
    : null;

  const pct = (n: number, base: number) =>
    base > 0 ? Math.round((n / base) * 100) : 0;

  // Brechas no atendimento — cada uma é uma dor real e um argumento de venda.
  // Follow-up/preço/agendamento só fazem sentido entre quem respondeu.
  const dores: Dor[] = [
    {
      label: "Não responderam o contato",
      pct: pct(concluidos.filter((r) => !r.respondeu).length, nConcluidos),
      base: nConcluidos,
    },
    {
      label: "Não fizeram follow-up",
      pct: pct(
        responderam.filter((r) => r.fez_followup !== true).length,
        responderam.length,
      ),
      base: responderam.length,
    },
    {
      label: "Não passaram preço",
      pct: pct(
        responderam.filter((r) => r.conseguiu_preco !== true).length,
        responderam.length,
      ),
      base: responderam.length,
    },
    {
      label: "Não tentaram agendar",
      pct: pct(
        responderam.filter((r) => r.tentou_agendar !== true).length,
        responderam.length,
      ),
      base: responderam.length,
    },
  ].sort((a, b) => b.pct - a.pct);

  const distribuicaoNotas = [1, 2, 3, 4, 5].map((nota) => ({
    nota,
    count: notas.filter((n) => n === nota).length,
  }));

  // Alvos quentes: maior fraqueza no atendimento = lead mais maduro pra abordar.
  const alvos: Alvo[] = concluidos
    .map((r) => {
      let fraqueza = 0;
      if (!r.respondeu) fraqueza += 50;
      if (r.qualidade_atendimento != null) {
        fraqueza += (5 - r.qualidade_atendimento) * 8;
      }
      if (r.respondeu && r.fez_followup !== true) fraqueza += 12;
      if (r.respondeu && r.conseguiu_preco !== true) fraqueza += 8;
      if (r.respondeu && r.tentou_agendar !== true) fraqueza += 10;

      let motivo: string;
      if (!r.respondeu) motivo = "Não respondeu o lead";
      else if (r.qualidade_atendimento != null && r.qualidade_atendimento <= 2)
        motivo = "Atendimento fraco";
      else if (r.fez_followup !== true) motivo = "Sem follow-up";
      else if (r.conseguiu_preco !== true) motivo = "Não passou preço";
      else if (r.tentou_agendar !== true) motivo = "Não tentou agendar";
      else motivo = "Brecha no atendimento";

      return {
        fraqueza,
        alvo: {
          leadId: r.lead!.id,
          clinica: r.lead!.clinica?.nome ?? "(sem clínica)",
          local:
            [r.lead!.clinica?.cidade, r.lead!.clinica?.estado]
              .filter(Boolean)
              .join(" · ") || null,
          nota: r.qualidade_atendimento,
          motivo,
          score: r.lead!.score,
        },
      };
    })
    .filter((x) => x.fraqueza > 0)
    .sort((a, b) => b.fraqueza - a.fraqueza)
    .slice(0, 6)
    .map((x) => x.alvo);

  return {
    total,
    concluidos: nConcluidos,
    emAndamento,
    notaMedia,
    tempoMedioMin,
    tempoMaxMin,
    taxaResposta,
    dores,
    distribuicaoNotas,
    alvos,
  };
}

// =============================================================================
// Helpers de formatação
// =============================================================================

function fmtTempo(min: number | null): string {
  if (min == null) return "—";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function Stars({ nota }: { nota: number | null }) {
  if (nota == null) {
    return <span className="text-[11px] text-muted-foreground">sem nota</span>;
  }
  return (
    <span className="flex items-center gap-0.5" aria-label={`Nota ${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i <= nota
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}

// =============================================================================
// Componente
// =============================================================================

export function ClienteOcultoIntel({ intel }: { intel: ClienteOcultoIntelData }) {
  const {
    total,
    concluidos,
    emAndamento,
    notaMedia,
    tempoMedioMin,
    tempoMaxMin,
    taxaResposta,
    dores,
    distribuicaoNotas,
    alvos,
  } = intel;

  return (
    <Card className="overflow-hidden">
      {/* Faixa de cabeçalho — destaque de "inteligência" */}
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 via-card to-card dark:from-indigo-950/40">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30">
            <ScanSearch className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base">
              Inteligência de Cliente Oculto
            </CardTitle>
            <CardDescription>
              {total === 0
                ? "Diagnóstico automático do atendimento das clínicas"
                : `${total} ${total === 1 ? "clínica radiografada" : "clínicas radiografadas"} — cada brecha é um argumento de venda`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {total === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-5">
            {/* Faixa de números-chave */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCell
                icon={<ScanSearch className="h-4 w-4" />}
                accent="indigo"
                label="Diagnósticos"
                value={`${concluidos}`}
                sub={
                  emAndamento > 0
                    ? `${emAndamento} em andamento`
                    : "todos concluídos"
                }
              />
              <StatCell
                icon={<Star className="h-4 w-4" />}
                accent="amber"
                label="Nota de atendimento"
                value={notaMedia != null ? notaMedia.toFixed(1) : "—"}
                sub={
                  notaMedia != null ? (
                    <Stars nota={Math.round(notaMedia)} />
                  ) : (
                    "sem notas ainda"
                  )
                }
              />
              <StatCell
                icon={<MessageSquareReply className="h-4 w-4" />}
                accent={
                  taxaResposta != null && taxaResposta < 60 ? "emerald" : "slate"
                }
                label="Respondem o lead"
                value={taxaResposta != null ? `${taxaResposta}%` : "—"}
                sub={
                  taxaResposta != null && taxaResposta < 60
                    ? "muitas ignoram contatos"
                    : "das clínicas diagnosticadas"
                }
              />
              <StatCell
                icon={<Clock className="h-4 w-4" />}
                accent="slate"
                label="Tempo de resposta"
                value={fmtTempo(tempoMedioMin)}
                sub={
                  tempoMaxMin != null
                    ? `pior caso: ${fmtTempo(tempoMaxMin)}`
                    : "tempo médio"
                }
              />
            </div>

            {concluidos === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <div className="text-sm font-medium">
                  {emAndamento} diagnóstico{emAndamento === 1 ? "" : "s"} em
                  andamento
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  O agente de IA ainda está conduzindo as conversas. Os
                  resultados aparecem aqui assim que encerrarem.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                {/* Brechas no atendimento */}
                <div className="lg:col-span-3">
                  <SectionTitle>Brechas no atendimento detectadas</SectionTitle>
                  <ul className="mt-3 space-y-2.5">
                    {dores.map((d) => (
                      <li key={d.label}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm">{d.label}</span>
                          <span className="shrink-0 font-heading text-sm font-semibold tabular-nums">
                            {d.pct}%
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                              style={{ width: `${Math.max(2, d.pct)}%` }}
                            />
                          </div>
                          <span className="w-20 shrink-0 text-right text-[10px] text-muted-foreground">
                            base: {d.base}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Distribuição das notas 1–5 */}
                  <SectionTitle className="mt-5">
                    Distribuição das notas de atendimento
                  </SectionTitle>
                  <NotasDistribuicao dados={distribuicaoNotas} />
                </div>

                {/* Alvos quentes */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <SectionTitle>Alvos quentes</SectionTitle>
                    <Link
                      href="/leads?estagio=cliente_oculto"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      ver todos
                    </Link>
                  </div>
                  {alvos.length === 0 ? (
                    <p className="mt-3 rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                      Nenhuma brecha relevante nos diagnósticos atuais.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {alvos.map((a) => (
                        <li key={a.leadId}>
                          <Link
                            href={`/leads?lead=${a.leadId}`}
                            className="group flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/60"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                              <Target className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {a.clinica}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                  {a.motivo}
                                </span>
                                {a.local && (
                                  <>
                                    <span className="text-muted-foreground/50">
                                      ·
                                    </span>
                                    <span className="truncate text-[11px] text-muted-foreground">
                                      {a.local}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-0.5">
                              <Stars nota={a.nota} />
                              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Subcomponentes
// =============================================================================

const ACCENTS = {
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
} as const;

function StatCell({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
  accent: keyof typeof ACCENTS;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            ACCENTS[accent],
          )}
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-2 font-heading text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <div className="mt-0.5 flex h-4 items-center text-[11px] text-muted-foreground">
        {sub}
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </h3>
  );
}

function NotasDistribuicao({
  dados,
}: {
  dados: { nota: number; count: number }[];
}) {
  const max = Math.max(1, ...dados.map((d) => d.count));
  return (
    <div className="mt-3 flex items-end gap-2">
      {dados.map((d) => {
        const altura = (d.count / max) * 100;
        // Notas baixas = atendimento fraco = lead mais quente.
        const cor =
          d.nota <= 2
            ? "bg-gradient-to-t from-amber-500 to-amber-400"
            : d.nota === 3
              ? "bg-slate-400"
              : "bg-emerald-400/70";
        return (
          <div key={d.nota} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
              {d.count}
            </span>
            <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-muted/60">
              <div
                className={cn("w-full rounded-md transition-all", cor)}
                style={{ height: `${Math.max(3, altura)}%` }}
              />
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Star className="h-2.5 w-2.5" />
              {d.nota}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ScanSearch className="h-6 w-6 text-muted-foreground" />
      </span>
      <div className="mt-3 text-sm font-medium">
        Nenhum diagnóstico de cliente oculto ainda
      </div>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
        Mova um lead para o estágio{" "}
        <span className="font-medium text-foreground">Cliente Oculto</span> para
        disparar o diagnóstico automático. Cada brecha encontrada no atendimento
        vira um argumento de venda — e sobe o score do lead.
      </p>
    </div>
  );
}
