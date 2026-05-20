"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, X } from "lucide-react";
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
import { ESTAGIOS } from "@/lib/estagios";
import { updateLeadPipeline } from "@/app/(dashboard)/leads/actions";
import type { LeadDetail } from "@/lib/leads/queries";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const QUAL_NONE = "__none__";

export function PipelineSection({ data }: { data: LeadDetail }) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <PipelineEdit data={data} onDone={() => setEditing(false)} />
  ) : (
    <PipelineView data={data} onEdit={() => setEditing(true)} />
  );
}

function PipelineView({ data, onEdit }: { data: LeadDetail; onEdit: () => void }) {
  const estagioLabel = ESTAGIOS.find((e) => e.id === data.estagio)?.label ?? data.estagio;
  const mrr = (data.valor_estimado * data.probabilidade) / 100;

  return (
    <section>
      <SectionHeader title="Pipeline" onEdit={onEdit} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Estágio" value={estagioLabel} />
        <Metric label="Score" value={String(data.score)} />
        <Metric label="Valor estimado" value={fmtCurrency(data.valor_estimado)} />
        <Metric label="Probabilidade" value={`${data.probabilidade}%`} />
      </div>
      <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
        MRR projetado: <span className="font-medium">{fmtCurrency(mrr)}</span>
      </div>
      {data.qualificacao && (
        <div className="mt-3 text-xs text-muted-foreground">
          Qualificação:{" "}
          <span className="font-medium text-foreground">{data.qualificacao}</span>
          {data.motivo_desqualificacao && ` — ${data.motivo_desqualificacao}`}
        </div>
      )}
      {data.proxima_acao && (
        <div className="mt-3 rounded-md border-l-4 border-l-primary bg-muted/40 px-3 py-2 text-sm">
          <div className="text-xs text-muted-foreground">Próxima ação</div>
          <div>{data.proxima_acao}</div>
          {data.proxima_acao_data && (
            <div className="text-xs text-muted-foreground">
              {format(new Date(data.proxima_acao_data), "dd MMM yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PipelineEdit({ data, onDone }: { data: LeadDetail; onDone: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [qualificacao, setQualificacao] = useState<string>(data.qualificacao ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await updateLeadPipeline({
      lead_id: data.id,
      qualificacao: (qualificacao || null) as
        | "qualificado"
        | "nao_qualificado"
        | "pendente"
        | null,
      motivo_desqualificacao: (fd.get("motivo_desqualificacao") as string) || undefined,
      score: Number(fd.get("score") ?? 0),
      valor_estimado: Number(fd.get("valor_estimado") ?? 0),
      probabilidade: Number(fd.get("probabilidade") ?? 0),
      proxima_acao: (fd.get("proxima_acao") as string) || undefined,
      proxima_acao_data: (fd.get("proxima_acao_data") as string) || undefined,
    });
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Pipeline atualizado");
    router.refresh();
    onDone();
  }

  return (
    <section>
      <SectionHeader title="Editar pipeline" onCancel={onDone} />
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="score">Score (0-100)</Label>
            <Input
              id="score"
              name="score"
              type="number"
              min={0}
              max={100}
              defaultValue={data.score}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor_estimado">Valor (R$)</Label>
            <Input
              id="valor_estimado"
              name="valor_estimado"
              type="number"
              step="0.01"
              min={0}
              defaultValue={data.valor_estimado}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="probabilidade">Probabilidade (%)</Label>
            <Input
              id="probabilidade"
              name="probabilidade"
              type="number"
              min={0}
              max={100}
              defaultValue={data.probabilidade}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Qualificação</Label>
            <Select
              value={qualificacao || QUAL_NONE}
              onValueChange={(v) => setQualificacao(v === QUAL_NONE ? "" : (v ?? ""))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={QUAL_NONE}>—</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="nao_qualificado">Não qualificado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motivo_desqualificacao">Motivo (se não qualificado)</Label>
            <Input
              id="motivo_desqualificacao"
              name="motivo_desqualificacao"
              defaultValue={data.motivo_desqualificacao ?? ""}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="proxima_acao">Próxima ação</Label>
          <Textarea
            id="proxima_acao"
            name="proxima_acao"
            rows={2}
            defaultValue={data.proxima_acao ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proxima_acao_data">Quando</Label>
          <Input
            id="proxima_acao_data"
            name="proxima_acao_data"
            type="datetime-local"
            defaultValue={toLocalInput(data.proxima_acao_data)}
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
    </section>
  );
}

function SectionHeader({
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
