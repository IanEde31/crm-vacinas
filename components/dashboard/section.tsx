// Cabeçalho de seção do dashboard — estilo "briefing de comando".
// Número-índice em chip âmbar + título mono + régua que preenche o espaço.

export function Section({
  index,
  title,
  hint,
  action,
  delay = 0,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-5 items-center rounded bg-amber-500/15 px-1.5 font-mono text-[10px] font-bold tabular-nums text-amber-600 ring-1 ring-inset ring-amber-500/30 dark:text-amber-400">
          {index}
        </span>
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
          {title}
        </h2>
        {hint && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {hint}
          </span>
        )}
        <div className="h-px flex-1 bg-gradient-to-r from-border via-border/40 to-transparent" />
        {action}
      </div>
      {children}
    </section>
  );
}
