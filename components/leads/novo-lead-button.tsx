"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Building2,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  buscarClinicasParaLead,
  createLead,
  type CreateLeadInput,
} from "@/app/(dashboard)/leads/actions";
import type { ClinicaBusca } from "@/lib/leads/queries";
import { openLeadDrawer } from "@/lib/leads/lead-drawer-bus";

const ESTAGIOS_CRIACAO = [
  { value: "lead_bruto", label: "Lead Bruto" },
  { value: "qualificado", label: "Qualificado" },
] as const;

const ORIGENS = [
  { value: "indicacao", label: "Indicação" },
  { value: "inbound", label: "Inbound" },
] as const;

/** Botão "Novo lead" + dialog de criação. Vive no header da página /leads. */
export function NovoLeadButton({ autoOpen = false }: { autoOpen?: boolean }) {
  const [open, setOpen] = useState(autoOpen);

  return (
    <>
      <Button size="sm" className="shadow-sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Novo lead
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo lead</DialogTitle>
            <DialogDescription>
              Vincule a uma clínica existente ou cadastre uma nova.
            </DialogDescription>
          </DialogHeader>
          {open && <NovoLeadForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

type Modo = "buscar" | "nova";

function NovoLeadForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<Modo>("buscar");

  // Modo "buscar": clínica existente.
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ClinicaBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [clinicaSel, setClinicaSel] = useState<ClinicaBusca | null>(null);

  // Campos do lead.
  const [estagio, setEstagio] = useState<string>("lead_bruto");
  const [origem, setOrigem] = useState<string>("indicacao");

  // Busca de clínicas com debounce — dispara só enquanto não há seleção.
  useEffect(() => {
    if (clinicaSel) return;
    const needle = termo.trim();
    if (needle.length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await buscarClinicasParaLead(needle);
      if (!cancelled) {
        setResultados(res);
        setBuscando(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [termo, clinicaSel]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (modo === "buscar" && !clinicaSel) {
      toast.error("Selecione uma clínica ou cadastre uma nova.");
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);

    const input: CreateLeadInput = {
      estagio: estagio as CreateLeadInput["estagio"],
      origem: origem as CreateLeadInput["origem"],
      origem_detalhe: (fd.get("origem_detalhe") as string) || undefined,
      valor_estimado: Number(fd.get("valor_estimado")) || 2300,
    };

    if (modo === "buscar") {
      input.clinica_id = clinicaSel!.id;
    } else {
      input.clinica_nova = {
        nome: (fd.get("nome") as string)?.trim() ?? "",
        cidade: (fd.get("cidade") as string) || undefined,
        estado: (fd.get("estado") as string) || undefined,
        telefone: (fd.get("telefone") as string) || undefined,
        whatsapp: (fd.get("whatsapp") as string) || undefined,
      };
    }

    setLoading(true);
    const res = await createLead(input);
    setLoading(false);

    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success("Lead criado");
    onDone();
    router.refresh();
    openLeadDrawer(res.leadId);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Alternância entre clínica existente e nova */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 ring-1 ring-foreground/5">
        {(
          [
            { id: "buscar", label: "Clínica existente" },
            { id: "nova", label: "Cadastrar nova" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setModo(opt.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-out",
              modo === opt.id
                ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {modo === "buscar" ? (
        <div className="space-y-2">
          <Label>Clínica</Label>
          {clinicaSel ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-2.5 ring-1 ring-foreground/10">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {clinicaSel.nome}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {[clinicaSel.cidade, clinicaSel.estado]
                    .filter(Boolean)
                    .join(" / ") || "Sem localização"}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setClinicaSel(null);
                  setTermo("");
                  setResultados([]);
                }}
                aria-label="Trocar clínica"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder="Buscar clínica pelo nome..."
                  className="pl-8"
                  autoFocus
                />
              </div>
              {termo.trim().length >= 2 && (
                <div className="max-h-48 overflow-y-auto rounded-lg ring-1 ring-foreground/10">
                  {buscando ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Buscando...
                    </div>
                  ) : resultados.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Nenhuma clínica encontrada. Use “Cadastrar nova”.
                    </div>
                  ) : (
                    resultados.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClinicaSel(c)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-200 ease-out hover:bg-muted"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{c.nome}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {[c.cidade, c.estado].filter(Boolean).join(" / ") ||
                              "Sem localização"}
                          </div>
                        </div>
                        {c.tem_lead_ativo && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                            title="Esta clínica já tem um lead em andamento"
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            lead ativo
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {clinicaSel?.tem_lead_ativo && (
            <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              Esta clínica já tem um lead em andamento. Confirme se não é
              duplicado antes de criar.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nome">
              Nome da clínica <span className="text-destructive">*</span>
            </Label>
            <Input id="nome" name="nome" required maxLength={200} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input id="estado" name="estado" maxLength={50} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" maxLength={50} />
            </div>
          </div>
        </div>
      )}

      {/* Campos do lead */}
      <div className="grid grid-cols-2 gap-3 border-t border-foreground/10 pt-4">
        <div className="space-y-1.5">
          <Label>Estágio inicial</Label>
          <Select value={estagio} onValueChange={(v) => setEstagio(v ?? "lead_bruto")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTAGIOS_CRIACAO.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Origem</Label>
          <Select value={origem} onValueChange={(v) => setOrigem(v ?? "indicacao")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORIGENS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="valor_estimado">Valor estimado (R$)</Label>
          <Input
            id="valor_estimado"
            name="valor_estimado"
            type="number"
            min={0}
            step={100}
            defaultValue={2300}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="origem_detalhe">Detalhe da origem</Label>
          <Input
            id="origem_detalhe"
            name="origem_detalhe"
            maxLength={200}
            placeholder="Ex: indicado por..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar lead"}
        </Button>
      </DialogFooter>
    </form>
  );
}
