import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/_authenticated/providers")({
  component: Providers,
});

function Providers() {
  return (
    <AppShell
      title="Providers"
      action={
        <Button className="h-14 w-full text-base shadow-lg">
          <Plus className="mr-2 h-5 w-5" /> Add a provider
        </Button>
      }
    >
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Stethoscope className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-semibold">No providers yet</h2>
        <p className="max-w-xs text-base text-muted-foreground">
          Add doctors, dentists, and specialists. We&apos;ll help fill in their info as you type.
        </p>
      </Card>
    </AppShell>
  );
}
