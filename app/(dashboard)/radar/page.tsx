import { fetchBuscaAtiva, fetchBuscasRecentes } from "@/lib/buscas/queries";
import { BuscaLeads } from "@/components/radar/busca-leads";
import { HistoricoBuscas } from "@/components/radar/historico-buscas";

export const metadata = { title: "Buscar Leads | 7Bee CRM" };
export const dynamic = "force-dynamic";
// Margem para a ingestão de até 200 registros no poll que conclui a busca.
export const maxDuration = 60;

export default async function RadarPage() {
  const [buscaAtiva, buscasRecentes] = await Promise.all([
    fetchBuscaAtiva(),
    fetchBuscasRecentes(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Buscar leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dispare uma varredura no Google Maps e traga novas clínicas direto
          para o pipeline.
        </p>
      </header>

      <BuscaLeads buscaAtiva={buscaAtiva} />

      <HistoricoBuscas buscas={buscasRecentes} />
    </div>
  );
}
