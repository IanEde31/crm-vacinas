-- =============================================================================
-- Seed: Franquias Dr. Vacina + Santa Clara Vacinas
--
-- Fonte: leads/drvacina-unidades.md (33 unidades ativas; 9 "Em breve" ignoradas
--        por não terem telefone) e leads/santaclara-unidades.md (34 unidades).
--
-- Cria:
--   - 2 registros em "redes" (slug único como guard de idempotência)
--   - 67 clínicas vinculadas (papel_na_rede = 'unidade', rede_confirmada = true)
--   - 67 leads em estágio 'qualificado' (n8n moverá para 'cliente_oculto' ao
--     disparar a mensagem de diagnóstico)
--
-- Idempotência: aborta se qualquer das redes já existir (slug ativo).
-- =============================================================================

do $$
declare
  v_drvacina   uuid;
  v_santaclara uuid;
  v_clinica_id uuid;
  r record;
begin
  if exists (
    select 1 from public.redes
    where slug in ('drvacina','santa-clara-vacinas') and deleted_at is null
  ) then
    raise notice 'Seed franquias já foi aplicado — nada a fazer.';
    return;
  end if;

  insert into public.redes (nome, slug, tipo, modelo_decisao, website, total_unidades_estimado, observacoes)
  values (
    'Dr. Vacina', 'drvacina', 'franquia', 'hibrido', 'https://drvacina.com', 42,
    'Franqueadora nacional. 33 unidades ativas + 9 em implantação na data do seed (2026-05-25). Modelo híbrido: marca centralizada, decisão operacional por franqueado.'
  )
  returning id into v_drvacina;

  insert into public.redes (nome, slug, tipo, modelo_decisao, website, total_unidades_estimado, observacoes)
  values (
    'Santa Clara Vacinas', 'santa-clara-vacinas', 'franquia', 'hibrido', null, 34,
    'Forte presença em MG/SP/GO. RT: Dr. Alessandro Ribeiro Lemos (CRM 30027). 3 unidades de São José do Rio Preto compartilham central única (17) 99160-2266.'
  )
  returning id into v_santaclara;

  -- ---------------------------------------------------------------------------
  -- Dr. Vacina — 33 unidades ativas
  -- ---------------------------------------------------------------------------
  for r in select * from (values
    ('Dr. Vacina Guarujá',              'Guarujá',              'SP', 'R. Buenos Aires, 86 – Pitangueiras',                                                    '11410-010', '(13) 3392-4892',  '(13) 99106-7152'),
    ('Dr. Vacina Guarulhos',            'Guarulhos',            'SP', 'Av. Paulo Faccini, 925, Térreo – Sala 2A – Macedo',                                     '07111-000', '(11) 4378-2054',  '(11) 91315-6868'),
    ('Dr. Vacina Indaiatuba',           'Indaiatuba',           'SP', 'Av. Eng. Fábio Roberto Barnabé, 1260 – Chácara Areal',                                  '13331-005', '(19) 99901-7730', '(19) 99901-7730'),
    ('Dr. Vacina Itu',                  'Itu',                  'SP', 'Rua Benjamim Constant, 356 – Centro',                                                   '13300-123', '(11) 2429-1761',  '(11) 93072-1122'),
    ('Dr. Vacina João Pessoa',          'João Pessoa',          'PB', 'Av. Manoel Morais, 515 – Sala 1 – Manaíra',                                             '58038-281', '(83) 99804-0076', '(83) 99804-0076'),
    ('Dr. Vacina Leme',                 'Leme',                 'SP', 'Avenida Joaquim Lopes Águila, 25 – Jardim Santa Inês, Sala 09',                         '13614-002', '(19) 3199-7046',  null),
    ('Dr. Vacina Lucas do Rio Verde',   'Lucas do Rio Verde',   'MT', 'Av. Paraná, 105 E – Sala 09 – Centro',                                                  '78455-000', '(65) 3212-6670',  null),
    ('Dr. Vacina Manaus',               'Manaus',               'AM', 'Rua Maceió, nº 385 – Sala 01, Bairro Nossa Senhora das Graças',                         null,        '(92) 99492-2211', '(92) 99492-2211'),
    ('Dr. Vacina Marabá',               'Marabá',               'PA', 'R. Paraná, S/N – Quadra 90 Lote 2A – Belo Horizonte',                                   '68503-420', '(94) 99140-8625', '(94) 99140-8625'),
    ('Dr. Vacina Maringá',              'Maringá',              'PR', 'Av. Dr. Luiz Teixeira Mendes, 903 – Zona 05',                                           '87015-000', '(44) 99107-7090', '(44) 99107-7090'),
    ('Dr. Vacina Morrinhos',            'Morrinhos',            'GO', 'Av. Dante Costa, Quadra 3, Lote 3 (Dentro da Clínica Cure)',                            null,        '(64) 99934-0108', '(64) 99934-0108'),
    ('Dr. Vacina Osasco',               'Osasco',               'SP', 'R. Nelson Camargo, 332 – Centro',                                                       '06010-070', '(11) 4558-8253',  '(11) 96316-3004'),
    ('Dr. Vacina Palmas',               'Palmas',               'TO', 'Q ACSO, SN – Avenida LO 3 – Conj 04 Lote 32 Sala 6 – Plano Diretor Sul',                '77015-036', '(63) 9940-3333',  null),
    ('Dr. Vacina Pedro Leopoldo',       'Pedro Leopoldo',       'MG', 'Rua Doutor Herbster, 245 – Centro',                                                     null,        '(31) 99501-8194', '(31) 99501-8194'),
    ('Dr. Vacina Presidente Prudente',  'Presidente Prudente',  'SP', 'Av. Antonio Canhetti, 201 – Sala 20, Jd. Cambuy',                                       '19061-545', '(18) 99794-7718', '(18) 99794-7718'),
    ('Dr. Vacina Santarém',             'Santarém',             'PA', 'Avenida Mendonça Furtado, 1730 – Sala B',                                               null,        '(93) 99110-1414', '(93) 99110-1414'),
    ('Dr. Vacina São João del-Rei',     'São João del-Rei',     'MG', 'R. Felipe Marcheti, 150 – Vila Marchetti',                                              '36307-248', '(32) 99864-9856', '(32) 99864-9856'),
    ('Dr. Vacina São Luís',             'São Luís',             'MA', 'R. das Gaivotas, 23 – Jardim Renascença, loja 02 – térreo, Galeria Slz Business',       null,        '(98) 3301-6014',  '(98) 98433-0075'),
    ('Dr. Vacina Moema',                'São Paulo',            'SP', 'Av. Moaci, 750 – Moema',                                                                '04083-002', '(11) 4327-1555',  '(11) 99167-7802'),
    ('Dr. Vacina Vila Clementino',      'São Paulo',            'SP', 'Cel. Lisboa, 675 – Vila Mariana',                                                       '04020-041', '(11) 5084-4139',  '(11) 97444-7467'),
    ('Dr. Vacina Sorocaba Olga',        'Sorocaba',             'SP', 'Shopping Olga – Av. São Paulo, 4525 – Loja 27 – Jardim Bandeirantes',                   '18013-004', '(15) 3442-6009',  '(15) 98837-9823'),
    ('Dr. Vacina Sorocaba Barão',       'Sorocaba',             'SP', 'Av. Barão de Tatuí, 994 – Jardim Vergueiro',                                            '18030-000', '(15) 3211-3466',  null),
    ('Dr. Vacina Tatuí',                'Tatuí',                'SP', 'R. do Cruzeiro, 99 – Centro',                                                           '18270-840', '(15) 3451-9900',  '(15) 99776-9900'),
    ('Dr. Vacina Teresina',             'Teresina',             'PI', 'Rua Thomaz Tajra, 1081 – Jóquei',                                                       '64051-160', '(86) 3224-4308',  '(86) 99944-1274'),
    ('Dr. Vacina Timon',                'Timon',                'MA', 'Avenida Piauí, nº 700 – Shopping Cocais, Loja 181',                                     null,        '(86) 98903-4958', '(86) 98903-4958'),
    ('Dr. Vacina Vitória',              'Vitória',              'ES', 'Av. Alziro Zarur, 180 – Loja 06 – Mata da Praia',                                       '29065-050', '(27) 99621-0574', '(27) 99621-0574'),
    ('Dr. Vacina Alphaville',           'Barueri',              'SP', 'Alameda Araguaia, 762 – Alphaville Industrial',                                         '06455-000', '(11) 91284-1012', '(11) 91284-1012'),
    ('Dr. Vacina Campinas',             'Campinas',             'SP', 'Avenida José Bonifácio, 306 – Jardim Flamboyant',                                       '13091-140', '(19) 3254-2746',  '(19) 99735-1916'),
    ('Dr. Vacina Caxias do Sul',        'Caxias do Sul',        'RS', 'Rua Olavo Bilac, 424 – Sala 3 – Rio Branco',                                            '95010-080', '(54) 3536-0109',  '(54) 99100-4143'),
    ('Dr. Vacina Chapecó',              'Chapecó',              'SC', 'R. Mal. Deodoro, 582 – Sala 3 – Centro',                                                '89801-060', '(49) 3319-9443',  '(49) 9141-5005'),
    ('Dr. Vacina Colinas',              'Colinas',              'MA', 'Av. Paraibano, 187 – Guanabara',                                                        null,        '(99) 98557-5733', '(99) 98557-5733'),
    ('Dr. Vacina Cuiabá',               'Cuiabá',               'MT', 'R. Jorn. Roberto Jaques Brunini, 4 – Jardim Europa',                                    '78065-400', '(65) 99979-5454', '(65) 99979-5454'),
    ('Dr. Vacina Curitiba',             'Curitiba',             'PR', 'R. Antônio Pietruza, 226 – Portão',                                                     '80610-320', '(41) 3085-5878',  null)
  ) as t(nome, cidade, estado, endereco, cep, telefone, whatsapp)
  loop
    insert into public.clinicas
      (nome, cidade, estado, endereco, cep, telefone, whatsapp,
       rede_id, papel_na_rede, codigo_unidade, rede_confirmada, fonte)
    values
      (r.nome, r.cidade, r.estado, r.endereco, r.cep, r.telefone, r.whatsapp,
       v_drvacina, 'unidade', r.nome, true, 'site_franqueadora')
    returning id into v_clinica_id;

    insert into public.leads (clinica_id, estagio, qualificacao, origem, origem_detalhe)
    values (v_clinica_id, 'qualificado', 'qualificado', 'inbound', 'seed_franquia_drvacina');
  end loop;

  -- ---------------------------------------------------------------------------
  -- Santa Clara Vacinas — 34 unidades
  -- ---------------------------------------------------------------------------
  for r in select * from (values
    ('Santa Clara Goiânia Shopping',                            'Goiânia',                'GO', 'Av. T10, 1.300, Piso G1, Setor Bueno – Goiânia Shopping',                                       null,        '(62) 3996-6002', '(62) 98338-3025'),
    ('Santa Clara Goiânia Oeste',                               'Goiânia',                'GO', 'Rua 22, quadra G10, lote 44, nº 239 – Setor Oeste',                                             null,        '(62) 3941-6004', '(62) 9684-4689'),
    ('Santa Clara Itumbiara',                                   'Itumbiara',              'GO', 'Rua Paranaíba, 937 – Centro',                                                                   null,        '(64) 3431-7800', null),
    ('Santa Clara Rio Verde',                                   'Rio Verde',              'GO', 'BR 060, KM 15, Piso 1, Loja 238, Jardim Campestre – Buriti Shopping',                          null,        '(64) 2104-7689', null),
    ('Santa Clara Jataí',                                       'Jataí',                  'GO', 'R. Benjamin Constant, 584 – Centro (anexo à Clínica Notre Dame)',                              null,        '(64) 3631-2243', null),
    ('Santa Clara Catalão',                                     'Catalão',                'GO', 'R. Tenente-Coronel João Cerqueira Neto, 09, Sala 01 – Mãe de Deus',                            null,        '(64) 98116-0267', '(64) 98116-0267'),
    ('Santa Clara Imperatriz',                                  'Imperatriz',             'MA', 'R. João Lisboa, 1102 – Centro',                                                                 null,        '(99) 98515-4646', '(99) 98515-4646'),
    ('Santa Clara Uberlândia Centro',                           'Uberlândia',             'MG', 'Av. Cipriano Del Fávero, nº 60 – Centro',                                                       null,        '(34) 3216-2200', null),
    ('Santa Clara Center Shopping',                             'Uberlândia',             'MG', 'Av. João Naves de Ávila, 1.331, Loja 603 – Tibery (Center Shopping)',                          null,        '(34) 3216-9899', null),
    ('Santa Clara Uberlândia Shopping',                         'Uberlândia',             'MG', 'Av. Paulo Gracindo, 15, Loja 75 – Morada da Colina (Uberlândia Shopping)',                     null,        '(34) 3210-3672', null),
    ('Santa Clara Granja Marileusa',                            'Uberlândia',             'MG', 'Av. Maria Silva Garcia, 286, Loja 59 – Villa Viseu / Granja Marileusa',                        null,        '(34) 3293-3720', null),
    ('Santa Clara Araguari',                                    'Araguari',               'MG', 'Av. Cel. Teodolino Pereira de Araújo, 1.370, Sl. 02 – Centro',                                 null,        '(34) 3246-0343', null),
    ('Santa Clara Uberaba Shopping',                            'Uberaba',                'MG', 'Av. Santa Beatriz da Silva, 1501, Loja 742 – Shopping Uberaba',                                null,        '(34) 3322-7024', '(34) 99686-8485'),
    ('Santa Clara Monte Carmelo',                               'Monte Carmelo',          'MG', 'Pç. Celso Bueno, 122 – Centro',                                                                 null,        '(34) 3819-0850', null),
    ('Santa Clara Patrocínio',                                  'Patrocínio',             'MG', 'Av. João Alves do Nascimento, 1066, Loja 02',                                                   null,        '(34) 3832-3868', '(34) 98810-7534'),
    ('Santa Clara Ituiutaba',                                   'Ituiutaba',              'MG', 'R. Vinte e Oito, 1.232 – Centro',                                                               null,        '(34) 3261-4040', null),
    ('Santa Clara Patos de Minas',                              'Patos de Minas',         'MG', 'R. Bernardes de Assis, 110 – Centro',                                                           null,        '(34) 3821-3073', null),
    ('Santa Clara Araxá',                                       'Araxá',                  'MG', 'Av. Senador Montandon, 502 – Clínica Femina',                                                   null,        '(34) 3661-1875', null),
    ('Santa Clara Pátio Vinhedos',                              'Uberlândia',             'MG', 'Av. Dos Vinhedos, 50, Loja 01 – Morada da Colina (Pátio Vinhedos)',                            null,        '(34) 3217-7403', null),
    ('Santa Clara Orlândia',                                    'Orlândia',               'SP', 'R. Três, 1.031, Sala 03 – Centro',                                                              null,        '(16) 3726-6200', null),
    ('Santa Clara Franca',                                      'Franca',                 'SP', 'R. Doutor Marrey Júnior, 2.255 – Centro',                                                       null,        '(16) 3724-2255', '(16) 99987-0050'),
    ('Santa Clara Franca CIP',                                  'Franca',                 'SP', 'R. Couto Magalhães, 1323 – Centro',                                                             null,        '(16) 3721-1321', '(16) 99698-0055'),
    ('Santa Clara Valinhos',                                    'Valinhos',               'SP', 'R. Paiquerê, 200 – Jardim Paiquere (Shopping)',                                                 '13271-600', '(19) 3327-7677', '(19) 98245-4841'),
    ('Santa Clara Ribeirão Preto Shopping Iguatemi',            'Ribeirão Preto',         'SP', 'Av. Luiz Eduardo Toledo Prado, 900, Loja 1.062-A – Vila do Golf (Shopping Iguatemi)',          null,        '(16) 3904-3630', null),
    ('Santa Clara Ribeirão Matriz',                             'Ribeirão Preto',         'SP', 'Rua Couto Magalhães, 130 – Alto da Boa Vista',                                                  '14025-690', '(16) 3236-7274', '(16) 99639-2424'),
    ('Santa Clara São Carlos',                                  'São Carlos',             'SP', 'Av. Passeio dos Flamboyants, 200 – Parque Faber Castell I',                                     null,        '(16) 3372-9296', '(16) 99644-4666'),
    ('Santa Clara São Paulo Capital',                           'São Paulo',              'SP', 'R. Itacaiúna, 61, Lj 157 Térreo – Vila Andrade (Shopping Jardim Sul)',                         null,        '(11) 3732-3337', '(11) 99503-8003'),
    ('Santa Clara Sorocaba',                                    'Sorocaba',               'SP', 'Praça Nabek Shiroma, 305 (pavimento 02), Sala 8 – Jardim Emília',                              null,        '(15) 99710-7274', '(15) 99710-7274'),
    ('Santa Clara Rio Preto Shopping Iguatemi',                 'São José do Rio Preto',  'SP', 'Av. Pres. Juscelino K. de Oliveira, 5000 – Iguatemi',                                           '15093-340', '(17) 99160-2266', '(17) 99160-2266'),
    ('Santa Clara Rio Preto Integra Saúde',                     'São José do Rio Preto',  'SP', 'R. Francisco Giglioti, 296 – Vila Santa Cândida',                                               '15091-280', '(17) 99160-2266', '(17) 99160-2266'),
    ('Santa Clara Rio Preto Rosas do Parto',                    'São José do Rio Preto',  'SP', 'Rua Dr. José Maria Rolemberg Sampaio, 165 – Nova Redentora',                                    null,        '(17) 99160-2266', '(17) 99160-2266'),
    ('Santa Clara Araraquara',                                  'Araraquara',             'SP', 'Avenida Alberto Benassi, 2270, loja 139',                                                       null,        '(16) 3319-3975', '(16) 99640-3975'),
    ('Santa Clara Campinas',                                    'Campinas',               'SP', 'Av. Iguatemi, 777, LJ 229, Expansão 2º Piso – Vila Brandina (Shopping Iguatemi)',              null,        '(19) 3255-7327', '(19) 99647-5014'),
    ('Santa Clara Ituverava',                                   'Ituverava',              'SP', 'Rua Maria Leporace, 374 – Centro',                                                              null,        '(16) 99955-0202', '(16) 99955-0202')
  ) as t(nome, cidade, estado, endereco, cep, telefone, whatsapp)
  loop
    insert into public.clinicas
      (nome, cidade, estado, endereco, cep, telefone, whatsapp,
       rede_id, papel_na_rede, codigo_unidade, rede_confirmada, fonte)
    values
      (r.nome, r.cidade, r.estado, r.endereco, r.cep, r.telefone, r.whatsapp,
       v_santaclara, 'unidade', r.nome, true, 'site_franqueadora')
    returning id into v_clinica_id;

    insert into public.leads (clinica_id, estagio, qualificacao, origem, origem_detalhe)
    values (v_clinica_id, 'qualificado', 'qualificado', 'inbound', 'seed_franquia_santa_clara');
  end loop;

  raise notice 'Seed concluído: 2 redes, 67 clínicas, 67 leads em "qualificado".';
end$$;
