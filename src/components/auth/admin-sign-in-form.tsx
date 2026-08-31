"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminSignInForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` } });
    setIsSubmitting(false);
    setMessage(error ? "We could not send a sign-in link. Please try again." : "Check your inbox for a secure sign-in link.");
  }

  return <form className="mt-8 space-y-4" onSubmit={handleSubmit}><label className="block text-left text-sm font-bold text-ink" htmlFor="email">Admin email</label><input className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-ink outline-none ring-tea focus:ring-2" id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="button button-primary w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Sending…" : "Email me a sign-in link"}</button>{message && <p className="text-sm text-ink-muted" role="status">{message}</p>}</form>;
}
