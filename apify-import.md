# APIFY_IMPORT.md — Fluxo de Importação de Leads

Este documento define como o CRM ingere leads brutos vindos do scraping do Google Maps via APIFY. Cobre extração, normalização, deduplicação, enriquecimento e persistência.

## Visão geral do fluxo

```
APIFY (Google Maps scraper)
        │
        ▼
[Webhook] ───► /api/webhooks/apify
        │       (autentica, valida payload, enfileira)
        ▼
[Parser] ──► normaliza campos
        ▼
[Dedupe] ──► verifica google_place_id já existente
        ▼
[Persist] ──► insere/atualiza em clinicas
        ▼
[Lead] ────► cria registro em leads (estagio='lead_bruto')
        ▼
[Enrich] ──► job assíncrono busca CNPJ + sócios
        ▼
[Score] ───► calcula score inicial
```

Existem **três modos de ingestão**:

1. **Busca disparada pelo app** (página `/import`) — modo principal. O usuário
   escolhe cidade, termo e quantidade; o app inicia um run assíncrono na APIFY,
   faz polling do status e ingere o dataset ao concluir. Estado do run rastreado
   na tabela `buscas`.
2. **Webhook automático** disparado pela APIFY ao fim do run (rota
   `/api/webhooks/apify`) — registrado por run, serve de rede de segurança caso
   o polling não conclua (ex.: usuário fechou o navegador).
3. **Upload manual** de CSV/JSON exportado da APIFY — não implementado;
   substituído pelo modo 1.

> **Nota:** o run da APIFY leva minutos numa capital. Nenhum modo processa de
> forma síncrona — o app inicia o run e faz polling; o webhook é assíncrono por
> natureza. A ingestão em si (parser → dedupe → persist) é compartilhada.

## Actor APIFY recomendado

Use `compass/crawler-google-places` (mais robusto e mantido) ou `nwua9Gu5YrADL7ZDj` (Google Maps Scraper oficial da Apify).

### Configuração sugerida do run

```json
{
  "searchStringsArray": ["clinica de vacinacao"],
  "locationQuery": "Belo Horizonte, MG, Brazil",
  "maxCrawledPlacesPerSearch": 100,
  "language": "pt-BR",
  "scrapePlaceDetailPage": true,
  "scrapeReviewsCount": 0,
  "scrapeContacts": true,
  "skipClosedPlaces": true
}
```

Estratégia de cobertura: rode **um job por cidade-alvo**, com `maxCrawledPlacesPerSearch` adequado ao porte. Capitais ~200, cidades médias ~80. Não tente "Brasil inteiro" em um run só — vai dar timeout e sair caro.

### Termos de busca por cidade

Combine múltiplos para aumentar recall:
- `"clinica de vacinacao"`
- `"vacinas particulares"`
- `"clinica de vacinas"`
- `"imunizacao"`

Deduplicação por `placeId` garante que não vão entrar duplicados mesmo rodando vários termos.

## Campos do payload APIFY (mapeamento)

Payload típico de cada place (campos relevantes apenas):

```json
{
  "placeId": "ChIJ...",
  "title": "Clínica X Vacinas",
  "address": "Rua Y, 123 - Bairro, Cidade - UF, CEP",
  "city": "Belo Horizonte",
  "state": "MG",
  "postalCode": "30000-000",
  "phone": "+55 31 99999-9999",
  "phoneUnformatted": "+5531999999999",
  "website": "https://...",
  "totalScore": 4.7,
  "reviewsCount": 234,
  "openingHours": [
    {"day": "Monday", "hours": "08:00–18:00"},
    ...
  ],
  "categories": ["Clínica de vacinação"],
  "permanentlyClosed": false,
  "temporarilyClosed": false,
  "location": {"lat": -19.9, "lng": -43.9}
}
```

**Mapeamento para `clinicas`:**

| Campo APIFY | Coluna `clinicas` | Transformação |
|---|---|---|
| `placeId` | `google_place_id` | direto, é a chave de dedupe |
| `title` | `nome` | trim, title case opcional |
| `phoneUnformatted` | `telefone` | normaliza para E.164 |
| `phoneUnformatted` | `whatsapp` | mesma string se válida; valida via heurística |
| `address` | `endereco` | direto |
| `city` | `cidade` | direto |
| `state` | `estado` | direto, sigla 2 letras |
| `postalCode` | `cep` | só dígitos |
| `totalScore` | `rating` | direto |
| `reviewsCount` | `total_reviews` | direto |
| `openingHours` | `horario_funcionamento` | jsonb direto |
| `website` | `website` | direto |
| (payload completo) | `raw_data` | jsonb, **sempre preserva o original** |

## Parser (`/lib/apify/parser.ts`)

Função pura: recebe um item bruto do APIFY, retorna um objeto pronto para insert. Sem efeitos colaterais.

