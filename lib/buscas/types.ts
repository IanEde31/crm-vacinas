// Tipos compartilhados entre Server Actions, webhook e componentes da página.

/** Resultado de uma verificação de status de busca (polling). */
export type StatusBuscaResult =
  | { status: "running"; parcial: number }
  | {
      status: "concluida";
      total: number;
      novas: number;
      atualizadas: number;
      descartadas: number;
    }
  | { status: "falhou"; erro: string };
