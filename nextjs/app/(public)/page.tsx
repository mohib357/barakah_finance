// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Landing Page  /
// ═══════════════════════════════════════════════════════════
import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import WhySection from "@/components/landing/WhySection";
import InstallmentCalculator from "@/components/landing/InstallmentCalculator";
import ReviewCarousel from "@/components/landing/ReviewCarousel";
import QuickApply from "@/components/landing/QuickApply";
import HowItWorks from "@/components/landing/HowItWorks";
import PanelsSection from "@/components/landing/PanelsSection";
import CommitteeSection from "@/components/landing/CommitteeSection";

export const metadata: Metadata = {
  title: "বারাকাহ ফাইন্যান্স | সুদমুক্ত লেনদেনে সমৃদ্ধি সবার",
  description: "শরিয়াহসম্মত আর্থিক প্রতিষ্ঠান — কিস্তিতে পণ্য, করজে হাসানা, মাসিক সঞ্চয় ও হালাল বিনিয়োগ।",
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <WhySection />
      <InstallmentCalculator />
      <ReviewCarousel />
      <HowItWorks />
      <PanelsSection />
      <CommitteeSection />
      <QuickApply />
    </>
  );
}
