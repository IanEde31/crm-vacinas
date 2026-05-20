"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  clinica_id: z.string().uuid(),
});

export async function createLeadForClinica(input: {
  clinica_id: string;
}): Promise<{ ok: true; lead_id: string } | { error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Dados inválidos" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      clinica_id: parsed.data.clinica_id,
      estagio: "lead_bruto",
      qualificacao: "pendente",
      origem: "inbound",
      owner_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clinicas");
  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true, lead_id: data.id };
}
