"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPasskeyError, isPasskeySupported } from "@/lib/passkeys";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PasskeyRow = {
  id: string;
  friendly_name?: string | null;
  created_at: string;
  last_used_at?: string | null;
};

export function PasskeySetupCard() {
  const [supported, setSupported] = useState(true);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error: listError } = await supabase.auth.passkey.list();
      if (listError) throw listError;
      setPasskeys((data as PasskeyRow[]) ?? []);
    } catch {
      // Passkeys may be disabled on the project — still show setup UI
      setPasskeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSupported(isPasskeySupported());
    void refresh();
  }, [refresh]);

  async function register() {
    setError(null);
    setMessage(null);
    setBusy(true);
    const supabase = createClient();

    try {
      const { data, error: regError } = await supabase.auth.registerPasskey();
      if (regError) throw regError;
      // Rename to something mum-friendly if the API returned an id
      if (data?.id) {
        await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: "Mum's phone",
        });
      }
      setMessage(
        "Saved! Next time, use “Fingerprint / Face ID” on the sign-in screen — no email needed."
      );
      await refresh();
    } catch (err) {
      setError(formatPasskeyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    const supabase = createClient();
    try {
      const { error: delError } = await supabase.auth.passkey.delete({
        passkeyId: id,
      });
      if (delError) throw delError;
      setMessage("Passkey removed.");
      await refresh();
    } catch (err) {
      setError(formatPasskeyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <Card className="soft-card rounded-3xl border-0 ring-1 ring-primary/10">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Fingerprint / Face ID</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            This browser or phone doesn&apos;t support passkeys. Use Safari or
            Chrome on a modern iPhone or Android phone.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasPasskey = passkeys.length > 0;

  return (
    <Card className="soft-card rounded-3xl border-0 ring-1 ring-primary/15">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-soft-rose text-primary">
            <Fingerprint className="size-6" />
          </span>
          <div>
            <CardTitle className="text-xl font-bold">
              {hasPasskey
                ? "Fingerprint / Face ID is on"
                : "Set up fingerprint / Face ID"}
            </CardTitle>
            <CardDescription className="mt-1 text-base leading-relaxed">
              {hasPasskey
                ? "Next time you open the app, tap “Fingerprint / Face ID” on the sign-in screen — no email needed."
                : "Do this once on this phone. After that you can sign in with your fingerprint or Face ID instead of email."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking…
          </p>
        ) : (
          <>
            {passkeys.map((pk) => (
              <div
                key={pk.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-soft-rose/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span className="truncate">
                      {pk.friendly_name || "This phone"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Added {new Date(pk.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                  disabled={busy}
                  onClick={() => remove(pk.id)}
                  aria-label="Remove passkey"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              size="lg"
              className="h-12 w-full rounded-full text-base font-bold shadow-md shadow-primary/20"
              disabled={busy}
              onClick={register}
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" />
                  Waiting for phone…
                </>
              ) : hasPasskey ? (
                "Add another device passkey"
              ) : (
                "Set up fingerprint / Face ID"
              )}
            </Button>
          </>
        )}

        {message && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p
            className="rounded-2xl bg-destructive/10 px-4 py-3 text-base text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
