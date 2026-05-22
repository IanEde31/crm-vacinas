"use client";

import { PipelineSection } from "./pipeline-section";
import { ClinicaSection } from "./clinica-section";
import { ContatosSection } from "./contatos-section";
import type { LeadDetail } from "@/lib/leads/queries";

export function VisaoGeral({ data }: { data: LeadDetail }) {
  return (
    <div className="space-y-5">
      <PipelineSection data={data} />
      <ClinicaSection clinica={data.clinica} />
      {data.clinica && (
        <ContatosSection
          clinicaId={data.clinica.id}
          contatos={data.clinica.contatos}
        />
      )}
    </div>
  );
}
