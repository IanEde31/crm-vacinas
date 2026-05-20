// Cálculo de score do lead (0–100). Regras canônicas em CLAUDE.md.
// Recalcular sempre que dados relevantes da clínica/contatos mudarem.

import { isCapitalOuGrande } from "@/lib/cidades-grandes";

/** Subconjunto de `clinicas` necessário para o score. */
export type ScoreClinica = {
  whatsapp: string | null;
  rating: number | null;
  total_reviews: number | null;
  cidade: string | null;
  estado: string | null;
};

/** Subconjunto de `contatos` necessário para o score. */
export type ScoreContato = {
  is_decisor: boolean;
  telefone: string | null;
};

/**
 * Calcula o score do lead a partir dos dados disponíveis.
 *
 *   +20  WhatsApp confirmado e ativo
 *   +20  Rating Google > 4.0 com 50+ reviews
 *   +20  Capital ou cidade > 200k habitantes
 *   +10  Decisor identificado com contato direto
 *   +30  Cliente oculto revelou atendimento ruim (somado depois, fora daqui)
 *
 * Máximo 100.
 */
export function calcularScore(
  clinica: ScoreClinica,
  contatos: ScoreContato[] = [],
): number {
  let score = 0;

  if (clinica.whatsapp) score += 20;

  if (
    clinica.rating != null &&
    clinica.rating > 4.0 &&
    clinica.total_reviews != null &&
    clinica.total_reviews >= 50
  ) {
    score += 20;
  }

  if (isCapitalOuGrande(clinica.cidade)) score += 20;

  if (contatos.some((c) => c.is_decisor && c.telefone)) score += 10;

  return Math.min(score, 100);
}
