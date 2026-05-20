"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, Phone, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLeadForClinica } from "@/app/(dashboard)/clinicas/actions";
import type { ClinicaCard, StatusDerivado } from "@/lib/clinicas/queries";

function onlyDigits(s: string | null | undefined): string {
  return s ? s.replace(/\D/g, "") : "";
}

export function ClinicaActions({
  clinica,
  status,
  size = "sm",
}: {
  clinica: ClinicaCard;
  status: StatusDerivado;
  size?: "xs" | "sm";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingNew, setLoadingNew] = useState(false);

  const whatsapp = onlyDigits(clinica.whatsapp) || onlyDigits(clinica.telefone);
  const tel = onlyDigits(clinica.telefone);

  function openWhatsapp(e: React.MouseEvent) {
    e.stopPropagation();
    if (!whatsapp) return;
    window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener,noreferrer");
  }

  function callPhone(e: React.MouseEvent) {
    e.stopPropagation();
    if (!tel) return;
    window.location.href = `tel:${tel}`;
  }

  function openLead(e: React.MouseEvent) {
    e.stopPropagation();
    if (status.kind === "sem_prospeccao") return;
    startTransition(() => {
      router.push(`/leads?lead=${status.lead.id}`);
    });
  }

  async function startProspeccao(e: React.MouseEvent) {
    e.stopPropagation();
    setLoadingNew(true);
    const res = await createLeadForClinica({ clinica_id: clinica.id });
    setLoadingNew(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Lead criado em Lead Bruto");
    router.push(`/leads?lead=${res.lead_id}`);
  }

  const btnSize: "xs" | "sm" = size;

  return (
    <div className="flex items-center gap-1.5">
      {whatsapp && (
        <Button
          size={btnSize === "xs" ? "icon-xs" : "icon-sm"}
          variant="outline"
          onClick={openWhatsapp}
          title="Abrir WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      )}
      {tel && (
        <Button
          size={btnSize === "xs" ? "icon-xs" : "icon-sm"}
          variant="outline"
          onClick={callPhone}
          title="Ligar"
        >
          <Phone className="h-3.5 w-3.5" />
        </Button>
      )}
      {status.kind === "sem_prospeccao" ? (
        <Button
          size={btnSize}
          variant="default"
          onClick={startProspeccao}
          disabled={loadingNew}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loadingNew ? "Criando..." : "Iniciar"}
        </Button>
      ) : (
        <Button
          size={btnSize}
          variant="secondary"
          onClick={openLead}
          disabled={pending}
          className="gap-1.5"
        >
          Ver lead <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
