"use client";

export function GoogleReviewButton({ url }: { url: string | null }) {
  if (!url) {
    return (
      <p
        role="alert"
        className="rounded-md border border-gold-soft bg-gold-tint px-4 py-3 text-center text-sm leading-6 text-[#6d4c14]"
      >
        The Google review link isn&apos;t set up yet — please ask a team member.
      </p>
    );
  }

  return (
    <a
      className="btn btn-gold w-full"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
        <path d="M12 2.6l2.7 5.94 6.3.72-4.7 4.3 1.24 6.24L12 16.9l-5.54 2.9L7.7 13.56 3 9.26l6.3-.72z" />
      </svg>
      Leave a Google review
      <span className="sr-only"> (opens Google in a new tab)</span>
    </a>
  );
}
