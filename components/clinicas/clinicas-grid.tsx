import { ClinicaCardItem } from "./clinica-card";
import type { ClinicaCard } from "@/lib/clinicas/queries";

export function ClinicasGrid({ rows }: { rows: ClinicaCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((c) => (
        <ClinicaCardItem key={c.id} clinica={c} />
      ))}
    </div>
  );
}
