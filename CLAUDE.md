# CLAUDE.md — CRM 7Bee Vacinas

Este arquivo orienta o Claude Code durante o desenvolvimento. Leia antes de qualquer ação significativa.

## Sobre o projeto

CRM interno da **7Bee Vacinas** para gerenciar prospecção comercial de clínicas de vacinação. Operação inicial: 2 usuários. Pipeline esperado: ~600 leads/mês oriundos de scraping no Google Maps via APIFY, enriquecidos com dados de CNPJ e diagnóstico via cliente oculto.

A documentação completa de produto e estratégia está em `INSTRUCTIONS.md`. O fluxo de importação de leads via APIFY está em `apify-import.md`. Sempre consultar esses arquivos antes de tomar decisões de produto.

## Stack — não desvie sem motivo

- **Framework**: Next.js 14 App Router + TypeScript estrito
- **UI**: Tailwind CSS + shadcn/ui (instalar componentes via CLI conforme necessário)
- **Backend**: Supabase (Auth + Postgres + Realtime + Storage) — SDK direto do client, sem camada de API intermediária
- **Drag & Drop**: `@dnd-kit/core` (não usar react-beautiful-dnd, está deprecated)
- **Validação**: Zod em todo input externo (forms, parâmetros de rota, payloads de webhook)
- **Datas**: date-fns (nunca moment.js)
- **Ícones**: lucide-react
- **Deploy**: Vercel + Supabase managed

## Princípios de código

- **Server Components por padrão.** Use `"use client"` apenas onde há interatividade real (drag & drop, formulários, modais).
- **Server Actions > API Routes.** Para mutações, prefira Server Actions. API Routes só para webhooks externos (ex: APIFY) e quando houver consumidor externo.
- **Sem estado global complexo.** Server Components carregam dados; Client Components recebem via props. Zustand só se aparecer uma necessidade comprovada — não preventivamente.
- **Tipos derivados do banco.** Gere tipos com `supabase gen types typescript` e use em todo o código. Nunca crie types manuais que duplicam o schema.
- **Erros explícitos.** Toda operação que pode falhar (fetch, mutation, parse) trata erro. Nada de `any`, nada de promessa sem catch.
- **Sem over-engineering.** MVP é MVP. Abstração só nasce quando há repetição comprovada (regra do 3).

## Arquitetura de pastas

```
/app
  /(auth)/login
  /(dashboard)
    /page.tsx                 → dashboard inicial
    /leads/page.tsx           → kanban (detalhe do lead via drawer)
    /clinicas/page.tsx        → listagem (visão de base, não pipeline)
    /contatos/page.tsx        → listagem de contatos
    /tarefas/page.tsx
    /radar/page.tsx           → busca de leads via APIFY (animação de varredura)
    /radar/actions.ts         → Server Actions: iniciar/verificar busca
  /api
    /webhooks/apify/route.ts  → ingestão automática (rede de segurança)
/components
  /ui                         → shadcn/ui (não editar diretamente)
  /kanban                     → Board, Column, Card
  /leads                      → LeadDrawer, LeadTimeline, AtividadeForm
  /radar                      → BuscaForm, MapaScanner, ResultadoBusca
  /shared                     → Navbar, Sidebar, EmptyState
/lib
  /supabase
    /client.ts                → createBrowserClient
    /server.ts                → createServerClient (com cookies)
    /admin.ts                 → service role (jobs/webhook, ignora RLS)
    /types.ts                 → tipos do schema
  /scoring.ts                 → cálculo de score do lead
  /cidades-grandes.ts         → capitais/cidades grandes (insumo do score)
  /apify
    /client.ts                → REST API da APIFY (start/poll/dataset)
    /parser.ts                → normaliza payload APIFY
    /ingest.ts                → dedupe + persistência (clinicas + leads)
  /buscas                     → termos, queries, processar, municípios (IBGE)
  /utils.ts
/supabase
  /migrations                 → SQL versionado
```

