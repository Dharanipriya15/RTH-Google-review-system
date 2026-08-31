import Link from "next/link";

export default function Home() {
  return <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16"><p className="eyebrow">Raade&apos;s Tea House</p><h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-6xl">Thoughtful feedback, beautifully handled.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">A private, respectful feedback experience for every guest and a clear workspace for the team.</p><div className="mt-10 flex flex-wrap gap-3"><Link className="button button-primary" href="/review/raades-tea-house">Open customer experience</Link><Link className="button button-secondary" href="/admin">Open admin</Link></div></main>;
}
