import type { Metadata } from "next";

export const metadata: Metadata = { title: "গ্যালারি | বারাকাহ ফাইন্যান্স" };

export default function GalleryPage() {
  return (
    <div className="min-h-screen pt-6 px-5 max-w-6xl mx-auto">
      <div className="text-center py-20">
        <span className="text-5xl">🖼️</span>
        <h1 className="mt-4 text-2xl font-bold text-[#0D2B1A]">গ্যালারি</h1>
        <p className="text-gray-500 mt-2">শীঘ্রই আসছে — Phase 5-এ সম্পূর্ণ গ্যালারি যুক্ত হবে।</p>
      </div>
    </div>
  );
}
