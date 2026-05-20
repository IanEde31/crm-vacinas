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
import { NewTarefaForm } from "./new-tarefa-form";

export function NewTarefaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Nova tarefa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>
              Tarefa independente — sem vínculo com lead específico.
            </DialogDescription>
          </DialogHeader>
          <NewTarefaForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
