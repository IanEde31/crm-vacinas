import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Moeda BRL sem centavos — ex.: R$ 12.300 */
export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n)
}

/** Moeda BRL compacta — ex.: R$ 12,3 mil */
export function fmtCurrencyCompact(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}

/** Inteiro com separador de milhar pt-BR. */
export function fmtInt(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n)
}

/**
 * Variação percentual entre dois períodos, tratando bordas (base zero).
 * Retorna null quando não há base de comparação — a UI mostra "novo" / "—".
 */
export function calcDelta(
  atual: number,
  anterior: number,
): { pct: number; dir: "up" | "down" | "flat" } | null {
  if (anterior === 0) {
    if (atual === 0) return { pct: 0, dir: "flat" }
    return null // sem base anterior — comparativo não faz sentido ainda
  }
  const pct = Math.round(((atual - anterior) / anterior) * 100)
  return { pct, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" }
}
