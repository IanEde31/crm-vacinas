"use client";

import { useEffect, useState } from "react";
import { MapPin, Radar, Search, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { listarMunicipios } from "@/app/(dashboard)/radar/actions";
import { TERMOS_BUSCA, TERMO_TODOS, UFS } from "@/lib/buscas/termos";

export type BuscaFormValues = {
  cidade: string;
  estado: string;
  termo: string;
  quantidade: number;
};

const PRESETS = [50, 100, 150, 200];
const QTD_MIN = 1;
const QTD_MAX = 200;

/** Mantém a quantidade dentro dos limites aceitos pela busca. */
function clampQuantidade(n: number) {
  if (!Number.isFinite(n)) return QTD_MIN;
  return Math.min(QTD_MAX, Math.max(QTD_MIN, Math.round(n)));
}

export function BuscaForm({
  loading,
  onIniciar,
}: {
  loading: boolean;
  onIniciar: (values: BuscaFormValues) => void;
}) {
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [termo, setTermo] = useState(TERMOS_BUSCA[0].id);
  const [quantidade, setQuantidade] = useState(100);
  // Rascunho do campo digitável — permite limpar/digitar sem normalizar a cada tecla.
  const [quantidadeTexto, setQuantidadeTexto] = useState("100");

  const [municipios, setMunicipios] = useState<string[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [erroCidades, setErroCidades] = useState(false);

  // Cidade é dependente do estado: ao trocar a UF, recarrega a lista do IBGE.
  useEffect(() => {
    if (!estado) {
      setMunicipios([]);
      setErroCidades(false);
      return;
    }
    let cancelado = false;
    setCarregandoCidades(true);
    setErroCidades(false);
    setCidade("");
    setMunicipios([]);

    listarMunicipios(estado)
      .then((lista) => {
        if (cancelado) return;
        if (lista.length === 0) setErroCidades(true);
        setMunicipios(lista);
      })
      .catch(() => {
        if (!cancelado) setErroCidades(true);
      })
      .finally(() => {
        if (!cancelado) setCarregandoCidades(false);
      });

    return () => {
      cancelado = true;
    };
  }, [estado]);

  const valido = cidade.trim().length >= 2 && estado.length === 2;

  // Define a quantidade pelo slider/presets, mantendo o campo digitável em sincronia.
  function aplicarQuantidade(n: number) {
    const c = clampQuantidade(n);
    setQuantidade(c);
    setQuantidadeTexto(String(c));
  }

  // Normaliza o campo digitável quando o usuário sai dele.
  function confirmarQuantidadeTexto() {
    const c = clampQuantidade(Number(quantidadeTexto));
    setQuantidade(c);
    setQuantidadeTexto(String(c));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || loading) return;
    onIniciar({
      cidade: cidade.trim(),
      estado,
      termo,
      quantidade: clampQuantidade(Number(quantidadeTexto) || quantidade),
    });
  }

  const cidadePlaceholder = !estado
    ? "Escolha o estado primeiro"
    : carregandoCidades
      ? "Carregando cidades…"
      : "Selecione a cidade";

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-300" />

      <div className="grid gap-0 md:grid-cols-[1fr_1.25fr]">
        {/* Painel ilustrativo. */}
        <div className="relative hidden flex-col justify-between gap-6 border-r bg-gradient-to-br from-amber-50 via-card to-card p-6 md:flex dark:from-amber-950/30">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl" />
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Prospecção
            </span>
            <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
              Encontre novas clínicas em minutos
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha a praça e o tipo de clínica. A gente varre o Google Maps,
              limpa os dados e joga tudo direto no seu pipeline.
            </p>
          </div>

          <ul className="space-y-2.5 text-sm">
            {[
              { icon: Search, txt: "Busca automática no Google Maps" },
              { icon: MapPin, txt: "Telefone, avaliações e endereço" },
              { icon: Radar, txt: "Sem duplicados — dedupe garantido" },
            ].map(({ icon: Icon, txt }) => (
              <li key={txt} className="flex items-center gap-2.5 text-muted-foreground">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {txt}
              </li>
            ))}
          </ul>
        </div>

        {/* Formulário. */}
        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_1.6fr]">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => (
                    <SelectItem key={uf.sigla} value={uf.sigla}>
                      {uf.sigla} — {uf.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              {erroCidades ? (
                <>
                  <Input
                    id="cidade"
                    placeholder="Digite a cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    autoComplete="off"
                    disabled={!estado}
                  />
                  <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="h-3 w-3" />
                    Não consegui carregar a lista de cidades — digite com atenção.
                  </p>
                </>
              ) : (
                <Select
                  value={cidade}
                  onValueChange={(v) => setCidade(v ?? "")}
                  disabled={!estado || carregandoCidades}
                >
                  <SelectTrigger className="w-full" id="cidade">
                    <SelectValue placeholder={cidadePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de clínica</Label>
            <Select value={termo} onValueChange={(v) => setTermo(v ?? termo)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERMOS_BUSCA.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
                <SelectItem value={TERMO_TODOS}>
                  Todos os termos (recomendado)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              &quot;Todos&quot; roda as variações de uma vez para máximo alcance.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="quantidade">Quantidade de leads</Label>
              <input
                id="quantidade"
                type="number"
                inputMode="numeric"
                min={QTD_MIN}
                max={QTD_MAX}
                value={quantidadeTexto}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuantidadeTexto(v);
                  const n = Number(v);
                  if (
                    v !== "" &&
                    Number.isInteger(n) &&
                    n >= QTD_MIN &&
                    n <= QTD_MAX
                  ) {
                    setQuantidade(n);
                  }
                }}
                onBlur={confirmarQuantidadeTexto}
                className="w-24 rounded-md border bg-transparent px-2 py-0.5 text-right font-heading text-2xl font-semibold tabular-nums text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-amber-400"
              />
            </div>
            <input
              type="range"
              aria-label="Quantidade de leads"
              min={10}
              max={QTD_MAX}
              step={10}
              value={quantidade}
              onChange={(e) => aplicarQuantidade(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => aplicarQuantidade(p)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    quantidade === p
                      ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Entre 1 e 200 por busca — arraste, escolha um preset ou digite o
              número. Capitais comportam ~200; cidades médias ~80.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!valido || loading}
            className="w-full"
          >
            {loading ? (
              "Iniciando varredura…"
            ) : (
              <>
                <Search className="h-4 w-4" />
                Iniciar busca
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
