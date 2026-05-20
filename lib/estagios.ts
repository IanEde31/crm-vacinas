import type { EstagioLead } from "@/lib/supabase/types";

export const ESTAGIOS: { id: EstagioLead; label: string }[] = [
  { id: "lead_bruto", label: "Lead Bruto" },
  { id: "qualificado", label: "Qualificado" },
  { id: "cliente_oculto", label: "Cliente Oculto" },
  { id: "primeiro_contato", label: "1º Contato" },
  { id: "conversa_iniciada", label: "Conversa Iniciada" },
  { id: "diagnostico_agendado", label: "Diagnóstico Agendado" },
  { id: "proposta_enviada", label: "Proposta Enviada" },
  { id: "negociacao", label: "Negociação" },
  { id: "ganho", label: "Fechado-Ganho" },
  { id: "perdido", label: "Fechado-Perdido" },
  { id: "nutricao", label: "Nutrição" },
];

export const ESTAGIO_IDS: [EstagioLead, ...EstagioLead[]] = [
  "lead_bruto",
  "qualificado",
  "cliente_oculto",
  "primeiro_contato",
  "conversa_iniciada",
  "diagnostico_agendado",
  "proposta_enviada",
  "negociacao",
  "ganho",
  "perdido",
  "nutricao",
];

export type EstagioTheme = {
  /** Cor sólida da barra/top accent. */
  bar: string;
  /** Dot/ponto pequeno. */
  dot: string;
  /** Texto na cor do estágio (uso em counts e labels). */
  text: string;
  /** Background suave usado em pills, soft chips. */
  soft: string;
  /** Ring/borda colorida sutil. */
  ring: string;
};

export const ESTAGIO_THEME: Record<EstagioLead, EstagioTheme> = {
  lead_bruto: {
    bar: "bg-slate-400",
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-300",
    soft: "bg-slate-100 dark:bg-slate-500/15",
    ring: "ring-slate-300/60 dark:ring-slate-500/30",
  },
  qualificado: {
    bar: "bg-sky-400",
    dot: "bg-sky-400",
    text: "text-sky-700 dark:text-sky-300",
    soft: "bg-sky-100 dark:bg-sky-500/15",
    ring: "ring-sky-300/60 dark:ring-sky-500/30",
  },
  cliente_oculto: {
    bar: "bg-sky-500",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    soft: "bg-sky-100 dark:bg-sky-500/15",
    ring: "ring-sky-400/60 dark:ring-sky-500/30",
  },
  primeiro_contato: {
    bar: "bg-indigo-500",
    dot: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300",
    soft: "bg-indigo-100 dark:bg-indigo-500/15",
    ring: "ring-indigo-300/60 dark:ring-indigo-500/30",
  },
  conversa_iniciada: {
    bar: "bg-indigo-600",
    dot: "bg-indigo-600",
    text: "text-indigo-700 dark:text-indigo-300",
    soft: "bg-indigo-100 dark:bg-indigo-500/15",
    ring: "ring-indigo-400/60 dark:ring-indigo-500/30",
  },
  diagnostico_agendado: {
    bar: "bg-violet-500",
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    soft: "bg-violet-100 dark:bg-violet-500/15",
    ring: "ring-violet-300/60 dark:ring-violet-500/30",
  },
  proposta_enviada: {
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    soft: "bg-amber-100 dark:bg-amber-500/15",
    ring: "ring-amber-300/60 dark:ring-amber-500/30",
  },
  negociacao: {
    bar: "bg-amber-600",
    dot: "bg-amber-600",
    text: "text-amber-700 dark:text-amber-300",
    soft: "bg-amber-100 dark:bg-amber-500/15",
    ring: "ring-amber-400/60 dark:ring-amber-500/30",
  },
  ganho: {
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    soft: "bg-emerald-100 dark:bg-emerald-500/15",
    ring: "ring-emerald-300/60 dark:ring-emerald-500/30",
  },
  perdido: {
    bar: "bg-rose-400",
    dot: "bg-rose-400",
    text: "text-rose-700 dark:text-rose-300",
    soft: "bg-rose-100 dark:bg-rose-500/15",
    ring: "ring-rose-300/60 dark:ring-rose-500/30",
  },
  nutricao: {
    bar: "bg-zinc-400",
    dot: "bg-zinc-400",
    text: "text-zinc-600 dark:text-zinc-300",
    soft: "bg-zinc-100 dark:bg-zinc-500/15",
    ring: "ring-zinc-300/60 dark:ring-zinc-500/30",
  },
};
