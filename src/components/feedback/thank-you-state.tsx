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
      <h2 className="display-md mt-5 text-ink">
        {isLowRating ? "Thank you for telling us" : "Thank you"}
      </h2>
      <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-ink-muted">
        {isLowRating
          ? "Your feedback goes straight to our team — privately, never to a public review site. We read every message and use it to do better."
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
