export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-red-500">অ্যাক্সেস অস্বীকৃত</h1>
      <p className="text-[var(--color-muted)]">
        এই পেজটি দেখার অনুমতি আপনার নেই।
      </p>
      <a href="/" className="text-[var(--color-gold)] underline">
        মূল পেজে ফিরে যান
      </a>
    </main>
  );
}
