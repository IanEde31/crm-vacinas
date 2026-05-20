-- =============================================================================
-- 7Bee Vacinas CRM — Row Level Security
--
-- Operação inicial: 2 usuários internos com acesso total. Qualquer usuário
-- autenticado pode ler/escrever em tudo. Quando crescer o time e surgir
-- necessidade de segregar (ex.: leads por owner), refinar essas policies
-- em nova migration.
-- =============================================================================

alter table public.clinicas         enable row level security;
alter table public.contatos         enable row level security;
alter table public.leads            enable row level security;
alter table public.clientes_ocultos enable row level security;
alter table public.atividades       enable row level security;
alter table public.tarefas          enable row level security;

-- clinicas --------------------------------------------------------------------
create policy "clinicas_select_authenticated"
  on public.clinicas for select
  to authenticated using (true);

create policy "clinicas_insert_authenticated"
  on public.clinicas for insert
  to authenticated with check (true);

create policy "clinicas_update_authenticated"
  on public.clinicas for update
  to authenticated using (true) with check (true);

create policy "clinicas_delete_authenticated"
  on public.clinicas for delete
  to authenticated using (true);

-- contatos --------------------------------------------------------------------
create policy "contatos_select_authenticated"
  on public.contatos for select
  to authenticated using (true);

create policy "contatos_insert_authenticated"
  on public.contatos for insert
  to authenticated with check (true);

create policy "contatos_update_authenticated"
  on public.contatos for update
  to authenticated using (true) with check (true);

create policy "contatos_delete_authenticated"
  on public.contatos for delete
  to authenticated using (true);

-- leads -----------------------------------------------------------------------
create policy "leads_select_authenticated"
  on public.leads for select
  to authenticated using (true);

create policy "leads_insert_authenticated"
  on public.leads for insert
  to authenticated with check (true);

create policy "leads_update_authenticated"
  on public.leads for update
  to authenticated using (true) with check (true);

create policy "leads_delete_authenticated"
  on public.leads for delete
  to authenticated using (true);

-- clientes_ocultos ------------------------------------------------------------
create policy "clientes_ocultos_select_authenticated"
  on public.clientes_ocultos for select
  to authenticated using (true);

create policy "clientes_ocultos_insert_authenticated"
  on public.clientes_ocultos for insert
  to authenticated with check (true);

create policy "clientes_ocultos_update_authenticated"
  on public.clientes_ocultos for update
  to authenticated using (true) with check (true);

create policy "clientes_ocultos_delete_authenticated"
  on public.clientes_ocultos for delete
  to authenticated using (true);

-- atividades ------------------------------------------------------------------
create policy "atividades_select_authenticated"
  on public.atividades for select
  to authenticated using (true);

create policy "atividades_insert_authenticated"
  on public.atividades for insert
  to authenticated with check (true);

create policy "atividades_update_authenticated"
  on public.atividades for update
  to authenticated using (true) with check (true);

create policy "atividades_delete_authenticated"
  on public.atividades for delete
  to authenticated using (true);

-- tarefas ---------------------------------------------------------------------
create policy "tarefas_select_authenticated"
  on public.tarefas for select
  to authenticated using (true);

create policy "tarefas_insert_authenticated"
  on public.tarefas for insert
  to authenticated with check (true);

create policy "tarefas_update_authenticated"
  on public.tarefas for update
  to authenticated using (true) with check (true);

create policy "tarefas_delete_authenticated"
  on public.tarefas for delete
  to authenticated using (true);
