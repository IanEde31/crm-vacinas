"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  KanbanSquare,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ResultadoBusca({
  total,
  novas,
  atualizadas,
  descartadas,
  cidade,
  estado,
  onNovaBusca,
}: {
  total: number;
  novas: number;
  atualizadas: number;
  descartadas: number;
  cidade: string;
  estado: string;
  onNovaBusca: () => void;
}) {
  const semNovas = novas === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-lg" />
            <CheckCircle2 className="relative h-8 w-8" />
          </span>

          <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
            Busca concluída
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {semNovas ? (
              <>
                Varremos <strong className="text-foreground">{cidade}, {estado}</strong>{" "}
                e não encontramos clínicas novas — sua base já estava em dia por aqui.
              </>
            ) : (
              <>
                Encontramos{" "}
                <strong className="text-foreground">
                  {novas} {novas === 1 ? "nova clínica" : "novas clínicas"}
                </strong>{" "}
                em <strong className="text-foreground">{cidade}, {estado}</strong>.
                {novas === 1 ? " Ela já está" : " Elas já estão"} no pipeline como{" "}
                lead bruto.
              </>
            )}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={<Search className="h-4 w-4" />}
            label="Encontradas"
            value={total}
            accent="slate"
          />
          <Stat
            icon={<Sparkles className="h-4 w-4" />}
            label="Novas"
            value={novas}
            accent="emerald"
            destaque
          />
          <Stat
            icon={<RefreshCw className="h-4 w-4" />}
            label="Atualizadas"
            value={atualizadas}
            accent="amber"
          />
          <Stat
            icon={<XCircle className="h-4 w-4" />}
            label="Descartadas"
            value={descartadas}
            accent="slate"
          />
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Descartadas: clínicas fechadas, sem dados válidos ou duplicadas no resultado.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/leads" className={cn(buttonVariants({ size: "sm" }))}>
            <KanbanSquare className="h-4 w-4" />
            Ver no pipeline
          </Link>
          <Link
            href="/clinicas"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Building2 className="h-4 w-4" />
            Ver clínicas
          </Link>
          <Button variant="ghost" size="sm" onClick={onNovaBusca}>
            <Search className="h-4 w-4" />
            Nova busca
          </Button>
        </div>
      </div>
    </div>
  );
}

const ACCENTS = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  slate: "bg-muted text-muted-foreground",
} as const;

function Stat({
  icon,
  label,
  value,
  accent,
  destaque,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: keyof typeof ACCENTS;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5",
        destaque && "border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-500/30 dark:ring-emerald-500/20",
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-lg",
          ACCENTS[accent],
        )}
      >
        {icon}
      </span>
      <div className="mt-2 font-heading text-2xl font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
