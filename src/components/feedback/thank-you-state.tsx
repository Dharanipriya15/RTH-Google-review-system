
"use client";

export function ThankYouState({
  isLowRating,
  onStartAgain,
}: {
  isLowRating: boolean;
  onStartAgain: () => void;
}) {
  return (
    <div className="py-4 text-center">
      <div
        aria-hidden="true"
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#edf2e9] text-3xl"
      >
        ♥
      </div>
      <h2 className="mt-6 font-display text-3xl text-ink">Thank you for your feedback</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-muted">
        {isLowRating
          ? "Your feedback has gone privately to our team — not to any public review site. We read every message and use it to put things right."
          : "We appreciate you taking the time to share your experience with us."}
      </p>
      <button
        className="mt-6 text-sm font-semibold text-tea underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tea"
        onClick={onStartAgain}
        type="button"
      >
        Rate another visit
      </button>
    </div>
  );
}
