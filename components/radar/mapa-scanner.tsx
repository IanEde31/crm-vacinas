"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { EstadoOutline } from "@/lib/buscas/br-estados-outline";

const MENSAGENS = [
  "Vasculhando o Google Maps…",
  "Localizando clínicas de vacinação…",
  "Lendo avaliações e telefones…",
  "Cruzando endereços e horários…",
  "Descartando estabelecimentos fechados…",
  "Organizando os achados…",
];

/** Nº máximo de blips desenhados no mapa (o contador real fica no HUD). */
const MAX_BLIPS = 32;

/** Pseudo-aleatório determinístico em [0,1). */
function rand(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Parseia a string de viewBox ("x y w h"). */
function parseVB(vb: string) {
  const [x, y, w, h] = vb.trim().split(/\s+/).map(Number);
  return { x, y, w, h };
}

/** Cunha (fatia de pizza) do facho do radar, emanando do centro. */
function wedgePath(cx: number, cy: number, r: number, halfDeg: number): string {
  const a1 = (-halfDeg * Math.PI) / 180;
  const a2 = (halfDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

export function MapaScanner({
  parcial,
  alvo,
  cidade,
  estado,
}: {
  parcial: number;
  alvo: number;
  cidade: string;
  estado: string;
}) {
  const uid = useId();
  const [msgIdx, setMsgIdx] = useState(0);
  const [outline, setOutline] = useState<EstadoOutline | null>(null);
  const [blips, setBlips] = useState<{ x: number; y: number }[]>([]);
  const [centro, setCentro] = useState<{ x: number; y: number } | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  // Mensagens de status rotativas.
  useEffect(() => {
    const t = setInterval(
      () => setMsgIdx((i) => (i + 1) % MENSAGENS.length),
      2600,
    );
    return () => clearInterval(t);
  }, []);

  // Carrega (lazy) os contornos dos estados só quando a varredura aparece.
  useEffect(() => {
    let cancelado = false;
    setOutline(null);
    setBlips([]);
    setCentro(null);
    import("@/lib/buscas/br-estados-outline")
      .then((m) => {
        if (cancelado) return;
        setOutline(m.BR_ESTADOS_OUTLINE[estado.toLowerCase()] ?? null);
      })
      .catch(() => {
        /* mantém o fallback */
      });
    return () => {
      cancelado = true;
    };
  }, [estado]);

  const vb = useMemo(() => (outline ? parseVB(outline.viewBox) : null), [outline]);

  const metrics = useMemo(() => {
    if (!vb) return null;
    const minDim = Math.min(vb.w, vb.h);
    const R = minDim / 2;
    return {
      minDim,
      R,
      rings: [0.42, 0.72, 1.0].map((f) => f * R),
      sweepR: R * 1.08,
      pingBaseR: R * 0.62,
      blipR: minDim * 0.013,
      ringStroke: minDim * 0.005,
      dotGap: minDim / 18,
    };
  }, [vb]);

  // Posiciona os blips no interior real do polígono e acha o centro do radar.
  // useEffect (não layout): os contornos já carregam async, então um frame
  // extra para posicionar os blips é imperceptível — e evita warning no SSR.
  useEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl || !vb) return;

    const GRID = 18;
    const dentro: { x: number; y: number }[] = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const n = r * GRID + c;
        const px =
          vb.x + ((c + 0.5 + (rand(n * 2) - 0.5) * 0.85) / GRID) * vb.w;
        const py =
          vb.y + ((r + 0.5 + (rand(n * 2 + 1) - 0.5) * 0.85) / GRID) * vb.h;
        try {
          if (pathEl.isPointInFill(new DOMPoint(px, py))) {
            dentro.push({ x: px, y: py });
          }
        } catch {
          /* isPointInFill indisponível — segue sem blips */
        }
      }
    }

    // Centro: centro do bbox se estiver dentro; senão média dos pontos internos.
    let cx = vb.x + vb.w / 2;
    let cy = vb.y + vb.h / 2;
    let centroDentro = false;
    try {
      centroDentro = pathEl.isPointInFill(new DOMPoint(cx, cy));
    } catch {
      /* ignore */
    }
    if (!centroDentro && dentro.length > 0) {
      cx = dentro.reduce((s, p) => s + p.x, 0) / dentro.length;
      cy = dentro.reduce((s, p) => s + p.y, 0) / dentro.length;
    }
    setCentro({ x: cx, y: cy });

    // Embaralha (determinístico) e limita — blips surgem em pontos espalhados.
    const espalhados = dentro
      .map((p, i) => ({ p, k: rand(i * 7 + 3) }))
      .sort((a, b) => a.k - b.k)
      .slice(0, MAX_BLIPS)
      .map((e) => e.p);
    setBlips(espalhados);
  }, [vb]);

  const pinsVisiveis = Math.min(parcial, blips.length);
  const progresso =
    alvo > 0 ? Math.min(100, Math.round((parcial / alvo) * 100)) : 0;

  const c =
    centro ?? (vb ? { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 } : null);
  const pronto = outline && vb && metrics && c;

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl ring-1 ring-white/10"
      style={{
        minHeight: 460,
        background:
          "radial-gradient(120% 90% at 50% 0%, #1e293b 0%, #0f172a 55%, #0a0f1c 100%)",
      }}
    >
      {/* Grade pontilhada de fundo. */}
      <div
        className="animate-grid-pan absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,163,184,0.25) 1px, transparent 1.4px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute -left-10 top-12 h-48 w-64 rounded-[42%] bg-amber-400/[0.06] blur-2xl" />
      <div className="pointer-events-none absolute right-4 bottom-8 h-56 w-72 rounded-[46%] bg-emerald-400/[0.05] blur-2xl" />

      {/* Cena SVG: contorno do estado + radar recortado ao interior. */}
      {pronto ? (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={outline.viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <clipPath id={`${uid}-clip`}>
              <path d={outline.path} clipRule="evenodd" />
            </clipPath>
            <pattern
              id={`${uid}-dots`}
              width={metrics.dotGap}
              height={metrics.dotGap}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={metrics.dotGap / 2}
                cy={metrics.dotGap / 2}
                r={metrics.dotGap * 0.07}
                fill="rgba(251,191,36,0.35)"
              />
            </pattern>
            <radialGradient
              id={`${uid}-sweep`}
              gradientUnits="userSpaceOnUse"
              cx={c.x}
              cy={c.y}
              r={metrics.sweepR}
            >
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
              <stop offset="65%" stopColor="#fbbf24" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id={`${uid}-glow`}
              gradientUnits="userSpaceOnUse"
              cx={c.x}
              cy={c.y}
              r={metrics.R * 1.35}
            >
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Camadas do radar — recortadas ao interior do estado. */}
          <g clipPath={`url(#${uid}-clip)`}>
            <rect
              x={vb.x}
              y={vb.y}
              width={vb.w}
              height={vb.h}
              fill={`url(#${uid}-glow)`}
            />
            <rect
              x={vb.x}
              y={vb.y}
              width={vb.w}
              height={vb.h}
              fill={`url(#${uid}-dots)`}
            />

            {/* Anéis concêntricos. */}
            {metrics.rings.map((r, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={r}
                fill="none"
                stroke="rgba(251,191,36,0.22)"
                strokeWidth={metrics.ringStroke}
              />
            ))}

            {/* Anéis de ping. */}
            {[0, 1.3].map((delay) => (
              <circle
                key={delay}
                className="animate-radar-ping-svg"
                cx={c.x}
                cy={c.y}
                r={metrics.pingBaseR}
                fill="none"
                stroke="rgba(251,191,36,0.5)"
                strokeWidth={metrics.ringStroke}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}

            {/* Facho rotativo. */}
            <g
              className="animate-radar-sweep-svg"
              style={{ transformOrigin: `${c.x}px ${c.y}px` }}
            >
              <path
                d={wedgePath(c.x, c.y, metrics.sweepR, 32)}
                fill={`url(#${uid}-sweep)`}
              />
              <line
                x1={c.x}
                y1={c.y}
                x2={c.x + metrics.sweepR * Math.cos((32 * Math.PI) / 180)}
                y2={c.y + metrics.sweepR * Math.sin((32 * Math.PI) / 180)}
                stroke="rgba(253,230,138,0.7)"
                strokeWidth={metrics.ringStroke * 1.4}
              />
            </g>

            {/* Centro do radar. */}
            <circle
              cx={c.x}
              cy={c.y}
              r={metrics.blipR * 0.9}
              fill="#fde68a"
            />

            {/* Blips — surgem conforme a contagem parcial sobe. */}
            {blips.slice(0, pinsVisiveis).map((b, i) => (
              <g
                key={`${b.x.toFixed(1)}-${b.y.toFixed(1)}`}
                className="animate-pin-drop-svg"
                style={{ animationDelay: `${(i % 8) * 0.05}s` }}
              >
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={metrics.blipR * 2.6}
                  fill="rgba(251,191,36,0.16)"
                />
                <circle cx={b.x} cy={b.y} r={metrics.blipR} fill="#fbbf24" />
              </g>
            ))}
          </g>

          {/* Contorno do estado — por cima, nítido e brilhante. */}
          <path
            ref={pathRef}
            d={outline.path}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 5px rgba(251,191,36,0.55))" }}
          />
        </svg>
      ) : (
        /* Fallback enquanto os contornos carregam. */
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-24 w-24 animate-ping rounded-full border border-amber-400/40" />
        </div>
      )}

      {/* Lupa percorrendo o mapa. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="animate-lupa-rove">
          <div className="animate-float-soft relative grid h-16 w-16 place-items-center rounded-full bg-amber-400/10 ring-2 ring-amber-300/40 backdrop-blur-[1px]">
            <span className="absolute inset-0 rounded-full bg-amber-300/10 blur-md" />
            <Search
              className="relative h-7 w-7 text-amber-200"
              strokeWidth={2.25}
            />
          </div>
        </div>
      </div>

      {/* HUD — selo de status no topo. */}
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-widest text-amber-100/80">
          Varrendo {cidade} · {estado}
        </span>
      </div>

      {/* HUD — contador + progresso na base. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/85 to-transparent p-6 pt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-5xl font-semibold tabular-nums text-amber-50">
                {parcial}
              </span>
              <span className="text-sm text-slate-400">
                {parcial === 1 ? "clínica localizada" : "clínicas localizadas"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{MENSAGENS[msgIdx]}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-500">meta: {alvo}</span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(4, progresso)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