```typescript
export type ApifyPlace = {
  placeId: string;
  title: string;
  // ... resto do shape
};

export type ClinicaInsert = {
  google_place_id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  rating: number | null;
  total_reviews: number | null;
  horario_funcionamento: unknown;
  website: string | null;
  raw_data: unknown;
};

export function parseApifyPlace(raw: ApifyPlace): ClinicaInsert | null {
  // 1. Validação mínima — sem placeId ou nome, descarta
  if (!raw.placeId || !raw.title) return null;

  // 2. Filtra clínicas fechadas
  if (raw.permanentlyClosed || raw.temporarilyClosed) return null;

  // 3. Normaliza telefone
  const telefone = normalizePhone(raw.phoneUnformatted);

  return {
    google_place_id: raw.placeId,
    nome: raw.title.trim(),
    telefone,
    whatsapp: isLikelyWhatsApp(telefone) ? telefone : null,
    endereco: raw.address ?? null,
    cidade: raw.city ?? null,
    estado: raw.state ?? null,
    cep: raw.postalCode?.replace(/\D/g, '') ?? null,
    rating: raw.totalScore ?? null,
    total_reviews: raw.reviewsCount ?? null,
    horario_funcionamento: raw.openingHours ?? null,
    website: raw.website ?? null,
    raw_data: raw,
  };
}
```

### Normalização de telefone

```typescript
function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  // Espera DDI 55 (Brasil)
  if (digits.length === 13 && digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 10) return `+55${digits}`; // fixo
  return null; // descarta inválidos
}

function isLikelyWhatsApp(phone: string | null): boolean {
  if (!phone) return false;
  // Celular brasileiro: +55 + DDD(2) + 9 + 8 dígitos
  return /^\+55\d{2}9\d{8}$/.test(phone);
}
```

Telefone fixo **não é WhatsApp** — não tente disparar mensagem pra esses. Mas guarda como `telefone` para uso em ligação.

## Deduplicação (`/lib/apify/dedupe.ts`)

**Regra primária**: `google_place_id` é UNIQUE no banco. Conflict resolution via `ON CONFLICT`.

**Estratégia**:
- Insert novo → cria `clinicas` + cria `lead` em estágio `lead_bruto`
- Conflito de `google_place_id` → **atualiza apenas campos voláteis** (rating, total_reviews, horario_funcionamento, raw_data). Não toca em `nome`, `telefone` (podem ter sido editados manualmente). **Não cria novo lead** — clínica já está no pipeline.

```sql
INSERT INTO clinicas (...)
VALUES (...)
ON CONFLICT (google_place_id) DO UPDATE SET
  rating = EXCLUDED.rating,
  total_reviews = EXCLUDED.total_reviews,
  horario_funcionamento = EXCLUDED.horario_funcionamento,
  raw_data = EXCLUDED.raw_data,
  updated_at = now()
RETURNING id, (xmax = 0) AS inserted;
```

O `(xmax = 0)` retorna `true` se foi insert, `false` se foi update.

> **Correção (implementação real):** o `RETURNING (xmax = 0)` **não é acessível**
> via `supabase-js.upsert()` — o client não projeta `xmax`. Além disso, a chave de
> dedupe para *criar lead* não é "insert vs update da clínica", e sim "já existe
> lead ativo para esta `clinica_id`?". A implementação em `lib/apify/ingest.ts`:
> 1. `SELECT google_place_id` das clínicas do lote → conjunto pré-existente
>    (define novas vs atualizadas).
> 2. `upsert` das clínicas com `onConflict: 'google_place_id'`.
> 3. `SELECT clinica_id FROM leads WHERE clinica_id IN (...) AND deleted_at IS NULL`.
> 4. Cria lead apenas para as clínicas **sem lead ativo**.

**Regra secundária (dedupe fuzzy)**: depois do insert, rode um job de limpeza periódico que detecta duplicatas por:
- Mesmo telefone normalizado + cidade diferente
- Nome muito similar (Levenshtein < 3) + mesmo CEP

Apenas marca como suspeita, não funde automaticamente. Decisão humana.

## Fluxo de importação manual (`/import`)

UI simples:

1. Usuário escolhe arquivo (JSON ou CSV exportado do APIFY)
2. Preview mostra primeiras 10 linhas parseadas + total
3. Mostra contadores: "X novos, Y atualizações, Z descartados (inválidos/fechados)"
4. Botão "Confirmar importação"
5. Server Action processa em batch (transações de 100 em 100)
6. Tela de resultado: total importado, IDs criados, erros (se houver)

**Importante**: processa em batch, não um a um. Para 600 registros, isso é diferença de segundos vs minutos.

```typescript
// Server Action
'use server';

export async function importApifyData(rows: ApifyPlace[]) {
  const supabase = createServerClient();
  const parsed = rows.map(parseApifyPlace).filter(Boolean);

  const BATCH = 100;
  const results = { inserted: 0, updated: 0, skipped: rows.length - parsed.length };

  for (let i = 0; i < parsed.length; i += BATCH) {
    const chunk = parsed.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('clinicas')
      .upsert(chunk, { onConflict: 'google_place_id' })
      .select('id, google_place_id');

    if (error) throw error;
    // ... criar leads para os novos
  }

  return results;
}
```

