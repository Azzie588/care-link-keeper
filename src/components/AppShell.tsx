import { Link, useRouterState } from "@tanstack/react-router";
import { Stethoscope, CalendarDays, Pill, Users, Heart } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/providers", label: "Providers", icon: Stethoscope },
  { to: "/appointments", label: "Visits", icon: CalendarDays },
  { to: "/medications", label: "Meds", icon: Pill },
  { to: "/family", label: "Family", icon: Users },
] as const;

export function AppShell({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Link to="/home" className="flex items-center gap-2 text-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">MedTrack</span>
          </Link>
          <div className="text-base font-medium text-muted-foreground">{title}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-32 pt-6">{children}</main>

      {action ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-5">
          <div className="pointer-events-auto mx-auto w-full max-w-2xl">{action}</div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card">
        <ul className="mx-auto grid w-full max-w-2xl grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
