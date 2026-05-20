"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Briefcase, User, Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ESTAGIOS } from "@/lib/estagios";
import { searchLinkTargets, type SearchResult } from "@/app/(dashboard)/tarefas/actions";

export type PickerValue =
  | { kind: "lead"; lead_id: string; clinica_id: string; label: string; sub: string }
  | { kind: "clinica"; clinica_id: string; label: string; sub: string }
  | { kind: "contato"; contato_id: string; clinica_id: string; label: string; sub: string };

const CARGO_LABEL: Record<string, string> = {
  socio: "Sócio",
  gestor: "Gestor",
  recepcao: "Recepção",
  medico: "Médico",
  outro: "Outro",
};

function estagioLabel(id: string): string {
  return ESTAGIOS.find((e) => e.id === id)?.label ?? id;
}

function localizacao(cidade: string | null, estado: string | null): string {
  return [cidade, estado].filter(Boolean).join(" / ");
}

function toPickerValue(r: SearchResult): PickerValue {
  if (r.type === "lead") {
    const local = localizacao(r.cidade, r.estado);
    return {
      kind: "lead",
      lead_id: r.lead_id,
      clinica_id: r.clinica_id,
      label: r.clinica_nome,
      sub: `Lead · ${estagioLabel(r.estagio)}${local ? ` · ${local}` : ""}`,
    };
  }
  if (r.type === "clinica") {
    const local = localizacao(r.cidade, r.estado);
    return {
      kind: "clinica",
      clinica_id: r.clinica_id,
      label: r.clinica_nome,
      sub: `Clínica${local ? ` · ${local}` : ""}`,
    };
  }
  const cargo = r.cargo ? CARGO_LABEL[r.cargo] ?? r.cargo : null;
  const tag = r.is_decisor ? "Decisor" : cargo ?? "Contato";
  const cargoExtra = r.is_decisor && cargo ? ` (${cargo})` : "";
  return {
    kind: "contato",
    contato_id: r.contato_id,
    clinica_id: r.clinica_id,
    label: r.contato_nome,
    sub: `${tag}${cargoExtra} · ${r.clinica_nome}`,
  };
}

const KIND_STYLE = {
  lead: {
    icon: Briefcase,
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  clinica: {
    icon: Building2,
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  contato: {
    icon: User,
    bg: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
} as const;

function iconBgFor(type: SearchResult["type"]): string {
  return KIND_STYLE[type].bg;
}

function IconFor({ type }: { type: SearchResult["type"] }) {
  const Icon = KIND_STYLE[type].icon;
  return <Icon className="h-3.5 w-3.5" />;
}

export function LeadOrClinicaPicker({
  value,
  onChange,
}: {
  value: PickerValue | null;
  onChange: (v: PickerValue | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const r = await searchLinkTargets("");
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchLinkTargets(trimmed);
      setResults(r);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (value) {
    const style = KIND_STYLE[value.kind];
    const Icon = style.icon;
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            style.bg,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{value.label}</div>
          <div className="truncate text-[11px] text-muted-foreground">{value.sub}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange(null)}
          aria-label="Desvincular"
          title="Desvincular"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  function handleBlur() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setFocused(false), 150);
  }

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setFocused(true);
  }

  const showDropdown = focused;
  const hasQuery = query.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Pesquisar lead, clínica ou contato..."
          className="pl-8"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover shadow-md">
          {!hasQuery && results.length > 0 && (
            <div className="border-b bg-muted/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Sugestões
            </div>
          )}
          {results.length === 0 && !loading && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              {hasQuery
                ? `Nenhum resultado para "${query}"`
                : "Nenhum lead, clínica ou contato disponível"}
            </div>
          )}
          {results.map((r) => {
            const key =
              r.type === "lead"
                ? `lead-${r.lead_id}`
                : r.type === "contato"
                  ? `contato-${r.contato_id}`
                  : `clinica-${r.clinica_id}`;
            const pv = toPickerValue(r);
            return (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(pv);
                  setQuery("");
                  setFocused(false);
                }}
                className="flex w-full items-center gap-2 border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    iconBgFor(r.type),
                  )}
                >
                  <IconFor type={r.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{pv.label}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{pv.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
