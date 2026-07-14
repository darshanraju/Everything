"use client";

import { useState } from "react";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      },
    });

    setLoading(false);

    if (authError) {
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
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            We sent a magic link to{" "}
            <strong className="font-semibold text-foreground">{email}</strong>.
            Open it on this phone to sign in — no password needed.
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
          Enter your email and we&apos;ll send you a magic link — no password to
          remember.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            className="h-14 w-full rounded-full text-base font-bold shadow-md shadow-primary/25"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Sending…
              </>
            ) : (
              "Send magic link"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
