// Wrapper fino sobre a REST API da APIFY. Sem dependência nova — só `fetch`.
// Actor: compass/crawler-google-places (slug na URL usa `~`, não `/`).

const ACTOR = "compass~crawler-google-places";
const BASE = "https://api.apify.com/v2";

/** Estados possíveis de um run da APIFY. */
export type ApifyRunStatus =
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "ABORTING"
  | "ABORTED"
  | "TIMING-OUT"
  | "TIMED-OUT";

export type ApifyRun = {
  id: string;
  status: ApifyRunStatus;
  defaultDatasetId: string;
};

export type RunInputParams = {
  termos: string[];
  cidade: string;
  estado: string;
  quantidade: number;
};

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN não configurado");
  return t;
}

/** Monta o input do actor a partir dos parâmetros do formulário. */
export function buildRunInput(params: RunInputParams) {
  return {
    searchStringsArray: params.termos,
    locationQuery: `${params.cidade}, ${params.estado}, Brazil`,
    maxCrawledPlacesPerSearch: params.quantidade,
    language: "pt-BR",
    scrapePlaceDetailPage: true,
    scrapeReviewsCount: 0,
    scrapeContacts: true,
    skipClosedPlaces: true,
  };
}

/**
 * Dispara um run assíncrono do actor. Se `webhookUrl` for informado, registra
 * um webhook one-shot apontando para ele no evento RUN.SUCCEEDED — rede de
 * segurança caso o usuário feche o navegador antes do polling concluir.
 */
export async function startRun(
  input: ReturnType<typeof buildRunInput>,
  webhook?: { url: string; secret: string },
): Promise<ApifyRun> {
  const params = new URLSearchParams({ token: token() });

  if (webhook) {
    const webhooks = [
      {
        eventTypes: ["ACTOR.RUN.SUCCEEDED"],
        requestUrl: webhook.url,
        headersTemplate: JSON.stringify({
          Authorization: `Bearer ${webhook.secret}`,
        }),
      },
    ];
    params.set(
      "webhooks",
      Buffer.from(JSON.stringify(webhooks)).toString("base64"),
    );
  }

  const res = await fetch(`${BASE}/acts/${ACTOR}/runs?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `APIFY: falha ao iniciar run (${res.status}): ${await res.text()}`,
    );
  }
  const json = (await res.json()) as { data: ApifyRun };
  return json.data;
}

/** Consulta o estado atual de um run. */
export async function getRun(runId: string): Promise<ApifyRun> {
  const res = await fetch(
    `${BASE}/actor-runs/${runId}?token=${token()}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`APIFY: falha ao consultar run (${res.status})`);
  }
  const json = (await res.json()) as { data: ApifyRun };
  return json.data;
}

/** Contagem parcial de itens já coletados no dataset (alimenta a animação). */
export async function getDatasetItemCount(datasetId: string): Promise<number> {
  const res = await fetch(
    `${BASE}/datasets/${datasetId}?token=${token()}`,
    { cache: "no-store" },
  );
  if (!res.ok) return 0;
  const json = (await res.json()) as { data?: { itemCount?: number } };
  return json.data?.itemCount ?? 0;
}

/** Baixa todos os itens do dataset de um run concluído. */
export async function getDatasetItems(datasetId: string): Promise<unknown[]> {
  const res = await fetch(
    `${BASE}/datasets/${datasetId}/items?clean=true&format=json&token=${token()}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`APIFY: falha ao baixar dataset (${res.status})`);
  }
  const items = (await res.json()) as unknown;
  return Array.isArray(items) ? items : [];
}
