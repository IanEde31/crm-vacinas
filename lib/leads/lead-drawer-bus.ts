"use client";

/**
 * Canal mínimo para abrir o drawer de um lead a partir de fora do board
 * (ex.: o botão "Novo lead" no header da página, que não compartilha estado
 * com o `KanbanBoard`).
 *
 * Por que não usar a URL: o drawer foi deliberadamente desacoplado de
 * navegação na refatoração de INP — abrir por `?lead=` reintroduziria um
 * roteamento a cada clique de card. Este pub/sub em memória mantém a abertura
 * instantânea e sem navegação.
 */

type Listener = (leadId: string) => void;

const listeners = new Set<Listener>();

/** Pede a abertura do drawer de um lead. */
export function openLeadDrawer(leadId: string): void {
  listeners.forEach((listener) => listener(leadId));
}

/** Inscreve um ouvinte (o board). Retorna a função de cancelamento. */
export function onOpenLeadDrawer(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
