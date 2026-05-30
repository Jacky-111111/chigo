import Link from "next/link";
import { redirect } from "next/navigation";
import { Utensils } from "lucide-react";
import { signIn, signInWithGoogle, signUp } from "@/lib/actions/auth-actions";
import { getCurrentUser } from "@/lib/services/profiles";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Login",
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const configured = hasSupabaseEnv();

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="page-shell grid min-h-[calc(100vh-64px)] items-center gap-8 lg:grid-cols-[1fr_440px]">
        <div className="grid gap-6">
          <Link href="/" className="inline-flex items-center gap-3 text-[var(--brand-eggplant)]">
            <span className="grid size-11 place-items-center rounded-[8px] bg-[var(--brand-eggplant)] text-white">
              <Utensils size={22} />
            </span>
            <span className="text-2xl font-black">ChiGo</span>
          </Link>

          <div className="max-w-xl">
            <h1 className="text-4xl font-black leading-tight text-[var(--brand-eggplant)] md:text-5xl">
              Find food plans around campus, fast.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-[var(--text-muted)]">
              Sign in to discover nearby restaurants, start an immediate dining invite, and make
              CMU meals a little less solo.
            </p>
          </div>

          <div className="grid max-w-xl gap-3 sm:grid-cols-3">
            <div className="rounded-[8px] border border-[var(--border)] bg-white p-4">
              <p className="text-sm font-bold text-[var(--brand-eggplant)]">Nearby</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Seeded CMU restaurant list.</p>
            </div>
            <div className="rounded-[8px] border border-[var(--border)] bg-white p-4">
              <p className="text-sm font-bold text-[var(--brand-eggplant)]">Instant</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Create invites for now or soon.</p>
            </div>
            <div className="rounded-[8px] border border-[var(--border)] bg-white p-4">
              <p className="text-sm font-bold text-[var(--brand-eggplant)]">Social</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Join open campus meals.</p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[var(--brand-eggplant)]">Welcome</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Use email/password or Google to continue.
            </p>
          </div>

          {!configured ? (
            <div className="mb-4 rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
              Supabase env vars are not configured yet. Add them from `.env.example` before testing auth.
            </div>
          ) : null}

          {params?.error ? (
            <div className="mb-4 rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
              {params.error}
            </div>
          ) : null}

          {params?.message ? (
            <div className="mb-4 rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
              {params.message}
            </div>
          ) : null}

          <form action={signIn} className="grid gap-4">
            <Field label="Email">
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" autoComplete="current-password" required minLength={6} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="submit">Sign in</Button>
              <Button formAction={signUp} type="submit" variant="secondary">
                Create account
              </Button>
            </div>
          </form>

          <form action={signInWithGoogle} className="mt-3">
            <Button type="submit" variant="secondary" className="w-full">
              Continue with Google
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
