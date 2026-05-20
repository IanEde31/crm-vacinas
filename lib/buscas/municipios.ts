// Lista de municípios por UF, via API pública do IBGE (oficial, sem chave).
// Acopla cidade ↔ estado: o usuário só consegue escolher cidades que existem
// no estado selecionado, evitando buscas com localidade inválida na APIFY.

const IBGE_BASE =
  "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

type IBGEMunicipio = { nome: string };

/**
 * Lista os municípios de uma UF. Ordena alfabeticamente (pt-BR).
 * Lança em caso de erro de rede/HTTP — o chamador decide o fallback.
 */
export async function fetchMunicipios(uf: string): Promise<string[]> {
  const res = await fetch(`${IBGE_BASE}/${uf}/municipios`, {
    // Lista praticamente imutável — cacheia por 30 dias.
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!res.ok) {
    throw new Error(`IBGE retornou ${res.status} para a UF ${uf}`);
  }
  const data = (await res.json()) as IBGEMunicipio[];
  return data
    .map((m) => m.nome)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Normaliza para comparação tolerante (sem acento, minúsculo). */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** True se `cidade` consta na lista de municípios (tolerante a acento/caixa). */
export function municipioPertence(
  cidade: string,
  municipios: string[],
): boolean {
  const alvo = normalize(cidade);
  return municipios.some((m) => normalize(m) === alvo);
}
