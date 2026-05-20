-- =============================================================================
-- 7Bee Vacinas CRM — Schema inicial
-- =============================================================================

-- Extensões -------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Helpers ---------------------------------------------------------------------

-- Trigger genérico para manter updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Calcula tempo_resposta_minutos quando primeira_resposta_em é definido.
create or replace function public.calc_tempo_resposta()
returns trigger
language plpgsql
as $$
begin
  if new.primeira_resposta_em is not null and new.enviado_em is not null then
    new.tempo_resposta_minutos =
      greatest(0, extract(epoch from (new.primeira_resposta_em - new.enviado_em)) / 60)::int;
  else
    new.tempo_resposta_minutos = null;
  end if;
  return new;
end;
$$;

-- Loga mudança de estágio do lead como atividade automática.
create or replace function public.log_mudanca_estagio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.estagio is distinct from old.estagio then
    insert into public.atividades (lead_id, tipo, titulo, descricao, user_id, realizada_em)
    values (
      new.id,
      'mudanca_estagio',
      'Estágio alterado',
      format('De "%s" para "%s"', old.estagio, new.estagio),
      auth.uid(),
      now()
    );
  end if;
  return new;
end;
$$;

-- Tabelas ---------------------------------------------------------------------

-- clinicas: lead bruto da APIFY + enriquecimentos
create table public.clinicas (
  id                     uuid primary key default gen_random_uuid(),
  nome                   text not null,
  google_place_id        text unique,
  telefone               text,
  whatsapp               text,
  endereco               text,
  cidade                 text,
  estado                 text,
  cep                    text,
  rating                 numeric,
  total_reviews          int,
  horario_funcionamento  jsonb,
  website                text,
  cnpj                   text unique,
  razao_social           text,
  porte_estimado         text check (porte_estimado in ('pequeno','medio','grande')),
  fonte                  text default 'apify_google_maps',
  raw_data               jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz
);

create index clinicas_cidade_estado_idx on public.clinicas (cidade, estado) where deleted_at is null;
create index clinicas_cnpj_idx          on public.clinicas (cnpj)            where deleted_at is null;

create trigger clinicas_set_updated_at
  before update on public.clinicas
  for each row execute function public.set_updated_at();

-- contatos: tomadores de decisão e demais pessoas da clínica
create table public.contatos (
  id           uuid primary key default gen_random_uuid(),
  clinica_id   uuid not null references public.clinicas(id) on delete cascade,
  nome         text,
  cargo        text check (cargo in ('socio','gestor','recepcao','medico','outro')),
  telefone     text,
  email        text,
  is_decisor   boolean not null default false,
  fonte        text check (fonte in ('receita_federal','cliente_oculto','linkedin','manual')),
  observacoes  text,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index contatos_clinica_idx on public.contatos (clinica_id) where deleted_at is null;

-- leads: jornada comercial de uma clínica
create table public.leads (
  id                       uuid primary key default gen_random_uuid(),
  clinica_id               uuid not null references public.clinicas(id) on delete restrict,
  estagio                  text not null default 'lead_bruto'
    check (estagio in (
      'lead_bruto',
      'qualificado',
      'cliente_oculto',
      'primeiro_contato',
      'conversa_iniciada',
      'diagnostico_agendado',
      'proposta_enviada',
      'negociacao',
      'ganho',
      'perdido',
      'nutricao'
    )),
  qualificacao             text check (qualificacao in ('qualificado','nao_qualificado','pendente')),
  motivo_desqualificacao   text,
  owner_id                 uuid references auth.users(id) on delete set null,
  score                    int not null default 0 check (score between 0 and 100),
  proxima_acao             text,
  proxima_acao_data        timestamptz,
  valor_estimado           numeric not null default 2300,
  probabilidade            int not null default 0 check (probabilidade between 0 and 100),
  origem                   text check (origem in ('apify','indicacao','inbound')),
  origem_detalhe           text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  fechado_em               timestamptz,
  deleted_at               timestamptz
);

-- Ordem padrão do kanban: estagio + score desc + updated_at desc
create index leads_kanban_idx       on public.leads (estagio, score desc, updated_at desc)
  where deleted_at is null;
create index leads_owner_idx        on public.leads (owner_id)          where deleted_at is null;
create index leads_clinica_idx      on public.leads (clinica_id)        where deleted_at is null;
create index leads_proxima_acao_idx on public.leads (proxima_acao_data) where deleted_at is null and proxima_acao_data is not null;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create trigger leads_log_mudanca_estagio
  after update on public.leads
  for each row execute function public.log_mudanca_estagio();

-- clientes_ocultos: diagnóstico estruturado do atendimento
create table public.clientes_ocultos (
  id                       uuid primary key default gen_random_uuid(),
  lead_id                  uuid not null references public.leads(id) on delete cascade,
  enviado_em               timestamptz,
  primeira_resposta_em     timestamptz,
  tempo_resposta_minutos   int,
  respondeu                boolean not null default false,
  tentou_agendar           boolean,
  fez_followup             boolean,
  qualidade_atendimento    int check (qualidade_atendimento between 1 and 5),
  conseguiu_preco          boolean,
  observacoes              text,
  transcricao              text,
  created_at               timestamptz not null default now()
);

create index clientes_ocultos_lead_idx on public.clientes_ocultos (lead_id);

create trigger clientes_ocultos_calc_tempo
  before insert or update on public.clientes_ocultos
  for each row execute function public.calc_tempo_resposta();

-- atividades: log unificado de tudo que aconteceu com o lead
create table public.atividades (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  tipo            text not null check (tipo in (
    'ligacao','whatsapp','email','reuniao','nota','mudanca_estagio'
  )),
  titulo          text,
  descricao       text,
  resultado       text check (resultado in ('sucesso','sem_resposta','reagendado','objecao')),
  duracao_minutos int,
  realizada_em    timestamptz not null default now(),
  user_id         uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index atividades_lead_realizada_idx on public.atividades (lead_id, realizada_em desc);

-- tarefas: follow-ups pendentes
create table public.tarefas (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references public.leads(id) on delete cascade,
  titulo        text not null,
  descricao     text,
  prazo         timestamptz,
  concluida     boolean not null default false,
  concluida_em  timestamptz,
  prioridade    text not null default 'media' check (prioridade in ('baixa','media','alta')),
  owner_id      uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index tarefas_owner_prazo_idx on public.tarefas (owner_id, prazo) where concluida = false;
create index tarefas_lead_idx        on public.tarefas (lead_id)         where concluida = false;