## Convenções

- **Nomes em português** para entidades de negócio (clinicas, leads, atividades, tarefas) — facilita conversa com o time. **Nomes em inglês** para infra (utils, helpers, types).
- **Snake_case no banco**, **camelCase no TypeScript**. Use os tipos gerados — não tente normalizar manualmente.
- **IDs sempre uuid**, gerados pelo Postgres (`gen_random_uuid()`), nunca pelo client.
- **Timestamps sempre `timestamptz`**, nunca `timestamp` puro.
- **Soft delete**: tabelas principais (leads, clinicas, contatos) têm `deleted_at`. Toda query filtra `deleted_at IS NULL` por padrão.

## Segurança

- **RLS ativo em todas as tabelas** desde a primeira migration. Nada de "depois eu configuro".
- **Service role key nunca no client.** Só em Server Actions, API Routes e jobs.
- **Validação dupla**: Zod no client (UX) + constraints no banco (verdade). Nunca confie só no client.
- **Webhooks autenticados**: APIFY usa header secreto, validado antes de processar payload.

## Estágios do pipeline (canônico)

Use exatamente estes valores como string no campo `leads.estagio`:

```
'lead_bruto'          → recém-importado, ainda não qualificado
'qualificado'         → passou no filtro de ICP
'cliente_oculto'      → diagnóstico em andamento
'primeiro_contato'    → mensagem/ligação enviada
'conversa_iniciada'   → respondeu, em interação
'diagnostico_agendado'→ call de diagnóstico marcada
'proposta_enviada'    
'negociacao'          
'ganho'               
'perdido'             
'nutricao'            → não agora, voltar em X meses
```

Implementar como CHECK constraint na tabela. Mudança de estágio sempre gera registro em `atividades` com `tipo='mudanca_estagio'`.

## Score do lead

Função em `/lib/scoring.ts`. Recalcula quando dados relevantes mudam.

```
+20  WhatsApp confirmado e ativo
+20  Rating Google > 4.0 com 50+ reviews
+30  Cliente oculto revelou atendimento ruim (= dor real)
+20  Capital ou cidade > 200k habitantes
+10  Decisor identificado com contato direto
```

Máximo 100. Ordenação padrão do kanban: score DESC, depois updated_at DESC.

## Como trabalhar comigo

- **Antes de gerar código complexo, descreva o plano em 3-5 linhas.** Eu confirmo, você executa.
- **Uma camada por vez.** Não construa schema + auth + kanban + dashboard de uma vez. Etapa fechada, eu valido, próxima.
- **Pergunte quando houver ambiguidade real.** Não pergunte por preferências triviais (cor de botão, ordem de campos) — decida com bom senso e siga.
- **Não silencie erros.** Se algo não compila, não funciona, ou tem warning relevante, me avise antes de prosseguir.
- **Migrations são imutáveis depois de aplicadas.** Mudou estrutura? Nova migration. Nunca edite migration antiga.

## O que NÃO fazer

- Não criar autenticação custom — Supabase Auth resolve.
- Não criar componentes UI do zero quando existe equivalente no shadcn/ui.
- Não usar Prisma, Drizzle ou qualquer ORM — Supabase client é suficiente e mais direto.
- Não adicionar dependência sem justificativa. Cada `npm install` é um compromisso.
- Não criar testes nesta fase. MVP primeiro, testes quando o produto estabilizar.
- Não implementar features que estão em `INSTRUCTIONS.md` como "segunda onda" antes do MVP estar fechado.

## Checklist antes de considerar uma tarefa concluída

1. Compila sem warnings de TypeScript.
2. RLS configurado se a tarefa envolveu nova tabela.
3. Tipos do Supabase regenerados se houve mudança de schema.
4. Sem console.log esquecido.
5. Caminho feliz funciona end-to-end.
6. Pelo menos um caso de erro tratado (rede falha, dado inválido).