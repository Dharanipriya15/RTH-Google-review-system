"use client";

import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

type State = { kind: "idle" | "sending" | "sent" | "error" };

export function AdminSignInForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "sending" });
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
    setState({ kind: error ? "error" : "sent" });
  }

  if (state.kind === "sent") {
    return (
      <div className="mt-6 rounded-md border border-green-tint bg-green-tint px-4 py-4 text-sm leading-6 text-green-deep">
        Check <span className="font-semibold">{email}</span> for a secure sign-in link.
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4 text-left" onSubmit={handleSubmit}>
      <TextField
        label="Work email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={state.kind === "error" ? "Couldn't send the link. Try again." : undefined}
      />
      <Button type="submit" fullWidth loading={state.kind === "sending"}>
        {state.kind === "sending" ? "Sending…" : "Email me a sign-in link"}
      </Button>
      <p className="text-center text-caption">
        No password — we email you a one-time link.
      </p>
    </form>
  );
}
