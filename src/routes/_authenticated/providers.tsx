import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Stethoscope,
  MapPin,
  Phone,
  Globe,
  Pencil,
  Trash2,
  EyeOff,
  Search,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  createProvider,
  deleteProvider,
  listProviders,
  searchNpi,
  updateProvider,
  type NpiResult,
} from "@/lib/providers.functions";

export const Route = createFileRoute("/_authenticated/providers")({
  component: Providers,
});

type ProviderRow = Awaited<ReturnType<typeof listProviders>>[number];
type LocationDraft = {
  id?: string;
  label: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
};

type FormState = {
  id?: string;
  name: string;
  specialty: string;
  practice_name: string;
  npi: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  notes: string;
  is_hidden: boolean;
  locations: LocationDraft[];
};

const emptyLocation: LocationDraft = {
  label: null,
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  phone: "",
};

const emptyForm: FormState = {
  name: "",
  specialty: "",
  practice_name: "",
  npi: "",
  phone: "",
  fax: "",
  email: "",
  website: "",
  notes: "",
  is_hidden: false,
  locations: [{ ...emptyLocation }],
};

function Providers() {
  const list = listProviders;
  const qc = useQueryClient();
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: () => list(),
  });

  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => setEditing({ ...emptyForm, locations: [{ ...emptyLocation }] });
  const openEdit = (p: ProviderRow) =>
    setEditing({
      id: p.id,
      name: p.name ?? "",
      specialty: p.specialty ?? "",
      practice_name: p.practice_name ?? "",
      npi: p.npi ?? "",
      phone: p.phone ?? "",
      fax: p.fax ?? "",
      email: p.email ?? "",
      website: p.website ?? "",
      notes: p.notes ?? "",
      is_hidden: p.is_hidden ?? false,
      locations:
        (p.provider_locations ?? []).length > 0
          ? p.provider_locations!.map((l) => ({
              id: l.id,
              label: l.label,
              address_line1: l.address_line1 ?? "",
              address_line2: l.address_line2 ?? "",
              city: l.city ?? "",
              state: l.state ?? "",
              postal_code: l.postal_code ?? "",
              phone: l.phone ?? "",
            }))
          : [{ ...emptyLocation }],
    });

  const del = deleteProvider;
  const delMutation = useMutation({
    mutationFn: (id: string) => del( { id } ),
    onSuccess: () => {
      toast.success("Provider deleted");
      qc.invalidateQueries({ queryKey: ["providers"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Providers"
      action={
        <Button onClick={openNew} className="h-14 w-full text-base shadow-lg">
          <Plus className="mr-2 h-5 w-5" /> Add a provider
        </Button>
      }
    >
      {isLoading ? (
        <Card className="flex items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      ) : providers.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Stethoscope className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-semibold">No providers yet</h2>
          <p className="max-w-xs text-base text-muted-foreground">
            Add doctors, dentists, and specialists. We&apos;ll help fill in their info as you type.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onEdit={() => openEdit(p)}
              onDelete={() => setDeleteId(p.id)}
            />
          ))}
        </ul>
      )}

      {editing ? (
        <ProviderDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["providers"] });
            setEditing(null);
          }}
        />
      ) : null}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the provider and all their saved locations. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && delMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function ProviderCard({
  provider,
  onEdit,
  onDelete,
}: {
  provider: ProviderRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const loc = provider.provider_locations?.[0];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold">{provider.name}</h3>
            {provider.is_hidden ? (
              <span title="Hidden from family" className="text-muted-foreground">
                <EyeOff className="h-4 w-4" />
              </span>
            ) : null}
          </div>
          {provider.specialty ? (
            <p className="text-base text-muted-foreground">{provider.specialty}</p>
          ) : null}
          {provider.practice_name ? (
            <p className="text-sm text-muted-foreground">{provider.practice_name}</p>
          ) : null}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        {loc?.address_line1 ? (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              [loc.address_line1, loc.city, loc.state].filter(Boolean).join(", "),
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-foreground/80 hover:text-primary"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {loc.address_line1}
              {loc.city ? `, ${loc.city}` : ""}
              {loc.state ? `, ${loc.state}` : ""}
            </span>
          </a>
        ) : null}
        {provider.phone ? (
          <a
            href={`tel:${provider.phone}`}
            className="flex items-center gap-2 text-foreground/80 hover:text-primary"
          >
            <Phone className="h-4 w-4" /> {provider.phone}
          </a>
        ) : null}
        {provider.website ? (
          <a
            href={provider.website.startsWith("http") ? provider.website : `https://${provider.website}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-foreground/80 hover:text-primary"
          >
            <Globe className="h-4 w-4" /> <span className="truncate">{provider.website}</span>
          </a>
        ) : null}
      </div>
    </Card>
  );
}

function ProviderDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: FormState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const create = createProvider;
  const update = updateProvider;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        specialty: form.specialty || null,
        practice_name: form.practice_name || null,
        npi: form.npi || null,
        phone: form.phone || null,
        fax: form.fax || null,
        email: form.email || null,
        website: form.website || null,
        notes: form.notes || null,
        is_hidden: form.is_hidden,
        locations: form.locations.map((l) => ({
          label: l.label,
          address_line1: l.address_line1 || null,
          address_line2: l.address_line2 || null,
          city: l.city || null,
          state: l.state || null,
          postal_code: l.postal_code || null,
          phone: l.phone || null,
        })),
      };
      if (form.id) {
        return update({ id: form.id, ...payload });
      }
      return create(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Provider updated" : "Provider added");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const applyNpi = (r: NpiResult) => {
    setForm((f) => ({
      ...f,
      name: r.name,
      specialty: r.specialty ?? f.specialty,
      practice_name: r.practice_name ?? f.practice_name,
      npi: r.npi,
      phone: r.phone ?? f.phone,
      fax: r.fax ?? f.fax,
      locations:
        r.locations.length > 0
          ? r.locations.map((l) => ({
              label: l.label,
              address_line1: l.address_line1 ?? "",
              address_line2: l.address_line2 ?? "",
              city: l.city ?? "",
              state: l.state ?? "",
              postal_code: l.postal_code ?? "",
              phone: l.phone ?? "",
            }))
          : f.locations,
    }));
    toast.success("Filled from NPI registry");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit provider" : "Add a provider"}</DialogTitle>
          <DialogDescription>
            Search the national registry to autofill, or type everything by hand.
          </DialogDescription>
        </DialogHeader>

        <NpiSearch onPick={applyNpi} />

        <div className="space-y-4 pt-2">
          <Field
            label="Name"
            required
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Dr. Jane Smith"
          />
          <Field
            label="Specialty"
            value={form.specialty}
            onChange={(v) => setForm({ ...form, specialty: v })}
            placeholder="Cardiology"
          />
          <Field
            label="Practice name"
            value={form.practice_name}
            onChange={(v) => setForm({ ...form, practice_name: v })}
            placeholder="Bay Area Heart Center"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Fax" value={form.fax} onChange={(v) => setForm({ ...form, fax: v })} />
          </div>
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
          <Field label="NPI number" value={form.npi} onChange={(v) => setForm({ ...form, npi: v })} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Locations</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setForm({ ...form, locations: [...form.locations, { ...emptyLocation }] })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            {form.locations.map((loc, i) => (
              <Card key={i} className="space-y-2 p-3">
                <Input
                  placeholder="Street address"
                  value={loc.address_line1 ?? ""}
                  onChange={(e) => {
                    const ls = [...form.locations];
                    ls[i] = { ...ls[i], address_line1: e.target.value };
                    setForm({ ...form, locations: ls });
                  }}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={loc.city ?? ""}
                    onChange={(e) => {
                      const ls = [...form.locations];
                      ls[i] = { ...ls[i], city: e.target.value };
                      setForm({ ...form, locations: ls });
                    }}
                  />
                  <Input
                    placeholder="State"
                    value={loc.state ?? ""}
                    onChange={(e) => {
                      const ls = [...form.locations];
                      ls[i] = { ...ls[i], state: e.target.value };
                      setForm({ ...form, locations: ls });
                    }}
                  />
                  <Input
                    placeholder="ZIP"
                    value={loc.postal_code ?? ""}
                    onChange={(e) => {
                      const ls = [...form.locations];
                      ls[i] = { ...ls[i], postal_code: e.target.value };
                      setForm({ ...form, locations: ls });
                    }}
                  />
                </div>
                {form.locations.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() =>
                      setForm({
                        ...form,
                        locations: form.locations.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </Card>
            ))}
          </div>

          <div>
            <Label className="text-base">Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything to remember about this provider"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="font-medium">Hide from family</div>
              <div className="text-sm text-muted-foreground">
                Only you will see this provider.
              </div>
            </div>
            <Switch
              checked={form.is_hidden}
              onCheckedChange={(v) => setForm({ ...form, is_hidden: v })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!form.name.trim()) {
                toast.error("Name is required");
                return;
              }
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label className="text-base">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function NpiSearch({ onPick }: { onPick: (r: NpiResult) => void }) {
  const [q, setQ] = useState("");
  const search = searchNpi;
  const m = useMutation({
    mutationFn: async () => search( { query: q.trim() } ),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="space-y-3 bg-primary/5 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4" /> Autofill from US provider registry
      </div>
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Provider name or 10-digit NPI"
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim().length >= 2) {
              e.preventDefault();
              m.mutate();
            }
          }}
        />
        <Button
          type="button"
          onClick={() => m.mutate()}
          disabled={q.trim().length < 2 || m.isPending}
        >
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {m.data && m.data.length > 0 ? (
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {m.data.map((r) => (
            <li key={r.npi}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className="w-full rounded-md border border-border bg-card p-2 text-left text-sm hover:border-primary"
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-muted-foreground">
                  {[r.specialty, r.locations[0]?.city, r.locations[0]?.state]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : m.data && m.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matches. You can still enter details manually.</p>
      ) : null}
    </Card>
  );
}
