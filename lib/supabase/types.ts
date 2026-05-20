// Tipos do schema public derivados das migrations.
// Quando a CLI do Supabase estiver configurada, sobrescrever via:
//   npx supabase gen types typescript --project-id vexprjykrfxpzrvjbevj --schema public > lib/supabase/types.ts

export type EstagioLead =
  | "lead_bruto"
  | "qualificado"
  | "cliente_oculto"
  | "primeiro_contato"
  | "conversa_iniciada"
  | "diagnostico_agendado"
  | "proposta_enviada"
  | "negociacao"
  | "ganho"
  | "perdido"
  | "nutricao";

export type Qualificacao = "qualificado" | "nao_qualificado" | "pendente";
export type PorteClinica = "pequeno" | "medio" | "grande";
export type CargoContato = "socio" | "gestor" | "recepcao" | "medico" | "outro";
export type FonteContato = "receita_federal" | "cliente_oculto" | "linkedin" | "manual";
export type OrigemLead = "apify" | "indicacao" | "inbound";
export type TipoAtividade =
  | "ligacao"
  | "whatsapp"
  | "email"
  | "reuniao"
  | "nota"
  | "mudanca_estagio";
export type ResultadoAtividade = "sucesso" | "sem_resposta" | "reagendado" | "objecao";
export type PrioridadeTarefa = "baixa" | "media" | "alta";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type ClinicasRow = {
  id: string;
  nome: string;
  google_place_id: string | null;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  rating: number | null;
  total_reviews: number | null;
  horario_funcionamento: Json | null;
  website: string | null;
  cnpj: string | null;
  razao_social: string | null;
  porte_estimado: PorteClinica | null;
  fonte: string | null;
  raw_data: Json | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ContatosRow = {
  id: string;
  clinica_id: string;
  nome: string | null;
  cargo: CargoContato | null;
  telefone: string | null;
  email: string | null;
  is_decisor: boolean;
  fonte: FonteContato | null;
  observacoes: string | null;
  created_at: string;
  deleted_at: string | null;
};

type LeadsRow = {
  id: string;
  clinica_id: string;
  estagio: EstagioLead;
  qualificacao: Qualificacao | null;
  motivo_desqualificacao: string | null;
  owner_id: string | null;
  score: number;
  proxima_acao: string | null;
  proxima_acao_data: string | null;
  valor_estimado: number;
  probabilidade: number;
  origem: OrigemLead | null;
  origem_detalhe: string | null;
  created_at: string;
  updated_at: string;
  fechado_em: string | null;
  deleted_at: string | null;
};

type ClientesOcultosRow = {
  id: string;
  lead_id: string;
  enviado_em: string | null;
  primeira_resposta_em: string | null;
  tempo_resposta_minutos: number | null;
  respondeu: boolean;
  tentou_agendar: boolean | null;
  fez_followup: boolean | null;
  qualidade_atendimento: number | null;
  conseguiu_preco: boolean | null;
  observacoes: string | null;
  transcricao: string | null;
  created_at: string;
};

type AtividadesRow = {
  id: string;
  lead_id: string;
  tipo: TipoAtividade;
  titulo: string | null;
  descricao: string | null;
  resultado: ResultadoAtividade | null;
  duracao_minutos: number | null;
  realizada_em: string;
  user_id: string | null;
  created_at: string;
};

type TarefasRow = {
  id: string;
  lead_id: string | null;
  clinica_id: string | null;
  contato_id: string | null;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  concluida: boolean;
  concluida_em: string | null;
  prioridade: PrioridadeTarefa;
  owner_id: string | null;
  created_at: string;
};

type TableShape<TRow, TInsertOptional extends keyof TRow> = {
  Row: TRow;
  Insert: Omit<TRow, TInsertOptional> & Partial<Pick<TRow, TInsertOptional>>;
  Update: Partial<TRow>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      clinicas: TableShape<
        ClinicasRow,
        | "id"
        | "google_place_id"
        | "telefone"
        | "whatsapp"
        | "endereco"
        | "cidade"
        | "estado"
        | "cep"
        | "rating"
        | "total_reviews"
        | "horario_funcionamento"
        | "website"
        | "cnpj"
        | "razao_social"
        | "porte_estimado"
        | "fonte"
        | "raw_data"
        | "created_at"
        | "updated_at"
        | "deleted_at"
      >;
      contatos: TableShape<
        ContatosRow,
        | "id"
        | "nome"
        | "cargo"
        | "telefone"
        | "email"
        | "is_decisor"
        | "fonte"
        | "observacoes"
        | "created_at"
        | "deleted_at"
      >;
      leads: TableShape<
        LeadsRow,
        | "id"
        | "estagio"
        | "qualificacao"
        | "motivo_desqualificacao"
        | "owner_id"
        | "score"
        | "proxima_acao"
        | "proxima_acao_data"
        | "valor_estimado"
        | "probabilidade"
        | "origem"
        | "origem_detalhe"
        | "created_at"
        | "updated_at"
        | "fechado_em"
        | "deleted_at"
      >;
      clientes_ocultos: TableShape<
        ClientesOcultosRow,
        | "id"
        | "enviado_em"
        | "primeira_resposta_em"
        | "tempo_resposta_minutos"
        | "respondeu"
        | "tentou_agendar"
        | "fez_followup"
        | "qualidade_atendimento"
        | "conseguiu_preco"
        | "observacoes"
        | "transcricao"
        | "created_at"
      >;
      atividades: TableShape<
        AtividadesRow,
        | "id"
        | "titulo"
        | "descricao"
        | "resultado"
        | "duracao_minutos"
        | "realizada_em"
        | "user_id"
        | "created_at"
      >;
      tarefas: TableShape<
        TarefasRow,
        | "id"
        | "lead_id"
        | "clinica_id"
        | "contato_id"
        | "descricao"
        | "prazo"
        | "concluida"
        | "concluida_em"
        | "prioridade"
        | "owner_id"
        | "created_at"
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
