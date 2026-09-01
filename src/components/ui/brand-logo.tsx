import Image from "next/image";

type Size = "sm" | "md" | "lg";

const px: Record<Size, number> = { sm: 40, md: 64, lg: 104 };

interface BrandLogoProps {
  /** "bare" for dark/green backgrounds; "coaster" adds a green disc for light backgrounds. */
  variant?: "bare" | "coaster";
  size?: Size;
  priority?: boolean;
  className?: string;
}

/**
 * Raade's Tea House emblem — the official white circular badge, used exactly
 * as supplied (white line-art on transparency). It only reads on a dark
 * surface, so `coaster` provides that surface on light backgrounds.
 */
export function BrandLogo({
  variant = "bare",
  size = "md",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const dimension = px[size];
  const img = (
    <Image
      src="/raade-logo.png"
      alt="Raade's Tea House"
      width={dimension}
      height={dimension}
      priority={priority}
      className="select-none"
      style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.16))" }}
    />
  );

  if (variant === "coaster") {
    return (
      <span
        className={`inline-grid place-items-center rounded-full bg-green-deep shadow-green ${className}`}
        style={{ padding: dimension * 0.18 }}
      >
        {img}
      </span>
    );
  }

  return <span className={`inline-block ${className}`}>{img}</span>;
}
