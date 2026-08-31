import { AdminSignInForm } from "@/components/auth/admin-sign-in-form";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";

export default function AdminSignInPage() {
  return <main className="grid min-h-screen place-items-center bg-cream px-5"><Card className="w-full max-w-md text-center"><p className="eyebrow">Raade&apos;s Tea House</p><h1 className="mt-3 font-display text-3xl text-ink">Admin sign in</h1>{isSupabaseConfigured() ? <AdminSignInForm /> : <p className="mt-5 text-sm leading-6 text-ink-muted">Add the Supabase values to `.env.local` before enabling administrator sign-in.</p>}</Card></main>;
}
