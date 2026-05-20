-- =============================================================================
-- 7Bee Vacinas CRM — Buscas APIFY
--
-- Rastreia cada disparo de busca de leads via APIFY (Google Maps scraper).
-- Serve a três propósitos:
--   1. Persistir o estado do run para o polling sobreviver a reload de página.
--   2. Servir de lock de ingestão (status running -> processing -> concluida),
--      garantindo que polling e webhook não processem o mesmo run duas vezes.
--   3. Histórico de buscas exibido na página /import.
-- =============================================================================

create table public.buscas (
  id                 uuid primary key default gen_random_uuid(),
  cidade             text not null,
  estado             text not null,
  termos             text[] not null,
  quantidade         int not null check (quantidade between 1 and 200),
  apify_run_id       text,
  apify_dataset_id   text,
  status             text not null default 'running'
    check (status in ('running','processing','concluida','falhou')),
  total_encontradas  int not null default 0,
  novas              int not null default 0,
  atualizadas        int not null default 0,
  descartadas        int not null default 0,
  erro               text,
  iniciada_por       uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  concluida_em       timestamptz
);

create index buscas_recentes_idx on public.buscas (created_at desc);
create index buscas_run_idx      on public.buscas (apify_run_id) where apify_run_id is not null;

-- RLS: mesmo padrão das demais tabelas — qualquer autenticado tem acesso total.
alter table public.buscas enable row level security;

create policy "buscas_select_authenticated"
  on public.buscas for select
  to authenticated using (true);

create policy "buscas_insert_authenticated"
  on public.buscas for insert
  to authenticated with check (true);

create policy "buscas_update_authenticated"
  on public.buscas for update
  to authenticated using (true) with check (true);

create policy "buscas_delete_authenticated"
  on public.buscas for delete
  to authenticated using (true);