## Fluxo do webhook (`/api/webhooks/apify`)

Mesma lógica do import manual, mas:
- Autentica via header `Authorization: Bearer <APIFY_WEBHOOK_SECRET>` (env var)
- Recebe o payload do "RUN.SUCCEEDED" da APIFY
- Busca o dataset do run via API APIFY (`https://api.apify.com/v2/datasets/{datasetId}/items`)
- Processa em background (Vercel cron ou Supabase Edge Function se demorar > 10s)

**Por que não fazer síncrono no webhook**: APIFY tem timeout no callback. Se você processar 500 registros no handler, ele estoura. Responda 200 rápido, processa depois.

## Enriquecimento pós-import

Depois que a clínica entra no banco, dispara dois jobs assíncronos:

### 1. Busca de CNPJ

APIs gratuitas com rate limit:
- **CNPJa** (https://cnpja.com) — 3 req/min no free
- **BrasilAPI** (https://brasilapi.com.br/api/cnpj/v1/{cnpj}) — gratuita, mas só consulta por CNPJ já conhecido
- **CNPJ.ws** — similar

**Problema**: você tem nome + endereço, não CNPJ. Soluções:
- Busca reversa via Receita Federal (não tem API pública direta; existem agregadores pagos como Casa dos Dados, Speedio)
- Inferência: scrape o site da clínica (se tiver `website`) procurando padrão de CNPJ no rodapé
- Cliente oculto: pede nota fiscal e captura o CNPJ

Para MVP: **deixa o campo CNPJ vazio e marca pra enriquecimento manual.** Não trava o pipeline por causa disso.

### 2. Busca de sócios (QSA)

Quando tiver CNPJ, busca o Quadro de Sócios via BrasilAPI ou CNPJa. Insere em `contatos` com `cargo='socio'` e `fonte='receita_federal'`. **Aviso**: sócio na receita ≠ decisor operacional. Marca `is_decisor=false` por padrão, ajusta manual quando confirmar.

## Cálculo de score após import

Roda imediatamente após criar o lead. Função em `/lib/scoring.ts`:

```typescript
export function calcularScore(clinica: Clinica, contatos: Contato[]): number {
  let score = 0;
  if (clinica.whatsapp) score += 20;
  if (clinica.rating && clinica.rating > 4.0 && clinica.total_reviews && clinica.total_reviews >= 50) score += 20;
  if (isCapitalOuGrande(clinica.cidade, clinica.estado)) score += 20;
  if (contatos.some(c => c.is_decisor && c.telefone)) score += 10;
  // +30 do cliente oculto vem depois, quando ele for executado
  return Math.min(score, 100);
}
```

Lista de capitais e cidades > 200k habitantes pode ser hardcoded em arquivo `lib/cidades-grandes.ts` (não justifica chamada externa).

## Tratamento de erros

Em qualquer ponto do pipeline:

- **Erro de parse** (campo obrigatório ausente): loga, descarta, conta como "skipped". Não falha o batch.
- **Erro de DB** (constraint violation inesperada): falha o batch, retorna detalhe pro user. Não tente "consertar" no client.
- **Erro no enriquecimento** (API CNPJ fora do ar): não bloqueia o lead. Marca `enriquecimento_pendente=true` e tenta de novo via cron.

**Sempre preserve o `raw_data`.** Se algo der errado depois, você consegue reparar sem refazer o scraping (que custa $$ no APIFY).

## Limites e custos a ter em mente

- APIFY Google Maps scraper: ~$1 por 1000 places. Para 600 leads/mês ≈ $0.60. Não é o gargalo.
- Run de capital grande (200 places com detalhe): ~3-5 minutos.
- BrasilAPI CNPJ: free, mas rate limit não documentado. Throttle a 1 req/segundo por segurança.

## Checklist de validação do import

Antes de considerar um batch importado com sucesso:

1. Contagem de inseridos + atualizados + descartados = total enviado
2. Todo lead novo tem clínica associada (FK não nula)
3. Todo lead novo está em `estagio='lead_bruto'`
4. Score foi calculado (não null, não zero por bug)
5. `raw_data` preservado em todos os registros
6. Nenhum telefone foi inserido em formato não-E.164

## Roadmap de evolução (não fazer agora)

- Integração com Casa dos Dados ou Speedio para CNPJ por nome+cidade
- Scraping do Instagram da clínica via APIFY (engajamento como sinal de porte)
- Detecção automática de "clínica grande" via Google Places features (`priceLevel`, fotos, posts)
- Re-scraping incremental: roda mensalmente apenas em clínicas em `nutricao` para atualizar dados