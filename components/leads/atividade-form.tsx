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
import { createAtividade } from "@/app/(dashboard)/leads/actions";

const TIPOS = [
  { value: "ligacao", label: "Ligação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "reuniao", label: "Reunião" },
  { value: "nota", label: "Nota" },
];

const RESULTADOS = [
  { value: "sucesso", label: "Sucesso" },
  { value: "sem_resposta", label: "Sem resposta" },
  { value: "reagendado", label: "Reagendado" },
  { value: "objecao", label: "Objeção" },
];

export function AtividadeForm({
  leadId,
  onDone,
}: {
  leadId: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("ligacao");
  const [resultado, setResultado] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await createAtividade({
      lead_id: leadId,
      tipo: tipo as "ligacao" | "whatsapp" | "email" | "reuniao" | "nota",
      titulo: (fd.get("titulo") as string) || undefined,
      descricao: (fd.get("descricao") as string) || undefined,
      resultado: (resultado || null) as
        | "sucesso"
        | "sem_resposta"
        | "reagendado"
        | "objecao"
        | null,
      duracao_minutos: fd.get("duracao_minutos")
        ? Number(fd.get("duracao_minutos"))
        : null,
      proxima_acao: (fd.get("proxima_acao") as string) || undefined,
      proxima_acao_data: (fd.get("proxima_acao_data") as string) || undefined,
    });
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Atividade registrada");
    (e.currentTarget as HTMLFormElement).reset();
    setResultado("");
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v ?? "ligacao")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Resultado</Label>
          <Select value={resultado} onValueChange={(v) => setResultado(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {RESULTADOS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" placeholder="Ex: Primeira ligação" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="duracao_minutos">Duração (min)</Label>
          <Input id="duracao_minutos" name="duracao_minutos" type="number" min={0} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proxima_acao_data">Próxima ação em</Label>
          <Input id="proxima_acao_data" name="proxima_acao_data" type="datetime-local" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proxima_acao">Próxima ação</Label>
        <Input id="proxima_acao" name="proxima_acao" placeholder="Ex: Ligar de volta amanhã" />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full transition-all duration-200 ease-out"
      >
        {loading ? "Salvando..." : "Registrar atividade"}
      </Button>
    </form>
  );
}
