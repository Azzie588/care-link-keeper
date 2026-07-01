import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MedTrack" },
      { name: "description", content: "Sign in to MedTrack to track providers, appointments, and medications." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Try again, or use \"Forgot your password?\" below.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with that email already exists. Try signing in instead.";
  if (m.includes("email not confirmed")) return "Please confirm your email first, then sign in.";
  if (m.includes("token") && m.includes("expired")) return "That code has expired. Send a new one and try again.";
  if (m.includes("invalid") && m.includes("token")) return "That code isn't right. Double-check the email and try again.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [relationship, setRelationship] = useState("Me");
  const [busy, setBusy] = useState(false);

  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reset") === "1") setMode("reset");
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/home" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName, relationship_label: relationship },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
        navigate({ to: "/home" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (err) {
      toast.error(friendlyAuthError(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  async function sendResetCode() {
    if (!email) {
      toast.error("Enter your email above first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
    } else {
      setResetSent(true);
      toast.success("Check your email for a password reset link.");
    }
  }

  return (
    <div className="min-h-screen bg-background px-5 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Heart className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">MedTrack</h1>
        </div>
        <p className="text-center text-base text-muted-foreground">
          Keep providers, appointments, and medications in one calm place.
        </p>

        <Card className="w-full p-6">
          {mode === "reset" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold">Reset your password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll email you a secure link that brings you back here to choose a new password.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="r-email" className="text-base">Email</Label>
                <Input
                  id="r-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>

              <Button onClick={sendResetCode} disabled={busy || !email} className="h-12 text-base">
                {busy ? "Sending…" : resetSent ? "Send reset link again" : "Email me a reset link"}
              </Button>

              {resetSent && (
                <p className="rounded-md bg-secondary p-4 text-sm text-secondary-foreground">
                  Open the newest email from MedTrack and tap the reset link. If you requested more than one,
                  only the most recent link will work.
                </p>
              )}

              <button
                type="button"
                onClick={() => { setMode("signin"); setResetSent(false); }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {mode === "signup" && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name" className="text-base">Your name</Label>
                    <Input
                      id="name"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-12 text-base"
                      placeholder="e.g. Sarah"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rel" className="text-base">I am tracking for</Label>
                    <Input
                      id="rel"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="h-12 text-base"
                      placeholder="Me, Mom, Dad…"
                    />
                  </div>
                </>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-base">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>

              <Button type="submit" disabled={busy} className="h-12 text-base">
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </Button>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot your password?
                </button>
              )}
            </form>
          )}
        </Card>

        {mode !== "reset" && (
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-base text-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        )}

        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </div>
    </div>
  );
}
