import { Crown, Briefcase, PhoneCall, Stethoscope, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CargoContato } from "@/lib/supabase/types";

const CONFIG: Record<
  CargoContato,
  { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
> = {
  socio: {
    label: "Sócio",
    icon: Crown,
    style: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  gestor: {
    label: "Gestor",
    icon: Briefcase,
    style: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  recepcao: {
    label: "Recepção",
    icon: PhoneCall,
    style: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  medico: {
    label: "Médico",
    icon: Stethoscope,
    style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  outro: {
    label: "Outro",
    icon: HelpCircle,
    style: "bg-muted text-muted-foreground",
  },
};

export function CargoBadge({ cargo }: { cargo: CargoContato | null }) {
  if (!cargo) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] text-muted-foreground">
        Sem cargo
      </span>
    );
  }
  const c = CONFIG[cargo];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        c.style,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}
