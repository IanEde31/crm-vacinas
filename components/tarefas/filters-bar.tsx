"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function FiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const status = searchParams.get("status") ?? "pendentes";
  const prioridade = searchParams.get("prioridade") ?? "";
  const scope = searchParams.get("scope") ?? "todas";

  function applyParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const q = params.toString();
    startTransition(() => {
      router.replace(`/tarefas${q ? `?${q}` : ""}`, { scroll: false });
    });
  }

  useEffect(() => {
    const t = setTimeout(() => applyParams({ busca }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const hasFilters = Boolean(
    busca || prioridade || status !== "pendentes" || scope !== "todas",
  );

  function clearAll() {
    setBusca("");
    applyParams({
      busca: "",
      prioridade: "",
      status: "",
      scope: "",
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar título, descrição, clínica..."
          className="pl-8"
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => applyParams({ status: v === "pendentes" ? "" : (v ?? "") })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pendentes">Pendentes</SelectItem>
          <SelectItem value="concluidas">Concluídas</SelectItem>
          <SelectItem value="todas">Todas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={prioridade || ALL}
        onValueChange={(v) => applyParams({ prioridade: !v || v === ALL ? "" : v })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Qualquer prioridade</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Média</SelectItem>
          <SelectItem value="baixa">Baixa</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={scope}
        onValueChange={(v) => applyParams({ scope: v === "todas" ? "" : (v ?? "") })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas</SelectItem>
          <SelectItem value="minhas">Minhas</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} disabled={isPending}>
          <X className="mr-1 h-3.5 w-3.5" /> Limpar
        </Button>
      )}
    </div>
  );
}
