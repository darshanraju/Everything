/** Friendly error messages for WebAuthn / passkey flows. */

export function isPasskeySupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function"
  );
}

export function formatPasskeyError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong with fingerprint / Face ID sign-in.";
  }

  const err = error as { message?: string; name?: string; code?: string };
  const message = (err.message ?? "").toLowerCase();
  const name = err.name ?? "";
  const code = err.code ?? "";

  if (
    name === "NotAllowedError" ||
    message.includes("not allowed") ||
    message.includes("cancel") ||
    message.includes("timed out")
  ) {
    return "That was cancelled. Try again when you’re ready.";
  }

  if (code === "passkey_disabled" || message.includes("passkey_disabled")) {
    return "Passkeys aren’t enabled yet on the server. Ask Darshan to turn them on in Supabase (Authentication → Passkeys).";
  }

  if (
    code === "webauthn_credential_not_found" ||
    message.includes("credential_not_found") ||
    message.includes("no credentials")
  ) {
    return "No fingerprint / Face ID is saved on this phone yet. Sign in with email once, then set up the passkey from Home.";
  }

  if (
    code === "webauthn_credential_exists" ||
    message.includes("credential_exists")
  ) {
    return "This phone already has a passkey for Mum Fitness.";
  }

  if (message.includes("https") || message.includes("secure context")) {
    return "Passkeys need a secure site (https) or localhost. Use the real app link on your phone.";
  }

  if (err.message) return err.message;
  return "Couldn’t use fingerprint / Face ID. Try again or use the email link.";
}
