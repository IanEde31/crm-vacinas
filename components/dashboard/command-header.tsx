import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Radar, Sparkles, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn, fmtCurrencyCompact } from "@/lib/utils";

function saudacao(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function nomeDoUsuario(email: string | null) {
  if (!email) return "time 7Bee";
  const handle = email.split("@")[0];
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

type Props = {
  userEmail: string | null;
  valorPipeline: number;
  totalAtivos: number;
  tarefasHoje: number;
  pendencias: number;
};

export function CommandHeader({
  userEmail,
  valorPipeline,
  totalAtivos,
  tarefasHoje,
  pendencias,
}: Props) {
  const now = new Date();
  const data = format(now, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-background to-background ring-1 ring-foreground/10 duration-700 animate-in fade-in slide-in-from-bottom-3 dark:from-amber-950/40">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />

      <div className="relative p-5 sm:p-6">
        {/* Linha superior — status + data + ações */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Operação ativa
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {data}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/radar"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Radar className="h-4 w-4" />
              Radar de leads
            </Link>
            <Link
              href="/leads?novo=1"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Plus className="h-4 w-4" />
              Novo lead
            </Link>
          </div>
        </div>

        {/* Saudação */}
        <div className="mt-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {saudacao(now)}, {nomeDoUsuario(userEmail)}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Centro de comando comercial — pulso do pipeline em tempo real.
          </p>
        </div>

        {/* Faixa de status — métricas vivas */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatusCell
            label="Valor em pipeline"
            value={fmtCurrencyCompact(valorPipeline)}
            tone="amber"
          />
          <StatusCell
            label="Leads ativos"
            value={`${totalAtivos}`}
            tone="default"
          />
          <StatusCell
            label="Tarefas hoje"
            value={`${tarefasHoje}`}
            tone={tarefasHoje > 0 ? "sky" : "default"}
          />
          <StatusCell
            label="Pendências"
            value={`${pendencias}`}
            tone={pendencias > 0 ? "rose" : "emerald"}
            href="/tarefas"
          />
        </div>
      </div>
    </div>
  );
}

const TONES = {
  amber: "text-amber-600 dark:text-amber-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  sky: "text-sky-600 dark:text-sky-400",
  rose: "text-rose-600 dark:text-rose-400",
  default: "text-foreground",
} as const;

function StatusCell({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string;
  tone: keyof typeof TONES;
  href?: string;
}) {
  const inner = (
    <div className="group h-full rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
        {href && (
          <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
        )}
      </div>
      <div
        className={cn(
          "mt-1 font-heading text-xl font-semibold tabular-nums tracking-tight",
          TONES[tone],
        )}
      >
        {value}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
