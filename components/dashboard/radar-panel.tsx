import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Radar, MapPin, Sparkle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { RadarData } from "@/lib/dashboard/metrics";
import { cn, fmtInt } from "@/lib/utils";

export function RadarPanel({ radar }: { radar: RadarData }) {
  const {
    buscas30d,
    encontrados30d,
    novas30d,
    atualizadas30d,
    descartadas30d,
    taxaNovos,
    ultimaBusca,
    topCidades,
    baseClinicas,
  } = radar;

  const totalComp = Math.max(1, novas30d + atualizadas30d + descartadas30d);
  const maxCidade = Math.max(1, ...topCidades.map((c) => c.total));

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
            <Radar className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base">Radar de prospecção</CardTitle>
            <CardDescription>Geração automática de leads · 30 dias</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-4">
        {/* Scope + números-chave */}
        <div className="flex items-center gap-4">
          <RadarScope total={baseClinicas} />
          <div className="grid flex-1 grid-cols-2 gap-2">
            <MiniStat label="Varreduras" value={fmtInt(buscas30d)} />
            <MiniStat label="Leads varridos" value={fmtInt(encontrados30d)} />
            <MiniStat
              label="Leads inéditos"
              value={fmtInt(novas30d)}
              tone="emerald"
            />
            <MiniStat label="Taxa de novos" value={`${taxaNovos}%`} tone="amber" />
          </div>
        </div>

        {/* Composição da varredura */}
        <div className="mt-4">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Composição das varreduras</span>
          </div>
          <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="bg-emerald-500"
              style={{ width: `${(novas30d / totalComp) * 100}%` }}
            />
            <div
              className="bg-sky-500"
              style={{ width: `${(atualizadas30d / totalComp) * 100}%` }}
            />
            <div
              className="bg-slate-400 dark:bg-slate-600"
              style={{ width: `${(descartadas30d / totalComp) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <Legenda cor="bg-emerald-500" label="Novos" valor={novas30d} />
            <Legenda cor="bg-sky-500" label="Atualizados" valor={atualizadas30d} />
            <Legenda
              cor="bg-slate-400 dark:bg-slate-600"
              label="Descartados"
              valor={descartadas30d}
            />
          </div>
        </div>

        {/* Top cidades */}
        <div className="mt-4 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Concentração da base
          </div>
          {topCidades.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Nenhuma cidade mapeada ainda.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {topCidades.slice(0, 5).map((c, i) => (
                <li key={`${c.cidade}-${c.estado}`} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="w-28 shrink-0 truncate text-xs">
                    {c.cidade}
                    {c.estado && (
                      <span className="text-muted-foreground">/{c.estado}</span>
                    )}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500/70"
                      style={{ width: `${(c.total / maxCidade) * 100}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums">
                    {c.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Última varredura */}
        <Link
          href="/radar"
          className="mt-4 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors hover:bg-muted/50"
        >
          <Sparkle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          {ultimaBusca ? (
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              Última varredura:{" "}
              <span className="font-medium text-foreground">
                {ultimaBusca.cidade}/{ultimaBusca.estado}
              </span>{" "}
              ·{" "}
              {formatDistanceToNow(new Date(ultimaBusca.quando), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          ) : (
            <span className="flex-1 text-muted-foreground">
              Nenhuma varredura ainda — abra o Radar para buscar leads.
            </span>
          )}
          {ultimaBusca && ultimaBusca.novas > 0 && (
            <span className="shrink-0 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              +{ultimaBusca.novas}
            </span>
          )}
        </Link>
      </CardContent>
    </Card>
  );
}

/** Scope circular com varredura animada (CSS de globals.css). */
function RadarScope({ total }: { total: number }) {
  return (
    <div className="relative h-28 w-28 shrink-0">
      <div className="absolute inset-0 rounded-full border border-emerald-500/30" />
      <div className="absolute inset-[20%] rounded-full border border-emerald-500/25" />
      <div className="absolute inset-[40%] rounded-full border border-emerald-500/20" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-emerald-500/15" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-emerald-500/15" />
      {/* feixe de varredura */}
      <div
        className="absolute inset-0 rounded-full animate-radar-sweep"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.35) 44deg, transparent 64deg)",
        }}
      />
      {/* blip */}
      <span className="absolute right-[26%] top-[32%] h-1.5 w-1.5 rounded-full bg-emerald-400 animate-radar-ping" />
      {/* valor central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl font-bold tabular-nums leading-none">
          {fmtInt(total)}
        </span>
        <span className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
          clínicas
        </span>
      </div>
    </div>
  );
}

const MINI_TONES = {
  default: "text-foreground",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
} as const;

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: keyof typeof MINI_TONES;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2 ring-1 ring-foreground/5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-heading text-lg font-semibold tabular-nums leading-none",
          MINI_TONES[tone],
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Legenda({
  cor,
  label,
  valor,
}: {
  cor: string;
  label: string;
  valor: number;
}) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-sm", cor)} />
      {label}
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {valor}
      </span>
    </span>
  );
}
