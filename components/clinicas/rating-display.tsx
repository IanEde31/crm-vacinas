import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingDisplay({
  rating,
  count,
  compact = false,
}: {
  rating: number | null;
  count: number | null;
  compact?: boolean;
}) {
  if (rating === null || rating === undefined) {
    return <span className="text-xs text-muted-foreground">Sem rating</span>;
  }
  const rounded = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i <= rounded
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium tabular-nums">{rating.toFixed(1)}</span>
      {!compact && count !== null && count > 0 && (
        <span className="text-xs text-muted-foreground">
          ({count.toLocaleString("pt-BR")})
        </span>
      )}
    </div>
  );
}
