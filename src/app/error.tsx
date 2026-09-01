"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="animate-rise w-full max-w-sm text-center">
        <div className="card px-7 py-9">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="display-md mt-2 text-ink">Let&apos;s try that again</h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            The page didn&apos;t load properly. This is usually temporary.
          </p>
          <div className="mt-6">
            <Button onClick={reset}>Try again</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
