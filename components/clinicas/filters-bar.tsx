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

export function FiltersBar({ estados }: { estados: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const estado = searchParams.get("estado") ?? "";
  const porte = searchParams.get("porte") ?? "";
  const ratingMin = searchParams.get("ratingMin") ?? "";
  const sort = searchParams.get("sort") ?? "rating";

  function applyParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.replace(`/clinicas${query ? `?${query}` : ""}`, { scroll: false });
    });
  }

  useEffect(() => {
    const t = setTimeout(() => applyParams({ busca }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const hasFilters = Boolean(busca || estado || porte || ratingMin);

  function clearAll() {
    setBusca("");
    applyParams({ busca: "", estado: "", porte: "", ratingMin: "", cidade: "" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="pl-8"
        />
      </div>

      <Select
        value={estado || ALL}
        onValueChange={(v) => {
          const next = !v || v === ALL ? "" : v;
          applyParams({ estado: next, cidade: "" });
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="UF" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos UFs</SelectItem>
          {estados.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={porte || ALL}
        onValueChange={(v) => {
          const next = !v || v === ALL ? "" : v;
          applyParams({ porte: next });
        }}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Porte" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Qualquer porte</SelectItem>
          <SelectItem value="pequeno">Pequeno</SelectItem>
          <SelectItem value="medio">Médio</SelectItem>
          <SelectItem value="grande">Grande</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={ratingMin || ALL}
        onValueChange={(v) => {
          const next = !v || v === ALL ? "" : v;
          applyParams({ ratingMin: next });
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Qualquer ★</SelectItem>
          <SelectItem value="3">≥ 3.0 ★</SelectItem>
          <SelectItem value="4">≥ 4.0 ★</SelectItem>
          <SelectItem value="4.5">≥ 4.5 ★</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Select
          value={sort}
          onValueChange={(v) => applyParams({ sort: v ?? "rating" })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Maior rating</SelectItem>
            <SelectItem value="reviews">Mais avaliadas</SelectItem>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="nome">Nome (A-Z)</SelectItem>
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
