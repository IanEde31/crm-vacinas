"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStandaloneTarefa } from "@/app/(dashboard)/tarefas/actions";
import { LeadOrClinicaPicker, type PickerValue } from "./lead-or-clinica-picker";

export function NewTarefaForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prioridade, setPrioridade] = useState("media");
  const [link, setLink] = useState<PickerValue | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await createStandaloneTarefa({
      titulo: (fd.get("titulo") as string) ?? "",
      descricao: (fd.get("descricao") as string) || undefined,
      prazo: (fd.get("prazo") as string) || undefined,
      prioridade: prioridade as "baixa" | "media" | "alta",
      lead_id: link?.kind === "lead" ? link.lead_id : null,
      clinica_id: link?.kind === "clinica" ? link.clinica_id : null,
      contato_id: link?.kind === "contato" ? link.contato_id : null,
    });
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Tarefa criada");
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" required autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Vincular a</Label>
        <LeadOrClinicaPicker value={link} onChange={setLink} />
        {!link && (
          <p className="text-[11px] text-muted-foreground">
            Opcional. Escolha um lead em andamento, uma clínica ou um contato
            específico.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" name="prazo" type="datetime-local" />
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Select
            value={prioridade}
            onValueChange={(v) => setPrioridade(v ?? "media")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Criar tarefa"}
      </Button>
    </form>
  );
}
