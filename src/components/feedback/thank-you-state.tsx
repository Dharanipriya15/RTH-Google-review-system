"use client";

import { SuccessMark } from "@/components/ui/success-mark";
import { Button } from "@/components/ui/button";

export function ThankYouState({
  isLowRating,
  onStartAgain,
}: {
  isLowRating: boolean;
  onStartAgain: () => void;
}) {
  return (
    <div className="animate-rise py-2 text-center">
      <div className="mx-auto flex justify-center">
        <SuccessMark />
      </div>
      <h2 className="display-md mt-5 text-ink">Thank you</h2>
      <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-ink-muted">
        {isLowRating
          ? "Thank you for bringing this to our attention. Your satisfaction is our priority. We will provide a resolution within one to two business days."
          : "We really appreciate you taking a moment to share how your visit went."}
      </p>
      <div className="mt-6">
        <Button variant="ghost" onClick={onStartAgain}>
          Rate another visit
        </Button>
      </div>
    </div>
  );
}
