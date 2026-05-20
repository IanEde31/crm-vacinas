-- =============================================================================
-- Seed de desenvolvimento — 7Bee Vacinas CRM
-- Popula ~10 clínicas distribuídas por estágios do pipeline.
-- owner_id é preenchido com o primeiro usuário autenticado encontrado.
-- IMPORTANTE: UUIDs usam formato RFC 4122 v4 (terceiro segmento 4xxx,
-- quarto segmento [89ab]xxx) para passar na validação Zod v4.
-- =============================================================================

do $$
declare
  v_owner_id uuid;

  -- clinicas (v4: ...4000-8000...)
  c1  uuid := 'a1000001-0000-4000-8000-000000000001';
  c2  uuid := 'a1000002-0000-4000-8000-000000000002';
  c3  uuid := 'a1000003-0000-4000-8000-000000000003';
  c4  uuid := 'a1000004-0000-4000-8000-000000000004';
  c5  uuid := 'a1000005-0000-4000-8000-000000000005';
  c6  uuid := 'a1000006-0000-4000-8000-000000000006';
  c7  uuid := 'a1000007-0000-4000-8000-000000000007';
  c8  uuid := 'a1000008-0000-4000-8000-000000000008';
  c9  uuid := 'a1000009-0000-4000-8000-000000000009';
  c10 uuid := 'a1000010-0000-4000-8000-000000000010';

  -- leads (v4: ...4000-9000...)
  l1  uuid := 'b2000001-0000-4000-9000-000000000001';
  l2  uuid := 'b2000002-0000-4000-9000-000000000002';
  l3  uuid := 'b2000003-0000-4000-9000-000000000003';
  l4  uuid := 'b2000004-0000-4000-9000-000000000004';
  l5  uuid := 'b2000005-0000-4000-9000-000000000005';
  l6  uuid := 'b2000006-0000-4000-9000-000000000006';
  l7  uuid := 'b2000007-0000-4000-9000-000000000007';
  l8  uuid := 'b2000008-0000-4000-9000-000000000008';
  l9  uuid := 'b2000009-0000-4000-9000-000000000009';
  l10 uuid := 'b2000010-0000-4000-9000-000000000010';

