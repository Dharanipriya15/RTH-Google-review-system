import type { Metadata } from "next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  // Root page shares the layout segment, so the title template does not apply here.
  title: { absolute: "Raade's Tea House" },
  description:
    "A calm, private way for guests of Raade's Tea House to share their experience.",
};

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 size-96 rounded-full bg-green-tint blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-gold-tint blur-3xl"
      />

      <div className="animate-rise relative w-full max-w-xl">
        <div className="card overflow-hidden text-center">
          <div className="panel-green grain px-6 pb-9 pt-11">
            <div className="relative flex justify-center">
              <BrandLogo variant="bare" size="lg" priority />
            </div>
            <p className="eyebrow eyebrow-on-dark relative mt-5">Raade&apos;s Tea House</p>
            <h1 className="display-hero relative mt-3 text-white">
              Every visit,
              <br />
              worth hearing about
            </h1>
          </div>

          <div className="stagger px-6 py-9 sm:px-10">
            <p className="mx-auto max-w-md text-ink-soft">
              A quiet, private space for our guests to tell us how things went — and for
              our team to listen closely.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/review/raades-tea-house" fullWidth className="sm:w-auto">
                Rate your experience
              </ButtonLink>
              <ButtonLink
                href="/admin"
                variant="secondary"
                fullWidth
                className="sm:w-auto"
              >
                Team sign-in
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
