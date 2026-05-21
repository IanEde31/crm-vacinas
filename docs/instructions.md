# CRM 7Bee Vacinas

## Contexto
CRM interno para gerenciar prospecção de clínicas de vacinação.
Operação inicial: 2 usuários (eu + sócio). Pipeline de ~600 leads/mês.

## Stack obrigatória
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + DB + Realtime) — SDK direto, sem API intermediária
- @dnd-kit/core para drag & drop
- Zod para validação
- date-fns para datas (sem moment)

## Princípios
- Server Components por padrão, Client apenas onde precisa de interatividade
- Sem estado global complexo (Zustand só se necessário, prefira Server Actions)
- Mobile-friendly mas otimizado para desktop
- Dark mode opcional, padrão claro

## Schema do banco
-- Empresas/clínicas (lead bruto da APIFY)
clinicas (
  id uuid PK
  -- dados do scraping
  nome text NOT NULL
  google_place_id text UNIQUE  -- evita duplicação no re-scraping
  telefone text
  whatsapp text  -- inferido/normalizado do telefone
  endereco text
  cidade text
  estado text
  cep text
  rating numeric
  total_reviews int
  horario_funcionamento jsonb
  website text
  -- enriquecimento posterior
  cnpj text UNIQUE
  razao_social text
  porte_estimado text  -- 'pequeno'|'medio'|'grande'
  -- metadados
  fonte text DEFAULT 'apify_google_maps'
  raw_data jsonb  -- payload original do scraping, sempre guarde
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()
)

-- Contatos (tomadores de decisão e outros)
contatos (
  id uuid PK
  clinica_id uuid FK -> clinicas
  nome text
  cargo text  -- 'socio'|'gestor'|'recepcao'|'medico'|'outro'
  telefone text
  email text
  is_decisor boolean DEFAULT false
  fonte text  -- 'receita_federal'|'cliente_oculto'|'linkedin'|'manual'
  observacoes text
  created_at timestamptz DEFAULT now()
)

-- Leads = clínica + jornada comercial
-- (separar de "clinicas" permite re-prospectar no futuro)
leads (
  id uuid PK
  clinica_id uuid FK -> clinicas
  estagio text NOT NULL  -- enum abaixo
  qualificacao text  -- 'qualificado'|'nao_qualificado'|'pendente'
  motivo_desqualificacao text
  owner_id uuid FK -> auth.users
  score int DEFAULT 0  -- pra priorização (0-100)
  proxima_acao text
  proxima_acao_data timestamptz
  valor_estimado numeric DEFAULT 2300  -- MRR esperado
  probabilidade int DEFAULT 0  -- 0-100
  origem text  -- 'apify'|'indicacao'|'inbound'
  origem_detalhe text  -- ex: nome de quem indicou
  created_at timestamptz DEFAULT now()
  updated_at timestamptz DEFAULT now()
  fechado_em timestamptz
)

-- Cliente oculto (diagnóstico do atendimento da clínica)
clientes_ocultos (
  id uuid PK
  lead_id uuid FK -> leads
  enviado_em timestamptz
  primeira_resposta_em timestamptz
  tempo_resposta_minutos int  -- calculado
  respondeu boolean DEFAULT false
  tentou_agendar boolean
  fez_followup boolean
  qualidade_atendimento int  -- 1-5
  conseguiu_preco boolean
  observacoes text
  transcricao text  -- conversa completa
  created_at timestamptz DEFAULT now()
)

-- Atividades (log de tudo que aconteceu)
atividades (
  id uuid PK
  lead_id uuid FK -> leads
  tipo text  -- 'ligacao'|'whatsapp'|'email'|'reuniao'|'nota'|'mudanca_estagio'
  titulo text
  descricao text
  resultado text  -- 'sucesso'|'sem_resposta'|'reagendado'|'objecao'
  duracao_minutos int
  realizada_em timestamptz DEFAULT now()
  user_id uuid FK -> auth.users
  created_at timestamptz DEFAULT now()
)

-- Tarefas/follow-ups
tarefas (
  id uuid PK
  lead_id uuid FK -> leads
  titulo text NOT NULL
  descricao text
  prazo timestamptz
  concluida boolean DEFAULT false
  concluida_em timestamptz
  prioridade text DEFAULT 'media'  -- 'baixa'|'media'|'alta'
  owner_id uuid FK -> auth.users
  created_at timestamptz DEFAULT now()
)

## Funcionalidades MVP (nessa ordem)
1. Importação do scraping APIFY

Upload de CSV/JSON ou webhook que recebe direto da APIFY
Deduplicação por google_place_id
Cria registro em clinicas + lead automático em "Lead Bruto"

2. Kanban com drag & drop

Colunas = estágios
Cards mostram: nome da clínica, cidade, telefone, próxima ação, dias parado
Indicador visual de "lead parado": card fica amarelo após 3 dias sem atividade, vermelho após 7
Mover card = registra atividade automática "mudança de estágio"

1. Lead Bruto          (acabou de entrar do scraping)
2. Qualificado         (passou no filtro de ICP)
3. Cliente Oculto      (em diagnóstico)
4. 1º Contato          (mensagem/ligação enviada)
5. Conversa Iniciada   (respondeu, interagindo)
6. Diagnóstico Agendado (call marcada)
7. Proposta Enviada    
8. Negociação          
9. Fechado-Ganho       
10. Fechado-Perdido    
11. Nutrição           (não agora, voltar em X meses)

3. Detalhe do lead (drawer)

Aba "Visão Geral": dados da clínica + contatos + score
Aba "Atividades": timeline de tudo que aconteceu
Aba "Cliente Oculto": diagnóstico estruturado
Aba "Tarefas": follow-ups pendentes
Botão "WhatsApp": abre wa.me/{telefone} em nova aba
Botão "Ligar": tel:{telefone}

4. Filtros e busca

Por estágio, cidade, owner, score, "parados há mais de X dias"
Busca por nome de clínica

5. Dashboard simples (página inicial)

Total de leads por estágio (funil visual)
Tarefas vencendo hoje/esta semana
Leads parados (alerta)
MRR projetado (soma de valor_estimado * probabilidade dos leads ativos)

6. Registro rápido de atividade

Botão flutuante "Nova atividade" em cada card
Form rápido: tipo, resultado, observação, próxima ação

## Não fazer
- Não criar autenticação custom — usa Supabase Auth
- Não criar componentes de UI do zero — usa shadcn/ui
- Não usar Prisma — usa Supabase client direto
- Não over-engineer: MVP enxuto, funcional