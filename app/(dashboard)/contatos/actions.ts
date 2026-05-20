"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const tarefaSchema = z.object({
  contato_id: z.string().uuid(),
  titulo: z.string().trim().min(1, "Título obrigatório").max(200),
  descricao: z.string().trim().max(2000).optional(),
  prazo: z.string().optional(),
  prioridade: z.enum(["baixa", "media", "alta"]).default("media"),
});

export type TarefaContatoInput = z.infer<typeof tarefaSchema>;

export async function createTarefaParaContato(
  input: TarefaContatoInput,
): Promise<{ ok: true } | { error: string }> {
  const parsed = tarefaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tarefas").insert({
    contato_id: parsed.data.contato_id,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    prazo: parsed.data.prazo || null,
    prioridade: parsed.data.prioridade,
    owner_id: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/contatos");
  revalidatePath("/tarefas");
  revalidatePath("/");
  return { ok: true };
}
