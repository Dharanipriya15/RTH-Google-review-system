import type { ComponentProps } from "react";
export function Card({ className = "", ...props }: ComponentProps<"section">) { return <section className={`rounded-3xl border border-[#e5dac7] bg-white p-6 shadow-[0_12px_40px_rgba(70,58,34,0.08)] ${className}`} {...props} />; }
