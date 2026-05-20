// Processamento de uma busca concluída: baixa o dataset da APIFY, ingere e
// grava os contadores. Função-job compartilhada pelo polling (verificarBusca)
// e pelo webhook. Idempotente: protegida por um lock na coluna `buscas.status`.

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDatasetItems } from "@/lib/apify/client";
import { ingestPlaces } from "@/lib/apify/ingest";
import type { ApifyPlace } from "@/lib/apify/parser";
import type { StatusBuscaResult } from "./types";

/** Marca a busca como falha, registrando a mensagem de erro. */
export async function marcarFalhaBusca(
  buscaId: string,
  erro: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("buscas")
    .update({
      status: "falhou",
      erro: erro.slice(0, 500),
      concluida_em: new Date().toISOString(),
    })
    .eq("id", buscaId);
}

/**
 * Ingere o resultado de um run concluído da APIFY.
 *
 * O lock é a transição atômica `running -> processing`: apenas o primeiro
 * chamador (polling OU webhook) consegue o UPDATE; os demais leem o estado
 * atual e retornam sem reprocessar.
 */
export async function processarBusca(
  buscaId: string,
): Promise<StatusBuscaResult> {
  const admin = createAdminClient();

  // Lock: só transiciona quem encontrar a busca ainda em 'running'.
  const { data: locked, error: lockErr } = await admin
    .from("buscas")
    .update({ status: "processing" })
    .eq("id", buscaId)
    .eq("status", "running")
    .select("id, apify_dataset_id, iniciada_por, estado")
    .maybeSingle();

  if (lockErr) {
    return { status: "falhou", erro: lockErr.message };
  }

  // Não conseguiu o lock: outro chamador já está processando ou terminou.
  if (!locked) {
    const { data: atual } = await admin
      .from("buscas")
      .select("status, erro, total_encontradas, novas, atualizadas, descartadas")
      .eq("id", buscaId)
      .single();

    if (atual?.status === "concluida") {
      return {
        status: "concluida",
        total: atual.total_encontradas,
        novas: atual.novas,
        atualizadas: atual.atualizadas,
        descartadas: atual.descartadas,
      };
    }
    if (atual?.status === "falhou") {
      return { status: "falhou", erro: atual.erro ?? "Busca falhou" };
    }
    return { status: "running", parcial: atual?.total_encontradas ?? 0 };
  }

  // Ganhou o lock: faz a ingestão.
  try {
    if (!locked.apify_dataset_id) {
      throw new Error("Busca sem dataset associado");
    }

    const items = (await getDatasetItems(
      locked.apify_dataset_id,
    )) as ApifyPlace[];
    const result = await ingestPlaces(
      admin,
      items,
      locked.iniciada_por,
      locked.estado,
    );

    await admin
      .from("buscas")
      .update({
        status: "concluida",
        total_encontradas: result.total,
        novas: result.novas,
        atualizadas: result.atualizadas,
        descartadas: result.descartadas,
        concluida_em: new Date().toISOString(),
      })
      .eq("id", buscaId);

    revalidatePath("/leads");
    revalidatePath("/clinicas");
    revalidatePath("/radar");
    revalidatePath("/");

    return {
      status: "concluida",
      total: result.total,
      novas: result.novas,
      atualizadas: result.atualizadas,
      descartadas: result.descartadas,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao processar busca";
    await marcarFalhaBusca(buscaId, msg);
    return { status: "falhou", erro: msg };
  }
}
