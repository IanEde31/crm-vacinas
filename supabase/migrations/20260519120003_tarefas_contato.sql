-- =============================================================================
-- 7Bee Vacinas CRM — Vínculo direto de tarefa a contato
--
-- Tarefa agora pode amarrar a: lead, clínica, contato — ou nenhum (standalone).
-- contato_id é nullable; quando setado a clínica do contato é implícita via FK
-- contatos.clinica_id, então não precisa redundância.
-- =============================================================================

alter table public.tarefas
  add column if not exists contato_id uuid references public.contatos(id) on delete cascade;

create index if not exists tarefas_contato_idx
  on public.tarefas (contato_id)
  where concluida = false and contato_id is not null;
