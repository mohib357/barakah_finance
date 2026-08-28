import type { Metadata } from "next";

export const metadata: Metadata = { title: "আরও জানুন | বারাকাহ ফাইন্যান্স" };

export default function LearnMorePage() {
  return (
    <div className="min-h-screen pt-6 px-5 max-w-4xl mx-auto">
      <div className="text-center py-20">
        <span className="text-5xl">📚</span>
        <h1 className="mt-4 text-2xl font-bold text-[#0D2B1A]">আরও জানুন</h1>
        <p className="text-gray-500 mt-2">বারাকাহ ফাইন্যান্স সম্পর্কে বিস্তারিত তথ্য — Phase 5-এ সম্পূর্ণ রূপে আসবে।</p>
      </div>
    </div>
  );
}
