"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Phone, Mail, Plus, Pencil, Trash2, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertContato, deleteContato } from "@/app/(dashboard)/leads/actions";
import type { Contato } from "@/lib/leads/queries";

const CARGO_NONE = "__none__";

export function ContatosSection({
  clinicaId,
  contatos,
}: {
  clinicaId: string;
  contatos: Contato[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-foreground/10 transition-all duration-200 ease-out hover:ring-foreground/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold tracking-tight">
          Contatos{" "}
          <span className="font-normal tabular-nums text-muted-foreground">
            ({contatos.length})
          </span>
        </h3>
        {!adding && !editingId && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-1 h-3 w-3" /> Novo
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-3 rounded-lg bg-background p-3 ring-1 ring-inset ring-foreground/10 animate-in fade-in-0 zoom-in-95 duration-200">
          <ContatoForm
            clinicaId={clinicaId}
            onDone={() => setAdding(false)}
          />
        </div>
      )}

      {contatos.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {contatos.map((c) =>
            editingId === c.id ? (
              <li
                key={c.id}
                className="rounded-lg bg-background p-3 ring-1 ring-inset ring-foreground/10"
              >
                <ContatoForm
                  clinicaId={clinicaId}
                  existing={c}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <ContatoView
                key={c.id}
                contato={c}
                onEdit={() => setEditingId(c.id)}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function ContatoView({
  contato,
  onEdit,
}: {
  contato: Contato;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function onDelete() {
    if (!window.confirm("Remover este contato?")) return;
    setRemoving(true);
    const res = await deleteContato(contato.id);
    setRemoving(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Contato removido");
    router.refresh();
  }

  return (
    <li className="group/item rounded-lg bg-background p-3 text-sm ring-1 ring-inset ring-foreground/10 transition-all duration-200 ease-out hover:ring-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/contatos?id=${contato.id}`}
              className="group/contato inline-flex items-center gap-1 font-medium transition-colors hover:text-primary"
              title="Abrir na página de contatos"
            >
              {contato.nome ?? "(sem nome)"}
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover/contato:opacity-100" />
            </Link>
            {contato.cargo && (
              <Badge variant="secondary" className="rounded-md">
                {contato.cargo}
              </Badge>
            )}
            {contato.is_decisor && <Badge className="rounded-md">Decisor</Badge>}
          </div>
          <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
            {contato.telefone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground/70" />
                <span className="tabular-nums">{contato.telefone}</span>
              </span>
            )}
            {contato.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground/70" /> {contato.email}
              </span>
            )}
          </div>
          {contato.observacoes && (
            <p className="mt-1.5 text-xs text-muted-foreground">{contato.observacoes}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-60 transition-opacity duration-200 group-hover/item:opacity-100">
          <Button variant="ghost" size="icon-xs" onClick={onEdit} aria-label="Editar">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDelete}
            disabled={removing}
            aria-label="Remover"
            className="hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function ContatoForm({
  clinicaId,
  existing,
  onDone,
}: {
  clinicaId: string;
  existing?: Contato;
  onDone: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cargo, setCargo] = useState<string>(existing?.cargo ?? "");
  const [isDecisor, setIsDecisor] = useState<boolean>(existing?.is_decisor ?? false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await upsertContato({
      id: existing?.id ?? null,
      clinica_id: clinicaId,
      nome: (fd.get("nome") as string) || undefined,
      cargo: (cargo || null) as
        | "socio"
        | "gestor"
        | "recepcao"
        | "medico"
        | "outro"
        | null,
      telefone: (fd.get("telefone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      is_decisor: isDecisor,
      observacoes: (fd.get("observacoes") as string) || undefined,
    });
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(existing ? "Contato atualizado" : "Contato criado");
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-sm font-semibold tracking-tight">
          {existing ? "Editar contato" : "Novo contato"}
        </span>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onDone}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" defaultValue={existing?.nome ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Cargo</Label>
          <Select
            value={cargo || CARGO_NONE}
            onValueChange={(v) => setCargo(v === CARGO_NONE ? "" : (v ?? ""))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CARGO_NONE}>—</SelectItem>
              <SelectItem value="socio">Sócio</SelectItem>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="recepcao">Recepção</SelectItem>
              <SelectItem value="medico">Médico</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            defaultValue={existing?.telefone ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={existing?.email ?? ""}
          />
        </div>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm transition-colors hover:bg-muted/60">
        <Checkbox
          checked={isDecisor}
          onCheckedChange={(v) => setIsDecisor(v === true)}
        />
        Decisor
      </label>
      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          defaultValue={existing?.observacoes ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
