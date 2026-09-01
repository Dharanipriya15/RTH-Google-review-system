"use client";

import { useEffect } from "react";
import { GoogleReviewButton } from "@/components/feedback/google-review-button";

const REDIRECT_DELAY_MS = 1200;

export function RedirectingState({ redirectUrl }: { redirectUrl: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.assign(redirectUrl);
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [redirectUrl]);

  return (
    <div className="animate-rise py-2 text-center">
      <div className="mx-auto flex justify-center" aria-hidden="true">
        <span className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 rounded-full border border-green/25" />
          <span className="spinner size-7 text-green" />
        </span>
      </div>
      <h2 className="display-md mt-5 text-ink">One more thing</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink-muted" role="status">
        We&apos;re opening Google so you can share your review. If it doesn&apos;t open,
        use the button below.
      </p>
      <div className="mx-auto mt-6 max-w-xs">
        <GoogleReviewButton url={redirectUrl} />
      </div>
    </div>
  );
}
