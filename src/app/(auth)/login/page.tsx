"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { signIn } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await signIn(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <div className="animate-fade-up opacity-0">
      {/* Logo mark */}
      <div className="mb-8 flex flex-col items-center">
        <div className="amber-glow mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-amber/30 bg-amber/10">
          <span className="font-display text-2xl font-semibold text-amber">
            W
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your Writer&apos;s Room
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm">
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="h-11 bg-background/50 transition-colors focus:bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              required
              className="h-11 bg-background/50 transition-colors focus:bg-background"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button
            type="submit"
            className="h-11 w-full bg-amber font-medium text-background transition-all hover:bg-amber/90 hover:shadow-lg hover:shadow-amber/20"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card/80 px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2 border-border/60 text-muted-foreground transition-all hover:border-amber/30 hover:text-foreground"
            onClick={() => router.push("/dashboard")}
          >
            <UserRound className="h-4 w-4" />
            Continue as Guest
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-amber transition-colors hover:text-amber/80"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
