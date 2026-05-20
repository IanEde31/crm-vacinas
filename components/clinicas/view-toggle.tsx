"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "cards" | "table";

export function ViewToggle({ current }: { current: ViewMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function set(mode: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "cards") params.delete("view");
    else params.set("view", mode);
    const q = params.toString();
    router.replace(`/clinicas${q ? `?${q}` : ""}`, { scroll: false });
  }

  return (
    <div className="inline-flex rounded-md border bg-background p-0.5">
      <ToggleButton active={current === "cards"} onClick={() => set("cards")} label="Cards">
        <LayoutGrid className="h-3.5 w-3.5" />
      </ToggleButton>
      <ToggleButton active={current === "table"} onClick={() => set("table")} label="Tabela">
        <Rows3 className="h-3.5 w-3.5" />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-7 gap-1.5 rounded-sm px-2",
        active && "bg-muted text-foreground",
      )}
      aria-pressed={active}
      title={label}
    >
      {children}
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}
