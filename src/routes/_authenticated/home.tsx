import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, CalendarDays, Pill, Users, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name")
      .maybeSingle()
      .then(({ data }) => setName(data?.display_name ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sections = [
    { to: "/providers", label: "Providers", desc: "Doctors and clinics", icon: Stethoscope },
    { to: "/appointments", label: "Visits", desc: "Upcoming appointments", icon: CalendarDays },
    { to: "/medications", label: "Medications", desc: "Refills and changes", icon: Pill },
    { to: "/family", label: "Family", desc: "Share with loved ones", icon: Users },
  ] as const;

  return (
    <AppShell title="Home">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hi{name ? `, ${name}` : ""} 👋
          </h1>
          <p className="mt-1 text-base text-muted-foreground">What would you like to do today?</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sections.map(({ to, label, desc, icon: Icon }) => (
            <Link key={to} to={to}>
              <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-accent/40">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-lg font-semibold">{label}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Button variant="outline" onClick={signOut} className="h-12 text-base">
          <LogOut className="mr-2 h-5 w-5" /> Sign out
        </Button>
      </div>
    </AppShell>
  );
}
