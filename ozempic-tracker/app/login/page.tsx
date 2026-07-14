import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getUser } from "@/lib/data";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-soft-rose text-primary shadow-sm ring-4 ring-primary/10">
          <Heart className="size-8 fill-primary/30" aria-hidden />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Mum Fitness
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-lg leading-relaxed text-muted-foreground">
          Your weekly dose, weight in{" "}
          <span className="font-semibold text-primary">kg</span>, and progress
          — sign in with Google.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="soft-card h-48 animate-pulse rounded-3xl bg-card/80" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
