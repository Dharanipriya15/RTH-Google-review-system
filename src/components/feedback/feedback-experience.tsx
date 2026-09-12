"use client";

import { useState } from "react";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { RatingStars } from "@/components/feedback/rating-stars";
import { RedirectingState } from "@/components/feedback/redirecting-state";
import { ThankYouState } from "@/components/feedback/thank-you-state";
import { BrandLogo } from "@/components/ui/brand-logo";
import { GOOGLE_REVIEW_MIN_RATING, type Rating } from "@/lib/feedback/types";

interface FeedbackExperienceProps {
  businessSlug: string;
  businessName: string;
  positiveRatingMin: number;
  /** Resolved, https-only Google review URL, or null if none is configured. */
  googleReviewUrl: string | null;
}

type Step =
  | { name: "collecting" }
  | { name: "thank_you" }
  | { name: "redirecting"; redirectUrl: string };

function RatingIntro({ isLowRating }: { isLowRating: boolean }) {
  return (
    <div className="animate-fade mt-7">
      {!isLowRating && <p className="eyebrow">Almost done</p>}
      <h2 className="display-md mt-1.5 text-ink">
        {isLowRating ? "Tell us how we can do better" : "Add a few words"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-muted">
        {isLowRating
          ? "This feedback goes directly to the management"
          : "Optional — but we love hearing what made your visit special."}
      </p>
    </div>
  );
}

export function FeedbackExperience({
  businessSlug,
  businessName,
  positiveRatingMin,
  googleReviewUrl,
}: FeedbackExperienceProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [step, setStep] = useState<Step>({ name: "collecting" });

  // The server enforces the same rule; this only controls what the guest sees.
  const googleThreshold = Math.max(GOOGLE_REVIEW_MIN_RATING, positiveRatingMin);
  const isLowRating = rating !== null && rating < googleThreshold;

  function chooseRating(next: Rating) {
    setRating(next);
    if (next >= googleThreshold) {
      // 4–5★: skip the form entirely and never touch the backend — nothing
      // is ever saved to Supabase or the Google Sheet for a positive rating.
      if (googleReviewUrl) {
        setStep({ name: "redirecting", redirectUrl: googleReviewUrl });
      } else {
        setStep({ name: "thank_you" });
      }
      return;
    }
    setStep({ name: "collecting" });
  }

  function startAgain() {
    setRating(null);
    setStep({ name: "collecting" });
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-28 size-80 rounded-full bg-green-tint blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-28 size-80 rounded-full bg-gold-tint blur-3xl"
      />

      <div className="animate-rise relative w-full max-w-lg">
        <div className="card overflow-hidden">
          {/* Letterhead */}
          <div className="panel-green grain relative px-6 pb-7 pt-9 text-center">
            <div className="relative flex justify-center">
              <BrandLogo variant="bare" size="lg" priority />
            </div>
            <p className="eyebrow eyebrow-on-dark relative mt-4">
              Your Satisfaction is important to us
            </p>
          </div>

          {/* Body */}
          <div className="px-5 py-8 text-center sm:px-9 sm:py-10">
            {step.name === "redirecting" ? (
              <RedirectingState redirectUrl={step.redirectUrl} />
            ) : step.name === "thank_you" ? (
              <ThankYouState isLowRating={isLowRating} onStartAgain={startAgain} />
            ) : (
              <>
                <h1 className="display-lg text-ink">
                  How is your experience with us today?
                </h1>
                <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-ink-muted sm:text-base">
                  It takes less than a minute and it genuinely helps us improve.
                </p>

                <div className="mt-7">
                  <RatingStars onChange={chooseRating} value={rating} />
                </div>

                {rating !== null && (
                  <>
                    <RatingIntro isLowRating={isLowRating} />
                    <FeedbackForm
                      key={rating}
                      businessSlug={businessSlug}
                      rating={rating}
                      isLowRating={isLowRating}
                      onSuccess={() => setStep({ name: "thank_you" })}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-caption">
          {businessName} · Your feedback is kept private
        </p>
      </div>
    </main>
  );
}
