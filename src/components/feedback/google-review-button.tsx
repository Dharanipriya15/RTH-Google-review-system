"use client";

export function GoogleReviewButton({ url }: { url: string | null }) {
  if (!url) {
    return (
      <p
        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm leading-6 text-amber-950"
        role="alert"
      >
        The Google review link isn&apos;t set up yet. Please ask a team member for help.
      </p>
    );
  }

  return (
    <a
      className="button button-secondary w-full gap-2 border-[#d7c295] bg-[#fffaf0] text-tea-dark hover:bg-[#f8ecd4]"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span aria-hidden="true">★</span> Leave a Google review
      <span className="sr-only"> (opens Google in a new tab)</span>
    </a>
  );
}
