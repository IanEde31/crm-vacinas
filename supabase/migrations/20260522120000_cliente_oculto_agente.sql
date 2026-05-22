-- =============================================================================
-- 7Bee Vacinas CRM — Agente do Cliente Oculto (conversa conduzida por IA)
--
-- O fluxo n8n `agente.json` conduz a conversa de cliente oculto depois do
-- disparo. Ele precisa persistir estado que a tabela `clientes_ocultos` ainda
-- não tinha — sem estas colunas as queries do fluxo falham:
--
--   1. status               — fase da conversa. A busca "cliente oculto ativo"
--                             filtra por ela; as transições são feitas pelo n8n
--                             (disparo → aguardando_resposta → em_conversa →
--                             encerrado).
--   2. mensagem_enviada     — 1ª mensagem (o disparo). O agente remonta o
--                             histórico a partir dela. Gravada pelo `diparo.json`.
--   3. motivo_encerramento  — por que a conversa terminou.
--   4. encerrado_em         — quando terminou.
--   5. analise_estruturada  — JSON completo do diagnóstico final do atendimento.
--   6. ultima_msg_id        — id da última mensagem recebida da clínica.
--                             Discriminador do debounce: quando a clínica manda
--                             várias mensagens em sequência, cada uma abre uma
--                             execução no n8n; só aquela cujo messageId continua
--                             sendo o mais recente após a espera responde — e
--                             responde sobre o lote inteiro (a transcrição já
--                             foi acumulada por todas).
--
-- RLS: a tabela já tem RLS ativo desde 20260519120001_rls.sql. Políticas são
-- row-level — colunas novas são cobertas automaticamente, nada a fazer aqui.
-- =============================================================================

alter table public.clientes_ocultos
  add column status text
    check (status in (
      'aguardando_resposta',
      'em_conversa',
      'encerrado',
      'desistido'
    )),
  add column mensagem_enviada    text,
  add column motivo_encerramento text
    check (motivo_encerramento in (
      'objetivos_cobertos',
      'limite_turnos',
      'limite_turnos_forcado',
      'clinica_desistiu',
      'desconfianca'
    )),
  add column encerrado_em        timestamptz,
  add column analise_estruturada jsonb,
  add column ultima_msg_id       text;
