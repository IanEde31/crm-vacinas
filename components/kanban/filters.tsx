"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Flame, AlarmClock, MapPin, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";

const SCORE_PRESETS = [
  { label: "Hot ≥70", value: "70" },
  { label: "Quente ≥40", value: "40" },
];
const PARADOS_PRESETS = [
  { label: "+7d", value: "7" },
  { label: "+14d", value: "14" },
];

export function KanbanFilters({ cidades }: { cidades: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [cidade, setCidade] = useState(searchParams.get("cidade") ?? "");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") ?? "");
  const [paradosDias, setParadosDias] = useState(searchParams.get("paradosDias") ?? "");

  function applyParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(`/leads${query ? `?${query}` : ""}`, { scroll: false });
    });
  }

  useEffect(() => {
    const t = setTimeout(() => applyParams({ busca }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const hasFilters = !!(busca || cidade || minScore || paradosDias);

  function clearAll() {
    setBusca("");
    setCidade("");
    setMinScore("");
    setParadosDias("");
    applyParams({ busca: "", cidade: "", minScore: "", paradosDias: "" });
  }

  function setScorePreset(v: string) {
    const next = minScore === v ? "" : v;
    setMinScore(next);
    applyParams({ minScore: next });
  }

  function setParadosPreset(v: string) {
    const next = paradosDias === v ? "" : v;
    setParadosDias(next);
    applyParams({ paradosDias: next });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da clínica..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 pl-9 pr-9"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select
          value={cidade || ALL}
          onValueChange={(v) => {
            const raw = v ?? ALL;
            const next = raw === ALL ? "" : raw;
            setCidade(next);
            applyParams({ cidade: next });
          }}
        >
          <SelectTrigger className="h-9 w-44">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as cidades</SelectItem>
            {cidades.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 rounded-md bg-muted/50 p-0.5">
          <span className="hidden items-center gap-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:flex">
            <Flame className="h-3 w-3" /> Score
          </span>
          {SCORE_PRESETS.map((p) => (
            <Chip
              key={p.value}
              active={minScore === p.value}
              onClick={() => setScorePreset(p.value)}
            >
              {p.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted/50 p-0.5">
          <span className="hidden items-center gap-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:flex">
            <AlarmClock className="h-3 w-3" /> Parados
          </span>
          {PARADOS_PRESETS.map((p) => (
            <Chip
              key={p.value}
              active={paradosDias === p.value}
              onClick={() => setParadosPreset(p.value)}
            >
              {p.label}
            </Chip>
          ))}
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={isPending}>
            <X className="h-3.5 w-3.5" /> Limpar
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-foreground/5 pt-2">
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            Filtros ativos
          </span>
          {busca && <ActiveTag label={`"${busca}"`} onClear={() => setBusca("")} />}
          {cidade && (
            <ActiveTag
              label={cidade}
              onClear={() => {
                setCidade("");
                applyParams({ cidade: "" });
              }}
            />
          )}
          {minScore && (
            <ActiveTag
              label={`Score ≥ ${minScore}`}
              onClear={() => {
                setMinScore("");
                applyParams({ minScore: "" });
              }}
            />
          )}
          {paradosDias && (
            <ActiveTag
              label={`Parados ≥ ${paradosDias}d`}
              onClear={() => {
                setParadosDias("");
                applyParams({ paradosDias: "" });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:bg-background hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ActiveTag({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[11px]">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
        aria-label={`Remover filtro ${label}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}
