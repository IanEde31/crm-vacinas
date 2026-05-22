-- =============================================================================
-- 7Bee Vacinas CRM — Casamento robusto de telefone + suporte a LID do WhatsApp
--
-- Dois problemas no fluxo de cliente oculto (agente.json):
--
--   1. O webhook do WhatsApp entrega o número em formatos que NÃO batem,
--      caractere a caractere, com o que está salvo em `clinicas`: com/sem
--      código de país, com/sem o 9º dígito de celular, com formatação.
--      `fone_canonico()` reduz qualquer telefone BR a uma forma padrão —
--      DDD + os 8 últimos dígitos — absorvendo essas três diferenças.
--
--   2. O WhatsApp está migrando o endereçamento de telefone para LID
--      (Linked ID): o `remoteJid` passa a vir como "<id>@lid", um
--      identificador opaco em vez do número. A coluna `lid` guarda esse
--      identificador, aprendido na 1ª resposta da clínica, para casar a
--      conversa mesmo quando o telefone não vier no payload.
-- =============================================================================

-- Forma canônica de um telefone BR: DDD (2 dígitos) + número da linha
-- (8 últimos dígitos). IMMUTABLE — pode ser usada em índices e é cacheável.
create or replace function public.fone_canonico(fone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when length(d) >= 10
      then substr(regexp_replace(d, '^55', ''), 1, 2) || right(d, 8)
    else d
  end
  from (select regexp_replace(coalesce(fone, ''), '\D', '', 'g') as d) s;
$$;

-- Identificador LID do contato. NULL até a clínica responder pela 1ª vez.
alter table public.clientes_ocultos
  add column lid text;

create index clientes_ocultos_lid_idx
  on public.clientes_ocultos (lid) where lid is not null;
