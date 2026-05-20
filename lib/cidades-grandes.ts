// Capitais + cidades brasileiras com mais de ~200k habitantes.
// Usado pelo cálculo de score (+20 quando a clínica está em praça grande).
// Lista hardcoded de propósito — não justifica chamada externa (ver CLAUDE.md).

/** Remove acentos e normaliza para comparação tolerante. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Conjunto de cidades grandes, já normalizadas. Capitais + maiores municípios.
const CIDADES_GRANDES = new Set(
  [
    // Capitais
    "rio branco",
    "maceio",
    "macapa",
    "manaus",
    "salvador",
    "fortaleza",
    "brasilia",
    "vitoria",
    "goiania",
    "sao luis",
    "cuiaba",
    "campo grande",
    "belo horizonte",
    "belem",
    "joao pessoa",
    "curitiba",
    "recife",
    "teresina",
    "rio de janeiro",
    "natal",
    "porto alegre",
    "porto velho",
    "boa vista",
    "florianopolis",
    "sao paulo",
    "aracaju",
    "palmas",
    // Demais municípios > 200k habitantes
    "guarulhos",
    "campinas",
    "sao goncalo",
    "duque de caxias",
    "sao bernardo do campo",
    "nova iguacu",
    "santo andre",
    "osasco",
    "sao jose dos campos",
    "jaboatao dos guararapes",
    "ribeirao preto",
    "uberlandia",
    "contagem",
    "sorocaba",
    "feira de santana",
    "joinville",
    "juiz de fora",
    "londrina",
    "aparecida de goiania",
    "niteroi",
    "ananindeua",
    "porto seguro",
    "campos dos goytacazes",
    "belford roxo",
    "caxias do sul",
    "macae",
    "santos",
    "maua",
    "sao joao de meriti",
    "betim",
    "diadema",
    "campina grande",
    "jundiai",
    "maringa",
    "montes claros",
    "carapicuiba",
    "pelotas",
    "olinda",
    "anapolis",
    "vila velha",
    "caruaru",
    "piracicaba",
    "bauru",
    "cariacica",
    "itaquaquecetuba",
    "sao vicente",
    "blumenau",
    "caucaia",
    "franca",
    "ponta grossa",
    "petrolina",
    "canoas",
    "ribeirao das neves",
    "uberaba",
    "paulista",
    "cascavel",
    "vitoria da conquista",
    "praia grande",
    "mogi das cruzes",
    "guaruja",
    "taubate",
    "limeira",
    "suzano",
    "petropolis",
    "varzea grande",
    "volta redonda",
    "santa maria",
    "gravatai",
    "novo hamburgo",
    "barueri",
    "embu das artes",
    "sao jose do rio preto",
    "marabá",
    "maraba",
    "governador valadares",
    "santarem",
    "indaiatuba",
    "ipatinga",
  ].map(normalize),
);

/**
 * Retorna true se a cidade é capital ou município grande (> ~200k hab).
 * Tolerante a acento e caixa.
 */
export function isCapitalOuGrande(cidade: string | null | undefined): boolean {
  if (!cidade) return false;
  return CIDADES_GRANDES.has(normalize(cidade));
}
