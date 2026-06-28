import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/appointments")({
  component: Appointments,
});

function Appointments() {
  return (
    <AppShell
      title="Visits"
      action={
        <Button className="h-14 w-full text-base shadow-lg">
          <Plus className="mr-2 h-5 w-5" /> Add an appointment
        </Button>
      }
    >
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CalendarDays className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-semibold">No upcoming visits</h2>
        <p className="max-w-xs text-base text-muted-foreground">
          Add appointments to get gentle reminders the week, day, and morning before.
        </p>
      </Card>
    </AppShell>
  );
}
