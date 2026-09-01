/** Animated success checkmark — a drawn ring + tick, no bounce. */
export function SuccessMark({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      role="img"
      aria-label="Success"
    >
      <circle
        cx="36"
        cy="36"
        r="33"
        stroke="var(--color-green)"
        strokeWidth="2"
        opacity="0.28"
        style={{ transformOrigin: "center", animation: "ring-grow 0.5s var(--ease-out-soft) both" }}
      />
      <circle cx="36" cy="36" r="24" fill="var(--color-green-tint)" />
      <path
        d="M26 37.5l7 7L47 30"
        stroke="var(--color-green-deep)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 40,
          animation: "draw 0.5s var(--ease-out-soft) 0.25s forwards",
        }}
      />
    </svg>
  );
}
