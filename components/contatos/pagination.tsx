"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  perPage,
  total,
}: {
  page: number;
  totalPages: number;
  perPage: number;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function go(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const q = params.toString();
    router.replace(`/contatos${q ? `?${q}` : ""}`, { scroll: false });
  }

  if (totalPages <= 1) {
    return (
      <div className="text-xs text-muted-foreground">
        Exibindo {total} de {total}
      </div>
    );
  }

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground tabular-nums">
        {start.toLocaleString("pt-BR")}–{end.toLocaleString("pt-BR")} de{" "}
        {total.toLocaleString("pt-BR")}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs tabular-nums text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
