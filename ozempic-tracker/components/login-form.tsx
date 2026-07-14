"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPasskeyError, isPasskeySupported } from "@/lib/passkeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyOk, setPasskeyOk] = useState(false);

  useEffect(() => {
    setPasskeyOk(isPasskeySupported());
  }, []);

  async function signInWithPasskey() {
    setError(null);
    setPasskeyLoading(true);
    const supabase = createClient();

    try {
      const { error: authError } = await supabase.auth.signInWithPasskey();
      if (authError) throw authError;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(formatPasskeyError(err));
      setPasskeyLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        data: {
          app_name: "Ozempic Tracker",
          app_purpose: "weekly Ozempic check-in, weight in kg, and scale photo",
        },
      },
    });

    setLoading(false);

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("email rate")) {
        setError(
          "Too many emails sent. Wait about an hour, or use Fingerprint / Face ID if you’ve set that up."
        );
        return;
      }
      setError(authError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="soft-card rounded-3xl border-0 ring-1 ring-primary/10">
        <CardHeader className="space-y-3 pb-2 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-soft-rose text-primary">
            <Mail className="size-7" />
          </span>
          <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            We emailed a sign-in link for{" "}
            <strong className="font-semibold text-foreground">
              Ozempic Tracker
            </strong>{" "}
            to{" "}
            <strong className="font-semibold text-foreground">{email}</strong>.
            Open it on this phone — then set up fingerprint / Face ID so you
            don&apos;t need email next time.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button
            variant="outline"
            className="h-12 w-full rounded-full border-primary/20 text-base font-semibold hover:bg-soft-rose"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="soft-card rounded-3xl border-0 ring-1 ring-primary/10">
      <CardHeader className="space-y-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="size-5 text-primary" />
          Sign in
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Easiest: use{" "}
          <strong className="font-semibold text-foreground">
            fingerprint or Face ID
          </strong>{" "}
          if you&apos;ve set it up. Otherwise we&apos;ll email a one-tap link.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {passkeyOk && (
          <>
            <Button
              type="button"
              size="lg"
              className="h-14 w-full rounded-full text-base font-bold shadow-md shadow-primary/25"
              disabled={passkeyLoading || loading}
              onClick={signInWithPasskey}
            >
              {passkeyLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Waiting for phone…
                </>
              ) : (
                <>
                  <Fingerprint className="size-5" />
                  Fingerprint / Face ID
                </>
              )}
            </Button>

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-primary/15" />
              <span className="text-sm font-semibold text-muted-foreground">
                or email link
              </span>
              <div className="h-px flex-1 bg-primary/15" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="grid gap-2.5">
            <Label htmlFor="email" className="text-base font-semibold">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl border-primary/15 bg-soft-rose/40 px-4 text-lg shadow-none focus-visible:bg-card"
              required
            />
          </div>
          {error && (
            <p
              className="rounded-2xl bg-destructive/10 px-4 py-3 text-base text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            variant={passkeyOk ? "outline" : "default"}
            className={
              passkeyOk
                ? "h-14 w-full rounded-full border-primary/20 text-base font-bold hover:bg-soft-rose"
                : "h-14 w-full rounded-full text-base font-bold shadow-md shadow-primary/25"
            }
            disabled={loading || passkeyLoading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Sending…
              </>
            ) : (
              "Email me a sign-in link"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
