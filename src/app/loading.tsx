export default function Loading() {
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="animate-fade text-center" role="status" aria-live="polite">
        <span className="mx-auto flex justify-center">
          <span className="spinner size-8 text-green" />
        </span>
        <p className="mt-4 text-sm text-ink-muted">One moment…</p>
      </div>
    </main>
  );
}
