import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const visitInput = z.object({
  provider_id: z.string().uuid().nullable().optional(),
  visit_date: z.string().min(1, "Date is required"),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_hidden: z.boolean().optional(),
});

export async function listVisits() {
  const { data, error } = await supabase
    .from("visits")
    .select("*, providers(name)")
    .order("visit_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createVisit(input: unknown) {
  const parsed = visitInput.parse(input);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");

  const { data: visit, error } = await supabase
    .from("visits")
    .insert({ ...parsed, owner_id: userData.user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return visit;
}

export async function updateVisit(input: unknown) {
  const parsed = visitInput.extend({ id: z.string().uuid() }).parse(input);
  const { id, ...fields } = parsed;

  const { error } = await supabase.from("visits").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteVisit(input: unknown) {
  const { id } = z.object({ id: z.string().uuid() }).parse(input);
  const { error } = await supabase.from("visits").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
