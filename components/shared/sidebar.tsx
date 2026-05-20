import Link from "next/link";
import {
  LayoutDashboard,
  KanbanSquare,
  Building2,
  Users,
  CheckSquare,
  Upload,
} from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Pipeline", icon: KanbanSquare },
  { href: "/clinicas", label: "Clínicas", icon: Building2 },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { href: "/import", label: "Importar", icon: Upload },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="border-b px-5 py-4">
        <span className="text-base font-semibold">7Bee CRM</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
