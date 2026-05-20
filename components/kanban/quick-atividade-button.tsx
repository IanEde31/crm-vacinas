"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AtividadeForm } from "@/components/leads/atividade-form";

export function QuickAtividadeButton({
  leadId,
  clinicaNome,
}: {
  leadId: string;
  clinicaNome: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        className="h-5 w-5"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="Nova atividade"
        title="Nova atividade"
      >
        <Plus className="h-3 w-3" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova atividade</DialogTitle>
            <DialogDescription>{clinicaNome}</DialogDescription>
          </DialogHeader>
          <AtividadeForm leadId={leadId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
