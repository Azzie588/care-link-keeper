import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pill, Pencil, Trash2, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
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
  createMedication,
  deleteMedication,
  listMedications,
  updateMedication,
} from "@/lib/medications.functions";
import { listProviders } from "@/lib/providers.functions";

export const Route = createFileRoute("/_authenticated/medications")({
  component: Medications,
});

type MedicationRow = Awaited<ReturnType<typeof listMedications>>[number];

type FormState = {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  provider_id: string;
  pharmacy: string;
  date_filled: string;
  refill_reminder_date: string;
  notes: string;
  is_hidden: boolean;
};

const emptyForm: FormState = {
  name: "",
  dosage: "",
  frequency: "",
  provider_id: "",
  pharmacy: "",
  date_filled: "",
  refill_reminder_date: "",
  notes: "",
  is_hidden: false,
};

function Medications() {
  const qc = useQueryClient();
  const { data: medications = [], isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: () => listMedications(),
  });
  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: () => listProviders(),
  });

  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => setEditing({ ...emptyForm });
  const openEdit = (m: MedicationRow) =>
    setEditing({
      id: m.id,
      name: m.name ?? "",
      dosage: m.dosage ?? "",
      frequency: m.frequency ?? "",
      provider_id: (m as any).provider_id ?? "",
      pharmacy: m.pharmacy ?? "",
      date_filled: m.date_filled ?? "",
      refill_reminder_date: m.refill_reminder_date ?? "",
      notes: m.notes ?? "",
      is_hidden: m.is_hidden ?? false,
    });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteMedication({ id }),
    onSuccess: () => {
      toast.success("Medication deleted");
      qc.invalidateQueries({ queryKey: ["medications"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Medications"
      action={
        <Button onClick={openNew} className="h-14 w-full text-base shadow-lg">
          <Plus className="mr-2 h-5 w-5" /> Add a medication
        </Button>
      }
    >
      {isLoading ? (
        <Card className="flex items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      ) : medications.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Pill className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-semibold">No medications yet</h2>
          <p className="max-w-xs text-base text-muted-foreground">
            Add prescriptions with the date filled, and we&apos;ll remind you before refill time.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {medications.map((m) => (
            <MedicationCard
              key={m.id}
              medication={m}
              onEdit={() => openEdit(m)}
              onDelete={() => setDeleteId(m.id)}
            />
          ))}
        </ul>
      )}

      {editing ? (
        <MedicationDialog
          initial={editing}
          providers={providers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["medications"] });
            setEditing(null);
          }}
        />
      ) : null}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this medication?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone.
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

function MedicationCard({
  medication,
  onEdit,
  onDelete,
}: {
  medication: MedicationRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const providerName = (medication as any).providers?.name as string | undefined;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold">{medication.name}</h3>
            {medication.is_hidden ? (
              <span title="Hidden from family" className="text-muted-foreground">
                <EyeOff className="h-4 w-4" />
              </span>
            ) : null}
          </div>
          {medication.dosage ? (
            <p className="text-base text-muted-foreground">{medication.dosage}</p>
          ) : null}
          {medication.frequency ? (
            <p className="text-sm text-muted-foreground">{medication.frequency}</p>
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
      <div className="mt-3 space-y-1.5 text-sm text-foreground/80">
        {providerName ? <p>Prescriber: {providerName}</p> : null}
        {medication.pharmacy ? <p>Pharmacy: {medication.pharmacy}</p> : null}
        {medication.date_filled ? <p>Filled: {medication.date_filled}</p> : null}
        {medication.refill_reminder_date ? (
          <p>Refill reminder: {medication.refill_reminder_date}</p>
        ) : null}
      </div>
    </Card>
  );
}

function MedicationDialog({
  initial,
  providers,
  onClose,
  onSaved,
}: {
  initial: FormState;
  providers: Awaited<ReturnType<typeof listProviders>>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        dosage: form.dosage || null,
        frequency: form.frequency || null,
        provider_id: form.provider_id || null,
        pharmacy: form.pharmacy || null,
        date_filled: form.date_filled || null,
        refill_reminder_date: form.refill_reminder_date || null,
        notes: form.notes || null,
        is_hidden: form.is_hidden,
      };
      if (form.id) {
        return updateMedication({ id: form.id, ...payload });
      }
      return createMedication(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Medication updated" : "Medication added");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit medication" : "Add a medication"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Field
            label="Name"
            required
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Lisinopril"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dosage" value={form.dosage} onChange={(v) => setForm({ ...form, dosage: v })} placeholder="10mg" />
            <Field label="Frequency" value={form.frequency} onChange={(v) => setForm({ ...form, frequency: v })} placeholder="Once daily" />
          </div>

          <div>
            <Label className="text-base">Prescriber</Label>
            <Select
              value={form.provider_id || undefined}
              onValueChange={(v) => setForm({ ...form, provider_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No providers yet — add one first
                  </div>
                ) : (
                  providers.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Field label="Pharmacy" value={form.pharmacy} onChange={(v) => setForm({ ...form, pharmacy: v })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-base">Date filled</Label>
              <Input type="date" value={form.date_filled} onChange={(e) => setForm({ ...form, date_filled: e.target.value })} />
            </div>
            <div>
              <Label className="text-base">Refill reminder</Label>
              <Input type="date" value={form.refill_reminder_date} onChange={(e) => setForm({ ...form, refill_reminder_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-base">Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="font-medium">Hide from family</div>
              <div className="text-sm text-muted-foreground">Only you will see this medication.</div>
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
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
