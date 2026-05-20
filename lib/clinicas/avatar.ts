// Deriva iniciais e gradient baseado no nome — visual consistente por clínica.

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function initialsFromName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter((p) => /[A-Za-zÀ-ÿ0-9]/.test(p));
  if (parts.length === 0) return cleaned.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function gradientFromName(name: string): string {
  const h = hashString(name);
  const hue1 = h % 360;
  const hue2 = (hue1 + 35 + (h >> 8) % 50) % 360;
  return `linear-gradient(135deg, oklch(0.62 0.16 ${hue1}), oklch(0.52 0.18 ${hue2}))`;
}
