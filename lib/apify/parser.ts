// Parser puro: recebe um item bruto do APIFY, devolve um objeto pronto para
// insert em `clinicas` — ou null se inválido. Sem efeitos colaterais.

import type { Database } from "@/lib/supabase/types";

export type ClinicaInsert = Database["public"]["Tables"]["clinicas"]["Insert"];

/** Shape parcial de um place retornado pelo actor compass/crawler-google-places. */
export type ApifyPlace = {
  placeId?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  phoneUnformatted?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  openingHours?: unknown;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  [key: string]: unknown;
};

/** Normaliza telefone brasileiro para E.164 (+55...). Descarta inválidos. */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 10) return `+55${digits}`; // fixo
  return null;
}

/** Heurística: celular brasileiro (+55 DDD 9 + 8 dígitos) provavelmente tem WhatsApp. */
export function isLikelyWhatsApp(phone: string | null): boolean {
  if (!phone) return false;
  return /^\+55\d{2}9\d{8}$/.test(phone);
}

/**
 * Converte um place bruto da APIFY no objeto de insert de `clinicas`.
 * Retorna null para registros sem identificação ou de clínicas fechadas.
 *
 * @param raw  item bruto do dataset da APIFY.
 * @param uf   sigla de 2 letras da busca. Tem prioridade sobre `raw.state` —
 *             a APIFY pode devolver o estado por extenso, e o resto do app
 *             (filtros, selects) trata `clinicas.estado` como sigla.
 */
export function parseApifyPlace(
  raw: ApifyPlace,
  uf?: string,
): ClinicaInsert | null {
  // 1. Validação mínima — sem placeId ou nome, descarta.
  if (!raw.placeId || !raw.title) return null;

  // 2. Filtra clínicas fechadas.
  if (raw.permanentlyClosed || raw.temporarilyClosed) return null;

  // 3. Normaliza telefone.
  const telefone = normalizePhone(raw.phoneUnformatted ?? raw.phone);

  return {
    google_place_id: raw.placeId,
    nome: raw.title.trim(),
    telefone,
    whatsapp: isLikelyWhatsApp(telefone) ? telefone : null,
    endereco: raw.address ?? null,
    cidade: raw.city ?? null,
    estado: uf ?? raw.state ?? null,
    cep: raw.postalCode?.replace(/\D/g, "") ?? null,
    rating: raw.totalScore ?? null,
    total_reviews: raw.reviewsCount ?? null,
    horario_funcionamento:
      (raw.openingHours as ClinicaInsert["horario_funcionamento"]) ?? null,
    website: raw.website ?? null,
    fonte: "apify_google_maps",
    raw_data: raw as unknown as ClinicaInsert["raw_data"],
  };
}
