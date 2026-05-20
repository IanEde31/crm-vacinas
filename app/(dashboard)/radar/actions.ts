"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  buildRunInput,
  getDatasetItemCount,
  getRun,
  startRun,
} from "@/lib/apify/client";
import { marcarFalhaBusca, processarBusca } from "@/lib/buscas/processar";
import { fetchMunicipios, municipioPertence } from "@/lib/buscas/municipios";
import { resolverTermos, TERMO_IDS, UF_SIGLAS } from "@/lib/buscas/termos";
import type { StatusBuscaResult } from "@/lib/buscas/types";

const ufSchema = z.enum(UF_SIGLAS);

/** Lista os municípios de uma UF para popular o seletor de cidade do formulário. */
export async function listarMunicipios(uf: string): Promise<string[]> {
  const parsed = ufSchema.safeParse(uf);
  if (!parsed.success) return [];
  try {
    return await fetchMunicipios(parsed.data);
  } catch {
    return [];
  }
}

const iniciarSchema = z.object({
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.enum(UF_SIGLAS),
  termo: z.enum(TERMO_IDS),
  quantidade: z.number().int().min(1).max(200),
});

/** Config do webhook one-shot — undefined em ambiente sem URL pública. */
function webhookConfig(): { url: string; secret: string } | undefined {
  const base = process.env.APP_URL;
  const secret = process.env.APIFY_WEBHOOK_SECRET;
  if (!base || !secret) return undefined;
  return { url: `${base.replace(/\/$/, "")}/api/webhooks/apify`, secret };
}

/**
 * Dispara um run assíncrono na APIFY e registra a busca. Retorna o ID da busca
 * para o client iniciar o polling.
 */
export async function iniciarBusca(input: {
  cidade: string;
  estado: string;
  termo: string;
  quantidade: number;
}): Promise<{ buscaId: string } | { error: string }> {
  const parsed = iniciarSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { cidade, estado, termo, quantidade } = parsed.data;
  const termos = resolverTermos(termo);
  if (termos.length === 0) return { error: "Termo de busca inválido" };

  // Validação cidade ↔ estado (defesa server-side; o seletor do form já acopla
  // os dois). Se o IBGE estiver fora do ar, não bloqueia a busca.
  try {
    const municipios = await fetchMunicipios(estado);
    if (municipios.length > 0 && !municipioPertence(cidade, municipios)) {
      return {
        error: `"${cidade}" não é um município de ${estado}. Escolha uma cidade válida.`,
      };
    }
  } catch {
    // IBGE indisponível — segue com a busca.
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let run;
  try {
    run = await startRun(
      buildRunInput({ termos, cidade, estado, quantidade }),
      webhookConfig(),
    );
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao iniciar busca na APIFY",
    };
  }

  const { data, error } = await supabase
    .from("buscas")
    .insert({
      cidade,
      estado,
      termos,
      quantidade,
      apify_run_id: run.id,
      apify_dataset_id: run.defaultDatasetId,
      status: "running",
      iniciada_por: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { buscaId: data.id };
}

const verificarSchema = z.object({ buscaId: z.string().uuid() });

/**
 * Verifica o estado de uma busca (chamada em loop pelo client). Quando o run
 * da APIFY conclui, dispara a ingestão e devolve o resumo.
 */
export async function verificarBusca(input: {
  buscaId: string;
}): Promise<StatusBuscaResult> {
  const parsed = verificarSchema.safeParse(input);
  if (!parsed.success) return { status: "falhou", erro: "ID inválido" };

  const supabase = createClient();
  const { data: busca, error } = await supabase
    .from("buscas")
    .select(
      "id, status, erro, apify_run_id, apify_dataset_id, total_encontradas, novas, atualizadas, descartadas",
    )
    .eq("id", parsed.data.buscaId)
    .single();

  if (error || !busca) {
    return { status: "falhou", erro: "Busca não encontrada" };
  }

  if (busca.status === "concluida") {
    return {
      status: "concluida",
      total: busca.total_encontradas,
      novas: busca.novas,
      atualizadas: busca.atualizadas,
      descartadas: busca.descartadas,
    };
  }
  if (busca.status === "falhou") {
    return { status: "falhou", erro: busca.erro ?? "A busca falhou" };
  }
  if (busca.status === "processing") {
    // Outra chamada (poll anterior ou webhook) está ingerindo.
    return { status: "running", parcial: busca.total_encontradas };
  }

  // status === 'running' → consulta o run na APIFY.
  if (!busca.apify_run_id) {
    await marcarFalhaBusca(busca.id, "Run sem ID da APIFY");
    return { status: "falhou", erro: "Run sem ID da APIFY" };
  }

  let runStatus: string;
  let datasetId = busca.apify_dataset_id;
  try {
    const run = await getRun(busca.apify_run_id);
    runStatus = run.status;
    datasetId = run.defaultDatasetId ?? datasetId;
  } catch {
    // Erro transitório de rede — segue tentando no próximo poll.
    return { status: "running", parcial: busca.total_encontradas };
  }

  if (runStatus === "SUCCEEDED") {
    return processarBusca(busca.id);
  }
  if (
    runStatus === "FAILED" ||
    runStatus === "ABORTED" ||
    runStatus === "TIMED-OUT"
  ) {
    await marcarFalhaBusca(busca.id, `Run da APIFY terminou como ${runStatus}`);
    return { status: "falhou", erro: `A busca falhou na APIFY (${runStatus})` };
  }

  // RUNNING / READY — devolve a contagem parcial para a animação.
  let parcial = 0;
  if (datasetId) {
    try {
      parcial = await getDatasetItemCount(datasetId);
    } catch {
      parcial = 0;
    }
  }
  return { status: "running", parcial };
}
