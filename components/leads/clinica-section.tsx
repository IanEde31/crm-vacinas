"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, MapPin, Globe, FileText, Phone, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateClinica } from "@/app/(dashboard)/leads/actions";
import type { LeadDetail } from "@/lib/leads/queries";

const PORTE_NONE = "__none__";
type Clinica = NonNullable<LeadDetail["clinica"]>;

export function ClinicaSection({ clinica }: { clinica: Clinica | null }) {
  const [editing, setEditing] = useState(false);

  if (!clinica) {
    return (
      <section>
        <Header title="Clínica" />
        <p className="text-sm text-muted-foreground">Sem clínica associada.</p>
      </section>
    );
  }

  return editing ? (
    <ClinicaEdit clinica={clinica} onDone={() => setEditing(false)} />
  ) : (
    <ClinicaView clinica={clinica} onEdit={() => setEditing(true)} />
  );
}

function ClinicaView({ clinica, onEdit }: { clinica: Clinica; onEdit: () => void }) {
  return (
    <section>
      <Header title="Clínica" onEdit={onEdit} />
      <div className="space-y-2 text-sm">
        <div className="text-base font-medium">{clinica.nome}</div>
        {clinica.razao_social && (
          <div className="text-xs text-muted-foreground">{clinica.razao_social}</div>
        )}
        {clinica.cnpj && (
          <Row icon={FileText}>CNPJ: {clinica.cnpj}</Row>
        )}
        {(clinica.endereco || clinica.cidade) && (
          <Row icon={MapPin}>
            {[clinica.endereco, clinica.cidade, clinica.estado, clinica.cep]
              .filter(Boolean)
              .join(", ")}
          </Row>
        )}
        {clinica.telefone && <Row icon={Phone}>{clinica.telefone}</Row>}
        {clinica.website && (
          <Row icon={Globe}>
            <a
              href={clinica.website}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {clinica.website}
            </a>
          </Row>
        )}
        {clinica.rating !== null && (
          <Row icon={Star}>
            {clinica.rating} · {clinica.total_reviews ?? 0} avaliações
          </Row>
        )}
        {clinica.porte_estimado && (
          <Badge variant="secondary" className="text-[10px]">
            Porte: {clinica.porte_estimado}
          </Badge>
        )}
      </div>
    </section>
  );
}

function ClinicaEdit({ clinica, onDone }: { clinica: Clinica; onDone: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [porte, setPorte] = useState<string>(clinica.porte_estimado ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const ratingStr = (fd.get("rating") as string) || "";
    const reviewsStr = (fd.get("total_reviews") as string) || "";
    const res = await updateClinica({
      clinica_id: clinica.id,
      nome: (fd.get("nome") as string) || "",
      razao_social: (fd.get("razao_social") as string) || undefined,
      cnpj: (fd.get("cnpj") as string) || undefined,
      telefone: (fd.get("telefone") as string) || undefined,
      whatsapp: (fd.get("whatsapp") as string) || undefined,
      endereco: (fd.get("endereco") as string) || undefined,
      cidade: (fd.get("cidade") as string) || undefined,
      estado: (fd.get("estado") as string) || undefined,
      cep: (fd.get("cep") as string) || undefined,
      website: (fd.get("website") as string) || undefined,
      rating: ratingStr ? Number(ratingStr) : null,
      total_reviews: reviewsStr ? Number(reviewsStr) : null,
      porte_estimado: (porte || null) as "pequeno" | "medio" | "grande" | null,
    });
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Clínica atualizada");
    router.refresh();
    onDone();
  }

  return (
    <section>
      <Header title="Editar clínica" onCancel={onDone} />
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Nome" required>
          <Input name="nome" defaultValue={clinica.nome} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razão social">
            <Input name="razao_social" defaultValue={clinica.razao_social ?? ""} />
          </Field>
          <Field label="CNPJ">
            <Input name="cnpj" defaultValue={clinica.cnpj ?? ""} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone">
            <Input name="telefone" defaultValue={clinica.telefone ?? ""} />
          </Field>
          <Field label="WhatsApp">
            <Input name="whatsapp" defaultValue={clinica.whatsapp ?? ""} />
          </Field>
        </div>
        <Field label="Endereço">
          <Input name="endereco" defaultValue={clinica.endereco ?? ""} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Cidade">
            <Input name="cidade" defaultValue={clinica.cidade ?? ""} />
          </Field>
          <Field label="UF">
            <Input name="estado" defaultValue={clinica.estado ?? ""} maxLength={2} />
          </Field>
          <Field label="CEP">
            <Input name="cep" defaultValue={clinica.cep ?? ""} />
          </Field>
        </div>
        <Field label="Website">
          <Input name="website" type="url" defaultValue={clinica.website ?? ""} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Rating (0-5)">
            <Input
              name="rating"
              type="number"
              step="0.1"
              min={0}
              max={5}
              defaultValue={clinica.rating ?? ""}
            />
          </Field>
          <Field label="# Avaliações">
            <Input
              name="total_reviews"
              type="number"
              min={0}
              defaultValue={clinica.total_reviews ?? ""}
            />
          </Field>
          <Field label="Porte">
            <Select
              value={porte || PORTE_NONE}
              onValueChange={(v) => setPorte(v === PORTE_NONE ? "" : (v ?? ""))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PORTE_NONE}>—</SelectItem>
                <SelectItem value="pequeno">Pequeno</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="grande">Grande</SelectItem>
              </SelectContent>
            </Select>
          </Field>
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
    </section>
  );
}

function Header({
  title,
  onEdit,
  onCancel,
}: {
  title: string;
  onEdit?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-medium">{title}</h3>
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="mr-1 h-3 w-3" /> Editar
        </Button>
      )}
      {onCancel && (
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3 w-3" /> Cancelar
        </Button>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Row({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{children}</span>
    </div>
  );
}
