// Webhook da APIFY — rede de segurança para a ingestão.
//
// Registrado por run em `lib/apify/client.startRun`. Garante que os leads sejam
// processados mesmo que o usuário feche o navegador antes do polling concluir.
// O lock em `processarBusca` evita corrida com o caminho de polling.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processarBusca } from "@/lib/buscas/processar";

export const maxDuration = 60;

export async function POST(req: Request) {
  const secret = process.env.APIFY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook não configurado" },
      { status: 500 },
    );
  }

  // Autenticação: header secreto definido no headersTemplate do webhook.
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  // A APIFY expõe o run em `resource.id` (e `eventData.actorRunId` conforme versão).
  const p = payload as {
    resource?: { id?: string };
    eventData?: { actorRunId?: string };
  };
  const runId = p?.resource?.id ?? p?.eventData?.actorRunId;
  if (!runId) {
    return NextResponse.json({ error: "runId ausente" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: busca } = await admin
    .from("buscas")
    .select("id, status")
    .eq("apify_run_id", runId)
    .maybeSingle();

  // Run desconhecido: responde 200 para a APIFY não reenfileirar.
  if (!busca) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Só processa se ainda não foi tratado pelo polling. O lock interno garante
  // idempotência mesmo numa corrida.
  if (busca.status === "running") {
    await processarBusca(busca.id);
  }

  return NextResponse.json({ ok: true });
}
