-- =============================================================================
-- 7Bee Vacinas CRM — Disparo automático do Cliente Oculto
--
-- Quando um lead entra no estágio 'cliente_oculto', a Server Action dispara um
-- webhook para o n8n, que conduz a conversa (1ª mensagem + agente de IA).
-- Esta migration prepara a tabela clientes_ocultos:
--
--   1. disparo_em — marca de idempotência. Preenchida pela Server Action SÓ
--      quando o n8n confirma o recebimento do webhook. Enquanto NULL, o disparo
--      é retentável (botão no drawer). Distinta de enviado_em, que o n8n
--      preenche quando a mensagem de fato sai no WhatsApp.
--
--   2. unique (lead_id) — um diagnóstico de cliente oculto por lead. Habilita o
--      upsert por lead_id (ON CONFLICT DO NOTHING) usado tanto pela Server
--      Action quanto pelo n8n, e corrige a ausência de unicidade que permitia
--      linhas duplicadas para o mesmo lead.
-- =============================================================================

alter table public.clientes_ocultos
  add column disparo_em timestamptz;

-- Remove duplicatas pré-existentes antes de criar a constraint única: mantém
-- uma linha por lead (a de menor ctid). Em base nova/seed é no-op.
delete from public.clientes_ocultos
  where ctid not in (
    select min(ctid)
    from public.clientes_ocultos
    group by lead_id
  );

alter table public.clientes_ocultos
  add constraint clientes_ocultos_lead_id_key unique (lead_id);

-- O índice plano vira redundante — a constraint única já cria o seu próprio.
drop index if exists public.clientes_ocultos_lead_idx;