begin
  select id into v_owner_id from auth.users limit 1;

  -- -------------------------------------------------------------------------
  -- CLÍNICAS
  -- -------------------------------------------------------------------------
  insert into public.clinicas
    (id, nome, google_place_id, telefone, whatsapp, endereco, cidade, estado, rating, total_reviews, cnpj, porte_estimado, fonte)
  values
    (c1,  'Clínica Bem Estar Vacinas',       'ChIJaaa001', '(11) 3001-1001', '(11) 91001-1001', 'Av. Paulista, 1000, São Paulo/SP',       'São Paulo',     'SP', 4.7, 312, '11.222.333/0001-01', 'medio',   'apify_google_maps'),
    (c2,  'VacinaFácil Saúde Preventiva',    'ChIJaaa002', '(11) 3002-2002', '(11) 92002-2002', 'Rua Oscar Freire, 500, São Paulo/SP',    'São Paulo',     'SP', 3.8,  87, '22.333.444/0001-02', 'pequeno', 'apify_google_maps'),
    (c3,  'Centro de Imunização CuidarBem',  'ChIJaaa003', '(21) 3003-3003', null,              'Av. Atlântica, 200, Rio de Janeiro/RJ',  'Rio de Janeiro','RJ', 4.2, 154, '33.444.555/0001-03', 'medio',   'apify_google_maps'),
    (c4,  'Imuno+ Clínica de Vacinas',       'ChIJaaa004', '(31) 3004-4004', '(31) 94004-4004', 'Rua da Bahia, 800, Belo Horizonte/MG',  'Belo Horizonte','MG', 4.9, 521, '44.555.666/0001-04', 'grande',  'apify_google_maps'),
    (c5,  'Saúde Total Vacinas e Exames',    'ChIJaaa005', '(41) 3005-5005', '(41) 95005-5005', 'Av. Batel, 300, Curitiba/PR',           'Curitiba',      'PR', 4.1,  63, '55.666.777/0001-05', 'pequeno', 'apify_google_maps'),
    (c6,  'Clínica Prevenir é Saúde',        'ChIJaaa006', '(51) 3006-6006', '(51) 96006-6006', 'Rua Padre Chagas, 150, Porto Alegre/RS','Porto Alegre',  'RS', 2.9,  22, '66.777.888/0001-06', 'pequeno', 'apify_google_maps'),
    (c7,  'VacineJá Centro Médico',          'ChIJaaa007', '(71) 3007-7007', '(71) 97007-7007', 'Av. Tancredo Neves, 1500, Salvador/BA', 'Salvador',      'BA', 4.5, 280, '77.888.999/0001-07', 'medio',   'apify_google_maps'),
    (c8,  'Imunoclínica Fortaleza',          'ChIJaaa008', '(85) 3008-8008', '(85) 98008-8008', 'Av. Santos Dumont, 600, Fortaleza/CE',  'Fortaleza',     'CE', 4.3, 198, '88.999.000/0001-08', 'medio',   'apify_google_maps'),
    (c9,  'Vacinas & Vida Clínica',          'ChIJaaa009', '(62) 3009-9009', null,              'Rua 10, 400, Goiânia/GO',               'Goiânia',       'GO', 3.5,  41, '99.000.111/0001-09', 'pequeno', 'apify_google_maps'),
    (c10, 'ProteVac Imunização Familiar',    'ChIJaaa010', '(48) 3010-0010', '(48) 90010-0010', 'Av. Mauro Ramos, 900, Florianópolis/SC','Florianópolis', 'SC', 4.8, 405, '10.111.222/0001-10', 'grande',  'apify_google_maps')
  on conflict do nothing;

  -- -------------------------------------------------------------------------
  -- CONTATOS
  -- -------------------------------------------------------------------------
  insert into public.contatos
    (clinica_id, nome, cargo, telefone, email, is_decisor, fonte)
  values
    (c1,  'Dra. Fernanda Lima',   'socio',   '(11) 91001-9900', 'fernanda@bemestarvacinas.com.br', true,  'linkedin'),
    (c4,  'Dr. Rafael Moreira',   'socio',   '(31) 94004-8800', 'rafael@imunomais.com.br',         true,  'receita_federal'),
    (c4,  'Ana Paula Souza',      'gestor',  '(31) 94004-7700', 'ana@imunomais.com.br',            false, 'cliente_oculto'),
    (c7,  'Marcos Vinicius',      'gestor',  '(71) 97007-6600', null,                              true,  'manual'),
    (c8,  'Dra. Camila Braga',    'socio',   '(85) 98008-5500', 'camila@imunoclinica.com.br',      true,  'linkedin'),
    (c10, 'Jorge Henrique',       'socio',   '(48) 90010-4400', 'jorge@protevac.com.br',           true,  'receita_federal')
  on conflict do nothing;

  -- -------------------------------------------------------------------------
  -- LEADS (distribuídos por estágios)
  -- -------------------------------------------------------------------------
  insert into public.leads
    (id, clinica_id, estagio, qualificacao, score, owner_id, origem, valor_estimado, probabilidade, proxima_acao, proxima_acao_data)
  values
    -- lead_bruto
    (l1,  c2,  'lead_bruto',           'pendente',        10, v_owner_id, 'apify', 2300,  5,  null, null),
    (l2,  c6,  'lead_bruto',           'pendente',         5, v_owner_id, 'apify', 2300,  5,  null, null),
    -- qualificado
    (l3,  c5,  'qualificado',          'qualificado',     30, v_owner_id, 'apify', 2300, 15,  'Enviar mensagem de aquecimento', now() + interval '2 days'),
    (l4,  c9,  'qualificado',          'qualificado',     25, v_owner_id, 'apify', 2300, 15,  'Confirmar WhatsApp', now() + interval '1 day'),
    -- cliente_oculto
    (l5,  c3,  'cliente_oculto',       'qualificado',     50, v_owner_id, 'apify', 2300, 25,  'Aguardar resultado cliente oculto', now() + interval '3 days'),
    -- primeiro_contato
    (l6,  c1,  'primeiro_contato',     'qualificado',     60, v_owner_id, 'apify', 2300, 30,  'Follow-up WhatsApp', now() + interval '1 day'),
    -- conversa_iniciada
    (l7,  c7,  'conversa_iniciada',    'qualificado',     70, v_owner_id, 'apify', 2300, 45,  'Agendar call de diagnóstico', now() + interval '2 days'),
    -- proposta_enviada
    (l8,  c8,  'proposta_enviada',     'qualificado',     80, v_owner_id, 'apify', 4600, 60,  'Ligar para tirar dúvidas', now() + interval '1 day'),
    -- negociacao
    (l9,  c4,  'negociacao',           'qualificado',     90, v_owner_id, 'apify', 4600, 75,  'Enviar contrato revisado', now() + interval '3 days'),
    -- ganho
    (l10, c10, 'ganho',                'qualificado',    100, v_owner_id, 'apify', 4600, 100, null, null)
  on conflict do nothing;

  -- marca fechado_em no lead ganho
  update public.leads set fechado_em = now() - interval '5 days' where id = l10;

  -- -------------------------------------------------------------------------
  -- CLIENTES OCULTOS
  -- -------------------------------------------------------------------------
  insert into public.clientes_ocultos
    (lead_id, enviado_em, primeira_resposta_em, respondeu, tentou_agendar, fez_followup, qualidade_atendimento, conseguiu_preco, observacoes)
  values
    (l5, now() - interval '2 days', now() - interval '1 day 20 hours', true, true, false, 2, true,
     'Atendente demorou para responder. Não ofereceu alternativas de horário. Preço passado sem pacote.'),
    (l8, now() - interval '10 days', now() - interval '10 days' + interval '45 minutes', true, true, true, 3, true,
     'Atendimento razoável. Tentou agendar mas não tinha horário disponível no turno pedido.')
  on conflict do nothing;

  -- -------------------------------------------------------------------------
  -- ATIVIDADES
  -- -------------------------------------------------------------------------
  insert into public.atividades
    (lead_id, tipo, titulo, descricao, resultado, user_id, realizada_em)
  values
    -- lead l6 (primeiro_contato)
    (l6, 'whatsapp', 'Primeiro contato via WhatsApp',
     'Enviada mensagem de apresentação da 7Bee. Perguntou sobre dores com agendamento de vacinas.', 'sem_resposta', v_owner_id, now() - interval '3 days'),
    (l6, 'whatsapp', 'Follow-up #1',
     'Segunda mensagem enviada. Sem resposta ainda.', 'sem_resposta', v_owner_id, now() - interval '1 day'),

    -- lead l7 (conversa_iniciada)
    (l7, 'whatsapp', 'Primeiro contato via WhatsApp',
     'Enviada mensagem de apresentação.', 'sucesso', v_owner_id, now() - interval '7 days'),
    (l7, 'whatsapp', 'Resposta recebida',
     'Gestor respondeu com interesse. Relatou dificuldade em fidelizar pacientes pós-vacinação.', 'sucesso', v_owner_id, now() - interval '6 days'),
    (l7, 'nota', 'Dor identificada',
     'Cliente tem problema com recall de pacientes. Sem processo de reativação automática.', null, v_owner_id, now() - interval '5 days'),

    -- lead l8 (proposta_enviada)
    (l8, 'whatsapp', 'Contato inicial',
     'Mensagem enviada via WhatsApp.', 'sucesso', v_owner_id, now() - interval '15 days'),
    (l8, 'ligacao', 'Call de diagnóstico',
     'Ligação de 35 min. Identificado problema grave de atendimento no cliente oculto. Alta receptividade.', 'sucesso', v_owner_id, now() - interval '12 days'),
    (l8, 'email', 'Proposta enviada',
     'Proposta com plano mensal + onboarding enviada por e-mail. Aguardando retorno.', null, v_owner_id, now() - interval '8 days'),

    -- lead l9 (negociacao)
    (l9, 'whatsapp', 'Contato inicial', 'Mensagem de abertura.', 'sucesso', v_owner_id, now() - interval '25 days'),
    (l9, 'reuniao', 'Reunião presencial',
     'Reunião na clínica com Dr. Rafael e Ana Paula. Demonstração da plataforma. Muito interesse.', 'sucesso', v_owner_id, now() - interval '18 days'),
    (l9, 'email', 'Proposta enviada', 'Proposta para 2 unidades enviada.', null, v_owner_id, now() - interval '14 days'),
    (l9, 'ligacao', 'Negociação de contrato',
     'Dr. Rafael pediu ajuste no prazo de fidelidade de 12 para 6 meses. Em análise interna.', 'reagendado', v_owner_id, now() - interval '5 days'),

    -- lead l10 (ganho)
    (l10, 'whatsapp', 'Contato inicial', 'Mensagem de abertura.', 'sucesso', v_owner_id, now() - interval '40 days'),
    (l10, 'ligacao', 'Call de diagnóstico', 'Jorge confirmou dores claras. Produto encaixou bem.', 'sucesso', v_owner_id, now() - interval '35 days'),
    (l10, 'email', 'Proposta enviada', 'Proposta para 1 unidade.', null, v_owner_id, now() - interval '25 days'),
    (l10, 'reuniao', 'Fechamento', 'Contrato assinado. Onboarding agendado para semana que vem.', 'sucesso', v_owner_id, now() - interval '5 days')
  on conflict do nothing;

  -- -------------------------------------------------------------------------
  -- TAREFAS
  -- -------------------------------------------------------------------------
  insert into public.tarefas
    (lead_id, titulo, descricao, prazo, prioridade, owner_id)
  values
    (l6, 'Follow-up WhatsApp Bem Estar',      'Terceira tentativa de contato. Se não responder, mover para nutrição.', now() + interval '1 day',  'alta',  v_owner_id),
    (l7, 'Agendar call VacineJá',             'Propor horário para call de diagnóstico com Marcos.', now() + interval '2 days', 'alta',  v_owner_id),
    (l8, 'Ligar Imunoclínica Fortaleza',      'Tirar dúvidas sobre proposta. Perguntar se revisou com o sócio.', now() + interval '1 day',  'alta',  v_owner_id),
    (l9, 'Enviar contrato ajustado Imuno+',   'Ajustar fidelidade para 6 meses e reenviar para Dr. Rafael.', now() + interval '3 days', 'alta',  v_owner_id),
    (l3, 'Enviar aquecimento Saúde Total',    'Mensagem inicial de apresentação.', now() + interval '2 days', 'media', v_owner_id),
    (l4, 'Confirmar WhatsApp Vacinas & Vida', 'Verificar se número está ativo antes de abordar.', now() + interval '1 day',  'media', v_owner_id),
    (l5, 'Aguardar resultado cliente oculto', 'Verificar resultado do diagnóstico e qualificar lead.', now() + interval '3 days', 'media', v_owner_id)
  on conflict do nothing;

end $$;
