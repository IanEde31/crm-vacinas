// Cliente do webhook n8n que conduz a abordagem de cliente oculto.
// Sem dependência nova — só `fetch`. Espelha o padrão de lib/apify/client.ts.

/** Payload enviado ao n8n para iniciar a conversa de cliente oculto. */
export type ClienteOcultoWebhookPayload = {
  lead_id: string;
  clientes_ocultos_id: string;
  clinica: {
    nome: string;
    whatsapp: string | null;
    telefone: string | null;
    cidade: string | null;
    estado: string | null;
  };
};

export type DispararResult = { ok: true } | { ok: false; error: string };

/**
 * Janela máxima de espera pelo n8n. Curta de propósito: o disparo roda dentro
 * da Server Action que move o card no kanban — se o n8n estiver fora, o usuário
 * recebe o aviso rápido em vez de a UI travar. Um n8n saudável responde em <1s.
 */
const TIMEOUT_MS = 5_000;

/**
 * Dispara o webhook do n8n que inicia a abordagem de cliente oculto.
 *
 * Best-effort: qualquer falha (env ausente, timeout, status != 2xx) volta como
 * `{ ok: false }`. Quem chama decide o que fazer — em geral, não grava
 * `disparo_em` e mantém o disparo retentável pelo drawer.
 */
export async function dispararClienteOculto(
  payload: ClienteOcultoWebhookPayload,
): Promise<DispararResult> {
  const url = process.env.N8N_CLIENTE_OCULTO_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!url) {
    return {
      ok: false,
      error: "Webhook do n8n não configurado (N8N_CLIENTE_OCULTO_WEBHOOK_URL).",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `n8n respondeu com status ${res.status}.` };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "n8n não respondeu a tempo (timeout)." };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao contatar o n8n.",
    };
  } finally {
    clearTimeout(timer);
  }
}
