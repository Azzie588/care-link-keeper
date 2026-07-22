import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarDays, Pencil, Trash2, EyeOff, Loader2 } from "lucide-react";
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
  createVisit,
  deleteVisit,
  listVisits,
  updateVisit,
} from "@/lib/visits.functions";
import { listProviders } from "@/lib/providers.functions";

export const Route = createFileRoute("/_authenticated/appointments")({
  component: Appointments,
});

type VisitRow = Awaited<ReturnType<typeof listVisits>>[number];

type FormState = {
  id?: string;
  provider_id: string;
  visit_date: string;
  reason: string;
  notes: string;
  is_hidden: boolean;
};

const emptyForm: FormState = {
  provider_id: "",
  visit_date: "",
  reason: "",
  notes: "",
  is_hidden: false,
};

// timestamptz <-> <input type="datetime-local"> helpers
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

function Appointments() {
  const qc = useQueryClient();
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["visits"],
    queryFn: () => listVisits(),
  });
  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: () => listProviders(),
  });

  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => setEditing({ ...emptyForm });
  const openEdit = (v: VisitRow) =>
    setEditing({
      id: v.id,
      provider_id: v.provider_id ?? "",
      visit_date: toLocalInputValue(v.visit_date),
      reason: v.reason ?? "",
      notes: v.notes ?? "",
      is_hidden: v.is_hidden ?? false,
    });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteVisit({ id }),
    onSuccess: () => {
      toast.success("Visit deleted");
      qc.invalidateQueries({ queryKey: ["visits"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Visits"
      action={
        <Button onClick={openNew} className="h-14 w-full text-base shadow-lg">
          <Plus className="mr-2 h-5 w-5" /> Add an appointment
        </Button>
      }
    >
      {isLoading ? (
        <Card className="flex items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      ) : visits.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-semibold">No upcoming visits</h2>
          <p className="max-w-xs text-base text-muted-foreground">
            Add appointments to get gentle reminders the week, day, and morning before.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visits.map((v) => (
            <VisitCard
              key={v.id}
              visit={v}
              onEdit={() => openEdit(v)}
              onDelete={() => setDeleteId(v.id)}
            />
          ))}
        </ul>
      )}

      {editing ? (
        <VisitDialog
          initial={editing}
          providers={providers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["visits"] });
            setEditing(null);
          }}
        />
      ) : null}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
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

function VisitCard({
  visit,
  onEdit,
  onDelete,
}: {
  visit: VisitRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const providerName = (visit as any).providers?.name as string | undefined;
  const when = visit.visit_date
    ? new Date(visit.visit_date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold">
              {visit.reason || "Visit"}
            </h3>
            {visit.is_hidden ? (
              <span title="Hidden from family" className="text-muted-foreground">
                <EyeOff className="h-4 w-4" />
              </span>
            ) : null}
          </div>
          {when ? <p className="text-base text-muted-foreground">{when}</p> : null}
          {providerName ? (
            <p className="text-sm text-muted-foreground">{providerName}</p>
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
      {visit.notes ? (
        <div className="mt-3 text-sm text-foreground/80">
          <p>{visit.notes}</p>
        </div>
      ) : null}
    </Card>
  );
}

function VisitDialog({
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
        provider_id: form.provider_id || null,
        visit_date: toIso(form.visit_date),
        reason: form.reason || null,
        notes: form.notes || null,
        is_hidden: form.is_hidden,
      };
      if (form.id) {
        return updateVisit({ id: form.id, ...payload });
      }
      return createVisit(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Visit updated" : "Visit added");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit visit" : "Add an appointment"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-base">Provider</Label>
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

          <div>
            <Label className="text-base">
              Date &amp; time <span className="text-destructive">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={form.visit_date}
              onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-base">Reason</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Annual checkup"
            />
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
              <div className="text-sm text-muted-foreground">Only you will see this visit.</div>
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
              if (!form.visit_date) {
                toast.error("Date & time is required");
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
