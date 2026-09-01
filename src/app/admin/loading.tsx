export default function AdminLoading() {
  return (
    <div className="min-h-svh bg-paper">
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5 sm:px-8">
          <div className="skeleton size-9 rounded-full" />
          <div className="skeleton h-4 w-40" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10" role="status" aria-label="Loading dashboard">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton mt-3 h-9 w-64" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton mt-4 h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="skeleton mt-6 h-52 rounded-lg" />
        <div className="skeleton mt-6 h-64 rounded-lg" />
      </div>
    </div>
  );
}
