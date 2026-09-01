"use client";

import { useRef, useState } from "react";
import type { Rating } from "@/lib/feedback/types";

const RATINGS: Rating[] = [1, 2, 3, 4, 5];

const ratingLabels: Record<Rating, string> = {
  1: "Very disappointing",
  2: "Disappointing",
  3: "It was fine",
  4: "Really good",
  5: "Exceptional",
};

const STAR_PATH =
  "M12 2.6l2.7 5.94 6.3.72-4.7 4.3 1.24 6.24L12 16.9l-5.54 2.9L7.7 13.56 3 9.26l6.3-.72z";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-full w-full transition-transform duration-200"
      aria-hidden="true"
    >
      <path
        d={STAR_PATH}
        fill={filled ? "var(--color-gold)" : "transparent"}
        stroke={filled ? "var(--color-gold)" : "#cdbf9f"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RatingStars({
  value,
  onChange,
}: {
  value: Rating | null;
  onChange: (rating: Rating) => void;
}) {
  const [hover, setHover] = useState<Rating | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hover ?? value;

  function handleKey(event: React.KeyboardEvent, index: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(4, index + 1);
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, index - 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 4;
    if (next !== null) {
      event.preventDefault();
      onChange(RATINGS[next]);
      refs.current[next]?.focus();
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        role="radiogroup"
        aria-label="Rate your visit from 1 to 5 stars"
        className="flex items-center justify-center gap-1.5 sm:gap-2.5"
        onMouseLeave={() => setHover(null)}
      >
        {RATINGS.map((rating, index) => {
          const filled = shown !== null && rating <= shown;
          const isSelected = value === rating;
          return (
            <button
              key={rating}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${rating} ${rating === 1 ? "star" : "stars"} — ${ratingLabels[rating]}`}
              tabIndex={isSelected || (value === null && index === 0) ? 0 : -1}
              onClick={() => onChange(rating)}
              onMouseEnter={() => setHover(rating)}
              onFocus={() => setHover(rating)}
              onBlur={() => setHover(null)}
              onKeyDown={(event) => handleKey(event, index)}
              className={`grid size-12 touch-manipulation place-items-center rounded-full p-1.5 outline-none transition-transform duration-200 ease-out active:scale-90 sm:size-14 ${
                filled ? "scale-[1.06]" : "hover:scale-110"
              }`}
            >
              <span className={filled ? "drop-shadow-[0_4px_8px_rgba(169,121,31,0.28)]" : ""}>
                <span className="block size-8 sm:size-9">
                  <Star filled={filled} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p
        aria-live="polite"
        className="mt-3 min-h-6 text-sm font-semibold text-green"
      >
        {shown ? ratingLabels[shown] : "Tap a star to begin"}
      </p>
    </div>
  );
}
