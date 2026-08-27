// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Landing Page (Public)
//  Route: /
//  Phase 2 will replace this stub with the full landing page.
// ═══════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--color-gold)] mb-2">
          বারাকাহ ফাইন্যান্স
        </h1>
        <p className="text-lg text-[var(--color-muted)]">
          সুদমুক্ত লেনদেনে সমৃদ্ধি সবার
        </p>
      </div>
      <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-sm text-[var(--color-muted)]">
        🚧 Phase 1 complete — database schema &amp; auth foundation ready.
        Phase 2 (full UI) is in progress.
      </p>
    </main>
  );
}
