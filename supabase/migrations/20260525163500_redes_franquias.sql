-- =============================================================================
-- 7Bee Vacinas CRM — Suporte a Redes / Franquias
--
-- Objetivo
-- --------
-- Permitir agrupar múltiplas unidades (clinicas) que pertencem à mesma marca,
-- franqueadora ou grupo hospitalar. Hoje cada unidade é uma linha solta em
-- "clinicas"; após esta migration, unidades podem opcionalmente apontar para
-- um registro pai em "redes".
--
-- Decisões de arquitetura
-- -----------------------
-- 1. Tabela nova "redes" como entidade pai (marca/grupo/franqueadora).
-- 2. "clinicas" recebe rede_id (nullable) + papel_na_rede + codigo_unidade.
--    Clínicas independentes continuam com rede_id NULL e papel='independente'
--    — retrocompatível com todas as queries existentes.
-- 3. Lead continua 1:1 com clinica (Opção A do desenho). Visão consolidada
--    por rede sai de JOIN. Migrar para "leads_rede" só quando aparecer a
--    primeira oportunidade real de contrato master.
-- 4. Sugestões de rede ficam em colunas dedicadas (rede_sugerida_id,
--    rede_confirmada) — auto-vínculo é proibido para evitar contaminação
--    do pipeline por falso positivo.
-- 5. RLS espelha o padrão atual: authenticated com acesso total (operação
--    inicial com 2 usuários internos).
-- =============================================================================

-- 1. Tabela "redes" ----------------------------------------------------------
create table public.redes (
  id                       uuid primary key default gen_random_uuid(),
  nome                     text not null,
  slug                     text not null,
  tipo                     text not null check (tipo in (
    'franquia',
    'rede_propria',
    'grupo_hospitalar',
    'associacao'
  )),
  modelo_decisao           text check (modelo_decisao in (
    'centralizado',
    'descentralizado',
    'hibrido'
  )),
  cnpj_raiz                text,
  website                  text,
  instagram                text,
  total_unidades_estimado  int check (total_unidades_estimado is null or total_unidades_estimado >= 0),
  diagnostico_consolidado  jsonb,
  observacoes              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  deleted_at               timestamptz
);

-- slug único entre redes ativas (permite reuso após soft delete)
create unique index redes_slug_uidx
  on public.redes (slug)
  where deleted_at is null;

-- cnpj_raiz único quando informado (rede própria com mesma matriz fiscal)
create unique index redes_cnpj_raiz_uidx
  on public.redes (cnpj_raiz)
  where cnpj_raiz is not null and deleted_at is null;

create index redes_tipo_idx on public.redes (tipo) where deleted_at is null;

create trigger redes_set_updated_at
  before update on public.redes
  for each row execute function public.set_updated_at();

comment on table public.redes is
  'Marca/franqueadora/grupo que agrupa múltiplas clinicas. NULL em clinicas.rede_id = clínica independente.';
comment on column public.redes.slug is
  'Nome normalizado (lowercase, sem acentos, sem espaços) para matching de candidatos a rede.';
comment on column public.redes.cnpj_raiz is
  'Primeiros 8 dígitos do CNPJ. Forte indicador para rede própria; franquia clássica geralmente tem CNPJs distintos por unidade.';
comment on column public.redes.modelo_decisao is
  'centralizado = vender para franqueador; descentralizado = vender unidade a unidade; hibrido = ambos.';

-- 2. Alterações em "clinicas" ------------------------------------------------
alter table public.clinicas
  add column rede_id            uuid references public.redes(id) on delete set null,
  add column papel_na_rede      text not null default 'independente'
    check (papel_na_rede in ('matriz','unidade','independente')),
  add column codigo_unidade     text,
  add column rede_sugerida_id   uuid references public.redes(id) on delete set null,
  add column rede_confirmada    boolean not null default false;

-- Coerência: se rede_id é NULL, papel obrigatoriamente 'independente';
-- se rede_id está preenchido, papel deve ser 'matriz' ou 'unidade'.
alter table public.clinicas
  add constraint clinicas_rede_papel_coerente
  check (
    (rede_id is null     and papel_na_rede = 'independente') or
    (rede_id is not null and papel_na_rede in ('matriz','unidade'))
  );

-- Não confirmar rede_id NULL como rede confirmada (constraint defensiva)
alter table public.clinicas
  add constraint clinicas_rede_confirmada_requer_rede
  check (rede_confirmada = false or rede_id is not null);

-- Só uma matriz por rede (matriz é opcional; pode existir rede só com unidades)
create unique index clinicas_uma_matriz_por_rede_uidx
  on public.clinicas (rede_id)
  where papel_na_rede = 'matriz' and deleted_at is null;

create index clinicas_rede_idx
  on public.clinicas (rede_id)
  where deleted_at is null and rede_id is not null;

create index clinicas_rede_sugerida_idx
  on public.clinicas (rede_sugerida_id)
  where deleted_at is null and rede_sugerida_id is not null and rede_confirmada = false;

comment on column public.clinicas.rede_id is
  'FK para redes. NULL = clínica independente.';
comment on column public.clinicas.papel_na_rede is
  'matriz | unidade (quando há rede_id) | independente (quando rede_id é NULL).';
comment on column public.clinicas.rede_sugerida_id is
  'Sugestão automática gerada na ingestão APIFY. Requer confirmação humana antes de virar rede_id.';
comment on column public.clinicas.rede_confirmada is
  'true quando um humano validou o vínculo com a rede. Apenas redes confirmadas devem influenciar score e relatórios.';

-- 3. RLS ---------------------------------------------------------------------
alter table public.redes enable row level security;

create policy "redes_select_authenticated"
  on public.redes for select
  to authenticated using (true);

create policy "redes_insert_authenticated"
  on public.redes for insert
  to authenticated with check (true);

create policy "redes_update_authenticated"
  on public.redes for update
  to authenticated using (true) with check (true);

create policy "redes_delete_authenticated"
  on public.redes for delete
  to authenticated using (true);
