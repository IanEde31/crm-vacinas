"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronDownIcon, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type ComboboxOption = {
  /** Valor estável persistido (id, sigla, nome). */
  value: string;
  /** Texto legível exibido ao usuário. */
  label: string;
};

/** Remove acentos e caixa — busca tolerante a "sao" → "São Paulo". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim();
}

/** Filtro insensível a acento/caixa, casando por trecho do rótulo. */
function filtrarPorRotulo(
  item: ComboboxOption,
  query: string,
  itemToString?: (item: ComboboxOption) => string,
) {
  if (!query) return true;
  const rotulo = itemToString ? itemToString(item) : item.label;
  return normalizar(rotulo).includes(normalizar(query));
}

export interface ComboboxProps {
  /** Lista completa de opções — visível e rolável ao abrir. */
  options: ComboboxOption[];
  /** Valor selecionado (string vazia = nada selecionado). */
  value: string;
  onValueChange: (value: string) => void;
  /** Texto do gatilho quando nada está selecionado. */
  placeholder?: string;
  /** Texto do campo de busca dentro do popup. */
  searchPlaceholder?: string;
  /** Mensagem quando a busca não retorna resultados. */
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  /** Classe aplicada ao gatilho (largura, etc.). */
  className?: string;
  /** Ícone opcional à esquerda do gatilho. */
  icon?: React.ReactNode;
  "aria-label"?: string;
}

/**
 * Seletor pesquisável de item único. Abre exibindo a lista inteira (rolável);
 * o campo de busca filtra de forma opcional. Navegação completa por teclado.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nada encontrado.",
  disabled,
  id,
  className,
  icon,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  // O objeto selecionado é sempre um elemento de `options` — garante igualdade
  // referencial com os itens passados ao Root.
  const selecionado = options.find((o) => o.value === value) ?? null;

  return (
    <ComboboxPrimitive.Root
      items={options}
      value={selecionado}
      onValueChange={(item: ComboboxOption | null) =>
        onValueChange(item?.value ?? "")
      }
      filter={filtrarPorRotulo}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex h-9 w-full cursor-default items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none select-none",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-[popup-open]:border-ring data-[popup-open]:ring-3 data-[popup-open]:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-placeholder:text-muted-foreground",
          "dark:bg-input/30 dark:hover:bg-input/50",
          className,
        )}
      >
        {icon && (
          <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left">
          <ComboboxPrimitive.Value placeholder={placeholder} />
        </span>
        <ComboboxPrimitive.Icon className="flex shrink-0 items-center">
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </ComboboxPrimitive.Icon>
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="isolate z-50"
        >
          <ComboboxPrimitive.Popup
            className={cn(
              "flex max-h-(--available-height) w-(--anchor-width) min-w-[13rem] origin-(--transform-origin) flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10",
              "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
          >
            {/* Campo de busca — opcional; foca ao abrir mas não obriga digitar. */}
            <div className="relative shrink-0 border-b border-foreground/10">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <ComboboxPrimitive.Input
                placeholder={searchPlaceholder}
                className="h-10 w-full bg-transparent pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <ComboboxPrimitive.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </ComboboxPrimitive.Empty>

            <ComboboxPrimitive.List className="scrollbar-discreet max-h-72 flex-1 overflow-y-auto overscroll-contain p-1">
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className={cn(
                    "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2.5 text-sm outline-none select-none",
                    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ComboboxPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
                    <Check className="size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
