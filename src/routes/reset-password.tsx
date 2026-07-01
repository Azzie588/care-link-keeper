import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — MedTrack" },
      { name: "description", content: "Set a new password for your MedTrack account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ready" | "missing" | "error">("checking");
  const [message, setMessage] = useState("Checking your reset link…");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const markReady = () => {
      if (!mounted) return;
      setStatus("ready");
      setMessage("Choose a new password for your account.");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") markReady();
    });

    async function prepareRecoverySession() {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const linkError = search.get("error_description") || hash.get("error_description");
      if (linkError) {
        if (!mounted) return;
        setStatus("error");
        setMessage(linkError.replace(/\+/g, " "));
        return;
      }

      try {
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const tokenHash = search.get("token_hash") || hash.get("token_hash");
        const type = search.get("type") || hash.get("type");
        if (tokenHash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          markReady();
          return;
        }

        if (!mounted) return;
        setStatus("missing");
        setMessage("This reset link is missing or has expired. Please request a new one.");
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "This reset link couldn't be opened.");
      }
    }

    prepareRecoverySession();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/home" });
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
        <Card className="w-full p-6">
          {status !== "ready" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold">Set a new password</h2>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              </div>
              {status !== "checking" && (
                <Button asChild className="h-12 text-base">
                  <a href="/auth?reset=1">Request a new reset link</a>
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold">Set a new password</h2>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="np" className="text-base">New password</Label>
                <Input
                  id="np"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <Button type="submit" disabled={busy} className="h-12 text-base">
                {busy ? "Saving…" : "Update password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
