"use client";

import { Separator } from "@/components/ui/separator";
import { PipelineSection } from "./pipeline-section";
import { ClinicaSection } from "./clinica-section";
import { ContatosSection } from "./contatos-section";
import type { LeadDetail } from "@/lib/leads/queries";

export function VisaoGeral({ data }: { data: LeadDetail }) {
  return (
    <div className="space-y-6">
      <PipelineSection data={data} />
      <Separator />
      <ClinicaSection clinica={data.clinica} />
      <Separator />
      {data.clinica && (
        <ContatosSection
          clinicaId={data.clinica.id}
          contatos={data.clinica.contatos}
        />
      )}
    </div>
  );
}
