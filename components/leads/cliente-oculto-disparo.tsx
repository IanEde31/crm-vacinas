"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reenviarAbordagemClienteOculto } from "@/app/(dashboard)/leads/actions";

/**
 * Estado do disparo da abordagem de cliente oculto.
 *
 * Quando um lead entra no estágio "Cliente Oculto", a Server Action dispara o
 * webhook do n8n automaticamente. Se o n8n estiver indisponível nesse momento,
 * `disparo_em` fica NULL e este componente oferece o reenvio manual.
 *
 * Renderizado pelo DrawerBody apenas quando o lead está em `cliente_oculto`.
 */
export function ClienteOcultoDisparo({
  leadId,
  disparoEm,
}: {
  leadId: string;
  disparoEm: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDisparar() {
    setLoading(true);
    const res = await reenviarAbordagemClienteOculto(leadId);
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Abordagem disparada para o n8n");
    router.refresh();
  }

  if (disparoEm) {
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 ring-1 ring-inset ring-emerald-300/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>
          Abordagem disparada para o n8n em{" "}
          <span className="font-semibold tabular-nums">
            {format(new Date(disparoEm), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-300/60 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed">
          A abordagem de cliente oculto ainda não foi disparada para o n8n —
          isso acontece quando o n8n está indisponível no momento da mudança de
          estágio.
        </p>
      </div>
      <Button
        size="sm"
        onClick={onDisparar}
        disabled={loading}
        className="w-full transition-all duration-200 ease-out"
      >
        <Send className="mr-1.5 h-3.5 w-3.5" />
        {loading ? "Disparando..." : "Disparar abordagem"}
      </Button>
    </div>
  );
}
