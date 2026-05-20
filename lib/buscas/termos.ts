// Termos de busca disponíveis na página /radar.
// Restritos a variações que encontram clínicas de vacinação — o usuário escolhe
// um termo ou "todos". Texto livre não é exposto de propósito: evita trazer
// leads fora do ICP (farmácias, hospitais, postos de saúde).

export type TermoBusca = {
  /** Identificador estável usado no formulário. */
  id: string;
  /** Rótulo exibido ao usuário. */
  label: string;
  /** String enviada ao `searchStringsArray` da APIFY (sem acento, lowercase). */
  termo: string;
};

export const TERMOS_BUSCA: TermoBusca[] = [
  {
    id: "clinica_vacinacao",
    label: "Clínica de vacinação",
    termo: "clinica de vacinacao",
  },
  {
    id: "vacinas_particulares",
    label: "Vacinas particulares",
    termo: "vacinas particulares",
  },
  {
    id: "clinica_vacinas",
    label: "Clínica de vacinas",
    termo: "clinica de vacinas",
  },
  {
    id: "imunizacao",
    label: "Imunização",
    termo: "imunizacao",
  },
];

/** Opção especial: roda todos os termos de uma vez (dedupe garante zero duplicados). */
export const TERMO_TODOS = "todos";

/** Resolve a seleção do formulário para a lista de strings enviada à APIFY. */
export function resolverTermos(selecao: string): string[] {
  if (selecao === TERMO_TODOS) return TERMOS_BUSCA.map((t) => t.termo);
  const encontrado = TERMOS_BUSCA.find((t) => t.id === selecao);
  return encontrado ? [encontrado.termo] : [];
}

/** IDs válidos para validação Zod (inclui a opção "todos"). */
export const TERMO_IDS: [string, ...string[]] = [
  TERMO_TODOS,
  ...TERMOS_BUSCA.map((t) => t.id),
];

/** Unidades federativas do Brasil, para o <select> de estado. */
export const UFS: { sigla: string; nome: string }[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

export const UF_SIGLAS: [string, ...string[]] = [
  UFS[0].sigla,
  ...UFS.slice(1).map((u) => u.sigla),
];
