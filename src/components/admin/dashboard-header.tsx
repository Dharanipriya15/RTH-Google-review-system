import { BrandLogo } from "@/components/ui/brand-logo";
import { SignOutButton } from "@/components/admin/sign-out-button";

export function DashboardHeader({ name }: { name?: string | null }) {
  return (
    <header className="border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-green-deep">
            <BrandLogo variant="bare" size="sm" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[0.95rem] text-ink">Raade&apos;s Tea House</p>
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink-muted">
              Feedback
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {name && (
            <span className="hidden text-sm text-ink-muted sm:inline">{name}</span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
