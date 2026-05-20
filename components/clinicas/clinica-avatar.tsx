import { cn } from "@/lib/utils";
import { gradientFromName, initialsFromName } from "@/lib/clinicas/avatar";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function ClinicaAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: Size;
  className?: string;
}) {
  return (
    <div
      style={{ backgroundImage: gradientFromName(name) }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ring-1 ring-black/5",
        SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      {initialsFromName(name)}
    </div>
  );
}
