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
    <div className="py-4 text-center">
      <div
        aria-hidden="true"
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#edf2e9] text-3xl"
      >
        ★
      </div>
      <h2 className="mt-6 font-display text-3xl text-ink">Thank you!</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-muted" role="status">
        We&apos;re taking you to Google to share your review. If nothing happens, use the
        button below.
      </p>
      <div className="mx-auto mt-7 max-w-sm">
        <GoogleReviewButton url={redirectUrl} />
      </div>
    </div>
  );
}
