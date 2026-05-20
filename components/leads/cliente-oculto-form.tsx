"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertClienteOculto } from "@/app/(dashboard)/leads/actions";
import type { LeadDetail } from "@/lib/leads/queries";

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function ClienteOcultoForm({
  leadId,
  existing,
}: {
  leadId: string;
  existing: LeadDetail["cliente_oculto"];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [respondeu, setRespondeu] = useState<boolean>(existing?.respondeu ?? false);
  const [tentouAgendar, setTentouAgendar] = useState<boolean>(
    existing?.tentou_agendar ?? false,
  );
  const [fezFollowup, setFezFollowup] = useState<boolean>(existing?.fez_followup ?? false);
  const [conseguiuPreco, setConseguiuPreco] = useState<boolean>(
    existing?.conseguiu_preco ?? false,
  );
  const [qualidade, setQualidade] = useState<string>(
    existing?.qualidade_atendimento ? String(existing.qualidade_atendimento) : "",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await upsertClienteOculto({
      id: existing?.id,
      lead_id: leadId,
      enviado_em: (fd.get("enviado_em") as string) || undefined,
      primeira_resposta_em: (fd.get("primeira_resposta_em") as string) || undefined,
      respondeu,
      tentou_agendar: tentouAgendar,
      fez_followup: fezFollowup,
      qualidade_atendimento: qualidade ? Number(qualidade) : null,
      conseguiu_preco: conseguiuPreco,
      observacoes: (fd.get("observacoes") as string) || undefined,
      transcricao: (fd.get("transcricao") as string) || undefined,
    });
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Diagnóstico salvo");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="enviado_em">Enviado em</Label>
          <Input
            id="enviado_em"
            name="enviado_em"
            type="datetime-local"
            defaultValue={toLocalInput(existing?.enviado_em)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="primeira_resposta_em">Primeira resposta em</Label>
          <Input
            id="primeira_resposta_em"
            name="primeira_resposta_em"
            type="datetime-local"
            defaultValue={toLocalInput(existing?.primeira_resposta_em)}
          />
        </div>
      </div>

      {existing?.tempo_resposta_minutos !== null && existing?.tempo_resposta_minutos !== undefined && (
        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Tempo de resposta calculado:{" "}
          <span className="font-medium text-foreground">
            {existing.tempo_resposta_minutos} min
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={respondeu}
            onCheckedChange={(v) => setRespondeu(v === true)}
          />
          Respondeu
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={tentouAgendar}
            onCheckedChange={(v) => setTentouAgendar(v === true)}
          />
          Tentou agendar
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={fezFollowup}
            onCheckedChange={(v) => setFezFollowup(v === true)}
          />
          Fez follow-up
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={conseguiuPreco}
            onCheckedChange={(v) => setConseguiuPreco(v === true)}
          />
          Conseguiu preço
        </label>
      </div>

      <div className="space-y-1.5">
        <Label>Qualidade do atendimento (1-5)</Label>
        <Select value={qualidade} onValueChange={(v) => setQualidade(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={existing?.observacoes ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transcricao">Transcrição da conversa</Label>
        <Textarea
          id="transcricao"
          name="transcricao"
          rows={8}
          defaultValue={existing?.transcricao ?? ""}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando..." : existing ? "Atualizar diagnóstico" : "Salvar diagnóstico"}
      </Button>
    </form>
  );
}
