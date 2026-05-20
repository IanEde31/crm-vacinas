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
import { createTarefa } from "@/app/(dashboard)/leads/actions";

export function TarefaForm({ leadId, onDone }: { leadId: string; onDone?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prioridade, setPrioridade] = useState("media");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await createTarefa({
      lead_id: leadId,
      titulo: (fd.get("titulo") as string) ?? "",
      descricao: (fd.get("descricao") as string) || undefined,
      prazo: (fd.get("prazo") as string) || undefined,
      prioridade: prioridade as "baixa" | "media" | "alta",
    });
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Tarefa criada");
    (e.currentTarget as HTMLFormElement).reset();
    setPrioridade("media");
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" name="prazo" type="datetime-local" />
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Select value={prioridade} onValueChange={(v) => setPrioridade(v ?? "media")}>
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
