"use client";

import { useState } from "react";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { RatingStars } from "@/components/feedback/rating-stars";
import { RedirectingState } from "@/components/feedback/redirecting-state";
import { ThankYouState } from "@/components/feedback/thank-you-state";
import { GOOGLE_REVIEW_MIN_RATING, type Rating } from "@/lib/feedback/types";

interface FeedbackExperienceProps {
  businessSlug: string;
  businessName: string;
  positiveRatingMin: number;
}

type Step =
  | { name: "collecting" }
  | { name: "thank_you" }
  | { name: "redirecting"; redirectUrl: string };

function RatingIntro({ isLowRating }: { isLowRating: boolean }) {
  if (isLowRating) {
    return (
      <>
        <h2 className="mt-8 font-display text-2xl text-ink">
          Tell us how we can do better
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          This goes privately to our team — it is not posted publicly and is never
          sent to Google.
        </p>
      </>
    );
  }
  return (
    <>
      <h2 className="mt-8 font-display text-2xl text-ink">Thank you!</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        We&apos;d love to hear anything else you want to share.
      </p>
    </>
  );
}

export function FeedbackExperience({
  businessSlug,
  businessName,
  positiveRatingMin,
}: FeedbackExperienceProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [step, setStep] = useState<Step>({ name: "collecting" });

  // Ratings below this get the private feedback form, never Google. The server
  // enforces the same rule; this is only for what the customer sees.
  const googleThreshold = Math.max(GOOGLE_REVIEW_MIN_RATING, positiveRatingMin);
  const isLowRating = rating !== null && rating < googleThreshold;

  function chooseRating(next: Rating) {
    setRating(next);
    setStep({ name: "collecting" });
  }

  function startAgain() {
    setRating(null);
    setStep({ name: "collecting" });
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-cream px-4 py-6 sm:px-6 sm:py-10">
      <div
        aria-hidden="true"
        className="absolute -left-28 -top-24 h-72 w-72 rounded-full bg-[#e8d7b4]/45 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-[#d6e1cf]/45 blur-3xl"
      />
      <section className="relative w-full max-w-lg rounded-[2rem] border border-[#e7dac1] bg-white/95 px-5 py-8 text-center shadow-[0_18px_55px_rgba(70,58,34,0.12)] sm:px-10 sm:py-10">
        <p className="eyebrow">{businessName}</p>

        {step.name === "redirecting" ? (
          <RedirectingState redirectUrl={step.redirectUrl} />
        ) : step.name === "thank_you" ? (
          <ThankYouState isLowRating={isLowRating} onStartAgain={startAgain} />
        ) : (
          <>
            <h1 className="mt-4 font-display text-[2.35rem] leading-[1.08] text-ink sm:text-5xl">
              How was your experience?
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-base">
              Your feedback helps us serve you better.
            </p>
            <div className="mt-8">
              <RatingStars onChange={chooseRating} value={rating} />
            </div>

            {rating !== null && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <RatingIntro isLowRating={isLowRating} />
                <FeedbackForm
                  key={rating}
                  businessSlug={businessSlug}
                  rating={rating}
                  isLowRating={isLowRating}
                  onSuccess={({ outcome, redirectUrl }) => {
                    // Hard client-side rule: 1–3 stars are ALWAYS private and
                    // never go to Google — even if the API response says
                    // outcome "redirect_to_google" and includes a redirectUrl,
                    // we ignore it here. Only 4–5 stars may redirect.
                    const ratingAllowsGoogle = rating >= GOOGLE_REVIEW_MIN_RATING;
                    if (
                      ratingAllowsGoogle &&
                      outcome === "redirect_to_google" &&
                      redirectUrl
                    ) {
                      setStep({ name: "redirecting", redirectUrl });
                    } else {
                      setStep({ name: "thank_you" });
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
