import type { Metadata } from "next";
import { AdminSignInForm } from "@/components/auth/admin-sign-in-form";
import { BrandLogo } from "@/components/ui/brand-logo";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Team sign-in",
  robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 size-96 -translate-x-1/2 rounded-full bg-green-tint blur-3xl"
      />
      <div className="animate-rise relative w-full max-w-sm">
        <div className="card overflow-hidden text-center">
          <div className="panel-green grain px-6 pb-7 pt-9">
            <div className="relative flex justify-center">
              <BrandLogo variant="bare" size="md" priority />
            </div>
            <p className="eyebrow eyebrow-on-dark relative mt-4">Team sign-in</p>
          </div>
          <div className="px-6 py-8 sm:px-8">
            <h1 className="display-md text-ink">Welcome back</h1>
            {isSupabaseConfigured() ? (
              <AdminSignInForm />
            ) : (
              <p className="mt-5 text-sm leading-6 text-ink-muted">
                Add the Supabase environment variables before enabling sign-in.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
