"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Crown, CheckSquare } from "lucide-react";
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

export function FiltersBar({
  clinicas,
}: {
  clinicas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const cargo = searchParams.get("cargo") ?? "";
  const clinicaId = searchParams.get("clinicaId") ?? "";
  const decisor = searchParams.get("decisor") === "1";
  const comTarefa = searchParams.get("comTarefa") === "1";
  const sort = searchParams.get("sort") ?? "decisor";

  function applyParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    params.delete("id");
    const q = params.toString();
    startTransition(() => {
      router.replace(`/contatos${q ? `?${q}` : ""}`, { scroll: false });
    });
  }

  useEffect(() => {
    const t = setTimeout(() => applyParams({ busca }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const hasFilters = Boolean(
    busca || cargo || clinicaId || decisor || comTarefa || searchParams.get("id"),
  );

  function clearAll() {
    setBusca("");
    applyParams({
      busca: "",
      cargo: "",
      clinicaId: "",
      decisor: "",
      comTarefa: "",
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome, e-mail, telefone..."
          className="pl-8"
        />
      </div>

      <Select
        value={cargo || ALL}
        onValueChange={(v) => applyParams({ cargo: !v || v === ALL ? "" : v })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Cargo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Qualquer cargo</SelectItem>
          <SelectItem value="socio">Sócio</SelectItem>
          <SelectItem value="gestor">Gestor</SelectItem>
          <SelectItem value="medico">Médico</SelectItem>
          <SelectItem value="recepcao">Recepção</SelectItem>
          <SelectItem value="outro">Outro</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={clinicaId || ALL}
        onValueChange={(v) => applyParams({ clinicaId: !v || v === ALL ? "" : v })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Clínica" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as clínicas</SelectItem>
          {clinicas.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToggleChip
        active={decisor}
        icon={<Crown className="h-3 w-3" />}
        onClick={() => applyParams({ decisor: decisor ? "" : "1" })}
      >
        Só decisores
      </ToggleChip>

      <ToggleChip
        active={comTarefa}
        icon={<CheckSquare className="h-3 w-3" />}
        onClick={() => applyParams({ comTarefa: comTarefa ? "" : "1" })}
      >
        Com tarefa pendente
      </ToggleChip>

      <div className="ml-auto flex items-center gap-2">
        <Select
          value={sort}
          onValueChange={(v) => applyParams({ sort: v ?? "decisor" })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="decisor">Decisores primeiro</SelectItem>
            <SelectItem value="nome">Nome (A-Z)</SelectItem>
            <SelectItem value="clinica">Por clínica</SelectItem>
            <SelectItem value="recent">Mais recentes</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={isPending}>
            <X className="mr-1 h-3.5 w-3.5" /> Limpar
          </Button>
        )}
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300"
          : "border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {icon}
      {children}
    </button>
  );
}
