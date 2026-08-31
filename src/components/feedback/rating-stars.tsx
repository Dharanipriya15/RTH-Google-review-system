"use client";

import type { Rating } from "@/lib/feedback/types";

const ratingLabels: Record<Rating, string> = { 1: "Very disappointed", 2: "Disappointed", 3: "Good", 4: "Very good", 5: "Excellent" };

export function RatingStars({ value, onChange }: { value: Rating | null; onChange: (rating: Rating) => void }) {
  return <div><div aria-label="Rate your experience" className="flex justify-center gap-1.5 sm:gap-2" role="radiogroup">{([1, 2, 3, 4, 5] as Rating[]).map((rating) => {
    const selected = value !== null && rating <= value;
    return <button aria-checked={value === rating} aria-label={`${rating} star${rating > 1 ? "s" : ""}: ${ratingLabels[rating]}`} className={`group grid h-12 w-12 touch-manipulation place-items-center rounded-full text-[2rem] leading-none transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tea active:scale-90 sm:h-14 sm:w-14 sm:text-[2.4rem] ${selected ? "scale-105 text-gold drop-shadow-[0_5px_6px_rgba(182,124,49,0.22)]" : "text-[#d9cfbd] hover:scale-110 hover:text-[#d7a55a]"}`} key={rating} onClick={() => onChange(rating)} role="radio" type="button">★</button>;
  })}</div><p aria-live="polite" className="mt-3 min-h-5 text-sm font-medium text-tea">{value ? ratingLabels[value] : "Tap a star to rate your experience"}</p></div>;
}
