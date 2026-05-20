"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { iniciarBusca, verificarBusca } from "@/app/(dashboard)/radar/actions";
import type { Busca } from "@/lib/buscas/queries";
import { BuscaForm, type BuscaFormValues } from "./busca-form";
import { MapaScanner } from "./mapa-scanner";
import { ResultadoBusca } from "./resultado-busca";

type Fase = "form" | "scanning" | "resultado" | "erro";

type Resultado = {
  total: number;
  novas: number;
  atualizadas: number;
  descartadas: number;
};

const INTERVALO_POLL = 4000;

export function BuscaLeads({ buscaAtiva }: { buscaAtiva: Busca | null }) {
  const router = useRouter();

  const [fase, setFase] = useState<Fase>(buscaAtiva ? "scanning" : "form");
  const [buscaId, setBuscaId] = useState<string | null>(buscaAtiva?.id ?? null);
  const [iniciando, setIniciando] = useState(false);
  const [parcial, setParcial] = useState(buscaAtiva?.total_encontradas ?? 0);
  const [info, setInfo] = useState({
    cidade: buscaAtiva?.cidade ?? "",
    estado: buscaAtiva?.estado ?? "",
    alvo: buscaAtiva?.quantidade ?? 100,
  });
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Polling sequencial enquanto a busca roda — sem sobreposição de chamadas.
  useEffect(() => {
    if (fase !== "scanning" || !buscaId) return;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      let res;
      try {
        res = await verificarBusca({ buscaId: buscaId as string });
      } catch {
        if (!cancelado) timer = setTimeout(tick, INTERVALO_POLL + 2000);
        return;
      }
      if (cancelado) return;

      if (res.status === "running") {
        setParcial(res.parcial);
        timer = setTimeout(tick, INTERVALO_POLL);
      } else if (res.status === "concluida") {
        setResultado({
          total: res.total,
          novas: res.novas,
          atualizadas: res.atualizadas,
          descartadas: res.descartadas,
        });
        setFase("resultado");
        router.refresh();
      } else {
        setErro(res.erro);
        setFase("erro");
        toast.error(res.erro);
      }
    }

    // Pequeno atraso inicial para a animação ganhar presença.
    timer = setTimeout(tick, 1500);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [fase, buscaId, router]);

  async function handleIniciar(values: BuscaFormValues) {
    setIniciando(true);
    const res = await iniciarBusca({
      cidade: values.cidade,
      estado: values.estado,
      termo: values.termo,
      quantidade: values.quantidade,
    });
    setIniciando(false);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setBuscaId(res.buscaId);
    setInfo({
      cidade: values.cidade,
      estado: values.estado,
      alvo: values.quantidade,
    });
    setParcial(0);
    setResultado(null);
    setErro(null);
    setFase("scanning");
  }

  function handleNovaBusca() {
    setFase("form");
    setBuscaId(null);
    setParcial(0);
    setResultado(null);
    setErro(null);
  }

  if (fase === "scanning") {
    return (
      <MapaScanner
        parcial={parcial}
        alvo={info.alvo}
        cidade={info.cidade}
        estado={info.estado}
      />
    );
  }

  if (fase === "resultado" && resultado) {
    return (
      <ResultadoBusca
        total={resultado.total}
        novas={resultado.novas}
        atualizadas={resultado.atualizadas}
        descartadas={resultado.descartadas}
        cidade={info.cidade}
        estado={info.estado}
        onNovaBusca={handleNovaBusca}
      />
    );
  }

  if (fase === "erro") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/5">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h2 className="mt-3 font-heading text-lg font-semibold">
          A busca não foi concluída
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {erro ?? "Ocorreu um erro inesperado."}
        </p>
        <Button className="mt-4" size="sm" onClick={handleNovaBusca}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return <BuscaForm loading={iniciando} onIniciar={handleIniciar} />;
}
