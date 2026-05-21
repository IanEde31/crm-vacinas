import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback exibido instantaneamente ao navegar entre rotas do dashboard
 * (cliques na sidebar). A sidebar e a navbar ficam no layout e permanecem
 * visíveis — só a área de conteúdo é substituída por este esqueleto.
 *
 * Mudanças de filtro/paginação na mesma rota usam `useTransition` e NÃO
 * disparam este fallback, então o conteúdo atual não pisca.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
