-- =============================================================================
-- 7Bee Vacinas CRM — Vínculo direto de tarefa a clínica
--
-- Antes: tarefas só linkavam a lead. Tarefas "soltas" (sem prospecção ativa)
-- só ficavam no contexto da página /tarefas sem amarração ao mundo real.
--
-- Agora: tarefa pode amarrar a um lead (caso usual) OU diretamente a uma
-- clínica que ainda não virou lead (ex: "ligar pra entender melhor antes
-- de prospectar"). Ambos opcionais; tarefa pode continuar sendo standalone.
-- =============================================================================

alter table public.tarefas
  add column if not exists clinica_id uuid references public.clinicas(id) on delete cascade;

create index if not exists tarefas_clinica_idx
  on public.tarefas (clinica_id)
  where concluida = false and clinica_id is not null;
