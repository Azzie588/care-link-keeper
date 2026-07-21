import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const medicationInput = z.object({
  name: z.string().min(1, "Name is required"),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  prescriber: z.string().nullable().optional(),
  pharmacy: z.string().nullable().optional(),
  date_filled: z.string().nullable().optional(),
  refill_reminder_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_hidden: z.boolean().optional(),
});

export async function listMedications() {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMedication(input: unknown) {
  const parsed = medicationInput.parse(input);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");

  const { data: medication, error } = await supabase
    .from("medications")
    .insert({ ...parsed, owner_id: userData.user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return medication;
}

export async function updateMedication(input: unknown) {
  const parsed = medicationInput.extend({ id: z.string().uuid() }).parse(input);
  const { id, ...fields } = parsed;

  const { error } = await supabase.from("medications").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteMedication(input: unknown) {
  const { id } = z.object({ id: z.string().uuid() }).parse(input);
  const { error } = await supabase.from("medications").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}