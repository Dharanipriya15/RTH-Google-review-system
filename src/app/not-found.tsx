import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="animate-rise w-full max-w-sm text-center">
        <div className="card overflow-hidden">
          <div className="panel-green grain px-6 py-8">
            <div className="relative flex justify-center">
              <BrandLogo variant="bare" size="md" />
            </div>
          </div>
          <div className="px-7 py-8">
            <p className="eyebrow">404</p>
            <h1 className="display-md mt-2 text-ink">This page isn&apos;t steeping here</h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              The link may be old or mistyped.
            </p>
            <div className="mt-6">
              <ButtonLink href="/">Back to start</ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
