import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Upload, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function saudacao(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function nomeDoUsuario(email: string | null) {
  if (!email) return "time 7Bee";
  const handle = email.split("@")[0];
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}

export function DashboardHero({ userEmail }: { userEmail: string | null }) {
  const now = new Date();
  const data = format(now, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-background to-background ring-1 ring-foreground/10 dark:from-amber-950/40">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{data}</span>
          </div>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            {saudacao(now)}, {nomeDoUsuario(userEmail)}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o pulso do seu pipeline em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/radar" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Upload className="h-4 w-4" />
            Importar leads
          </Link>
          <Link href="/leads?novo=1" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="h-4 w-4" />
            Novo lead
          </Link>
        </div>
      </div>
    </div>
  );
}
