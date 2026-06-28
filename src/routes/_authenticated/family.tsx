import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/family")({
  component: Family,
});

function Family() {
  return (
    <AppShell
      title="Family"
      action={
        <Button className="h-14 w-full text-base shadow-lg">
          <UserPlus className="mr-2 h-5 w-5" /> Invite family
        </Button>
      }
    >
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Users className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-semibold">Just you so far</h2>
        <p className="max-w-xs text-base text-muted-foreground">
          Invite a family member by email. They&apos;ll see what you choose to share, and you can
          hide individual items anytime.
        </p>
      </Card>
    </AppShell>
  );
}
