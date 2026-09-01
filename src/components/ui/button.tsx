import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "gold" | "onDark" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  gold: "btn btn-gold",
  onDark: "btn btn-on-dark",
  ghost: "btn-ghost",
};

interface CommonProps {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children">;
type AnchorProps = CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children"> & { href: string };

function classes(variant: Variant, fullWidth?: boolean, extra?: string) {
  return [variantClass[variant], fullWidth ? "w-full" : "", extra ?? ""]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  fullWidth,
  loading,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={classes(variant, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  fullWidth,
  children,
  className,
  ...rest
}: AnchorProps) {
  return (
    <Link className={classes(variant, fullWidth, className)} {...rest}>
      {children}
    </Link>
  );
}
