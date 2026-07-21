import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const locationSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

const providerInput = z.object({
  name: z.string().min(1, "Name is required"),
  specialty: z.string().nullable().optional(),
  practice_name: z.string().nullable().optional(),
  npi: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_hidden: z.boolean().optional(),
  locations: z.array(locationSchema).optional(),
});

export async function listProviders() {
  const { data, error } = await supabase
    .from("providers")
    .select("*, provider_locations(*)")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProvider(input: unknown) {
  const parsed = providerInput.parse(input);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");

  const { locations, ...fields } = parsed;
  const { data: provider, error } = await supabase
    .from("providers")
    .insert({ ...fields, owner_id: userData.user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (locations && locations.length) {
    const rows = locations
      .filter((l) => l.address_line1 || l.city || l.label)
      .map(({ id: _id, ...l }) => ({ ...l, provider_id: provider.id }));
    if (rows.length) {
      const { error: locErr } = await supabase.from("provider_locations").insert(rows);
      if (locErr) throw new Error(locErr.message);
    }
  }
  return provider;
}

export async function updateProvider(input: unknown) {
  const parsed = providerInput.extend({ id: z.string().uuid() }).parse(input);
  const { id, locations, ...fields } = parsed;

  const { error } = await supabase.from("providers").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  if (locations) {
    await supabase.from("provider_locations").delete().eq("provider_id", id);
    const rows = locations
      .filter((l) => l.address_line1 || l.city || l.label)
      .map(({ id: _id, ...l }) => ({ ...l, provider_id: id }));
    if (rows.length) {
      const { error: locErr } = await supabase.from("provider_locations").insert(rows);
      if (locErr) throw new Error(locErr.message);
    }
  }
  return { ok: true };
}

export async function deleteProvider(input: unknown) {
  const { id } = z.object({ id: z.string().uuid() }).parse(input);
  const { error } = await supabase.from("providers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ---------- NPI autofill (CMS NPPES public registry) ----------

const npiQuery = z.object({
  query: z.string().min(2),
  state: z.string().length(2).optional(),
});

export type NpiResult = {
  npi: string;
  name: string;
  specialty: string | null;
  practice_name: string | null;
  phone: string | null;
  fax: string | null;
  locations: Array<{
    label: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    phone: string | null;
  }>;
};

export async function searchNpi(input: unknown): Promise<NpiResult[]> {
  const data = npiQuery.parse(input);
  const params = new URLSearchParams({ version: "2.1", limit: "10" });
  const q = data.query.trim();
  if (/^\d{10}$/.test(q)) {
    params.set("number", q);
  } else {
    const parts = q.split(/\s+/);
    if (parts.length >= 2) {
      params.set("first_name", parts[0]);
      params.set("last_name", parts.slice(1).join(" "));
    } else {
      params.set("last_name", q);
    }
    params.set("enumeration_type", "NPI-1");
  }
  if (data.state) params.set("state", data.state);

  const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params.toString()}`);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    results?: Array<{
      number: string;
      basic?: {
        first_name?: string;
        last_name?: string;
        middle_name?: string;
        credential?: string;
        organization_name?: string;
        name?: string;
      };
      taxonomies?: Array<{ desc?: string; primary?: boolean }>;
      addresses?: Array<{
        address_purpose?: string;
        address_1?: string;
        address_2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        telephone_number?: string;
        fax_number?: string;
      }>;
    }>;
  };
  return (json.results ?? []).map((r) => {
    const b = r.basic ?? {};
    const name = b.organization_name
      ? b.organization_name
      : [b.first_name, b.middle_name, b.last_name].filter(Boolean).join(" ") +
        (b.credential ? `, ${b.credential}` : "");
    const primary =
      r.taxonomies?.find((t) => t.primary)?.desc ?? r.taxonomies?.[0]?.desc ?? null;
    const locationAddr = r.addresses?.find((a) => a.address_purpose === "LOCATION");
    const mailing = r.addresses?.find((a) => a.address_purpose === "MAILING");
    const primaryAddr = locationAddr ?? mailing;
    const locations = (r.addresses ?? [])
      .filter((a) => a.address_purpose === "LOCATION" || a.address_purpose === "PRIMARY")
      .map((a) => ({
        label: a.address_purpose ?? null,
        address_line1: a.address_1 ?? null,
        address_line2: a.address_2 ?? null,
        city: a.city ?? null,
        state: a.state ?? null,
        postal_code: a.postal_code?.slice(0, 5) ?? null,
        phone: a.telephone_number ?? null,
      }));
    return {
      npi: r.number,
      name: name.trim() || "Unknown",
      specialty: primary,
      practice_name: b.organization_name ?? null,
      phone: primaryAddr?.telephone_number ?? null,
      fax: primaryAddr?.fax_number ?? null,
      locations,
    };
  });
}
EOF