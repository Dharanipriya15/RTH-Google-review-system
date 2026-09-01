"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/admin/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="btn-ghost text-ink-muted"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
