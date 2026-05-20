"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MessageCircle,
  Phone,
  Mail,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createTarefaParaContato } from "@/app/(dashboard)/contatos/actions";
import type { ContatoCard } from "@/lib/contatos/queries";

function onlyDigits(s: string | null | undefined): string {
  return s ? s.replace(/\D/g, "") : "";
}

export function ContatoActions({
  contato,
  size = "xs",
}: {
  contato: ContatoCard;
  size?: "xs" | "sm";
}) {
  const tel = onlyDigits(contato.telefone) || onlyDigits(contato.clinica?.whatsapp);
  const whatsapp = onlyDigits(contato.telefone) || onlyDigits(contato.clinica?.whatsapp);

  const iconSize = size === "xs" ? "icon-xs" : "icon-sm";

  function openWhatsApp(e: React.MouseEvent) {
    e.stopPropagation();
    if (!whatsapp) return;
    window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener,noreferrer");
  }

  function callPhone(e: React.MouseEvent) {
    e.stopPropagation();
    if (!tel) return;
    window.location.href = `tel:${tel}`;
  }

  function sendEmail(e: React.MouseEvent) {
    e.stopPropagation();
    if (!contato.email) return;
    window.location.href = `mailto:${contato.email}`;
  }

  return (
    <div className="flex items-center gap-1.5">
      {whatsapp && (
        <Button
          size={iconSize}
          variant="outline"
          onClick={openWhatsApp}
          title="Abrir WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
      )}
      {tel && (
        <Button size={iconSize} variant="outline" onClick={callPhone} title="Ligar">
          <Phone className="h-3.5 w-3.5" />
        </Button>
      )}
      {contato.email && (
        <Button size={iconSize} variant="outline" onClick={sendEmail} title="E-mail">
          <Mail className="h-3.5 w-3.5" />
        </Button>
      )}
      <NovaTarefaButton contato={contato} size={size} />
    </div>
  );
}

function NovaTarefaButton({
  contato,
  size,
}: {
  contato: ContatoCard;
  size: "xs" | "sm";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size={size}
        variant="default"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Tarefa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>
              Vinculada a {contato.nome ?? "este contato"}
              {contato.clinica?.nome && ` · ${contato.clinica.nome}`}
            </DialogDescription>
          </DialogHeader>
          <TarefaForm contato={contato} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function TarefaForm({
  contato,
  onDone,
}: {
  contato: ContatoCard;
  onDone: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prioridade, setPrioridade] = useState("media");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await createTarefaParaContato({
      contato_id: contato.id,
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
    router.refresh();
    onDone();
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
