// Iniciais + gradiente determinístico para contatos. Paleta deslocada
// das clínicas pra dar identidade visual diferente (mais quente/violeta).

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function initialsFromName(name: string | null | undefined): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter((p) => /[A-Za-zÀ-ÿ0-9]/.test(p));
  if (parts.length === 0) return cleaned.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function gradientFromName(name: string | null | undefined): string {
  const seed = (name ?? "").trim() || "?";
  const h = hashString(seed);
  // Range concentrado em violeta/rosa/amber (260°-30° dando voltas).
  const hue1 = 250 + (h % 140);
  const hue2 = (hue1 + 30 + ((h >> 8) % 30)) % 360;
  return `linear-gradient(135deg, oklch(0.60 0.18 ${hue1}), oklch(0.50 0.20 ${hue2}))`;
}
