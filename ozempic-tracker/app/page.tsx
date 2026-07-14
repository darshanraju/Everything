import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";

type SearchParams = Promise<{ code?: string; error?: string }>;

/**
 * If Supabase falls back to Site URL with ?code= (redirect URL not allow-listed),
 * forward the code to /auth/callback so the session can still be created.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  if (params.code) {
    const q = new URLSearchParams({
      code: params.code,
      next: "/dashboard",
    });
    redirect(`/auth/callback?${q.toString()}`);
  }

  if (params.error) {
    redirect(`/login?error=auth`);
  }

  const user = await getUser();
  redirect(user ? "/dashboard" : "/login");
}
