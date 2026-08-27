import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0D2B1A] text-white/70 text-sm">
      <div className="mx-auto max-w-[1400px] px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-full bg-[#C9A227] flex items-center justify-center text-[#0D2B1A] font-bold">ব</div>
              <div>
                <p className="font-bold text-white text-sm">বারাকাহ ফাইন্যান্স</p>
                <p className="text-xs text-[#C9A227]">Barakah Finance</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4">সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।</p>
            <div className="flex gap-3 text-lg">
              <a href="#" title="Facebook"  className="hover:text-white transition-colors">📘</a>
              <a href="#" title="WhatsApp"  className="hover:text-white transition-colors">📱</a>
              <a href="#" title="YouTube"   className="hover:text-white transition-colors">▶️</a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h5 className="font-bold text-white mb-3">দ্রুত লিঙ্ক</h5>
            <ul className="space-y-2">
              {[
                ["/",            "হোম"],
                ["/learn-more",  "আরও জানুন"],
                ["/gallery",     "গ্যালারি"],
                ["/timeline",    "টাইমলাইন"],
                ["/apply",       "সদস্য আবেদন"],
                ["/admin",       "অ্যাডমিন"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[#C9A227] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h5 className="font-bold text-white mb-3">আমাদের সেবা</h5>
            <ul className="space-y-2">
              {[
                "কিস্তিতে পণ্য ক্রয়",
                "করজে হাসানা",
                "মাসিক সঞ্চয়",
                "হালাল বিনিয়োগ",
                "চ্যারিটি সহযোগিতা",
              ].map((s) => (
                <li key={s}><span className="hover:text-[#C9A227] cursor-default transition-colors">{s}</span></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="font-bold text-white mb-3">যোগাযোগ</h5>
            <ul className="space-y-2">
              <li>সভাপতি: ০১৭৩৭১৩১০৯৫</li>
              <li>সম্পাদক: ০১৭১৭২৬৭০০৫</li>
              <li>কোষাধ্যক্ষ: ০১৬৪৮২৪৮০০৬</li>
              <li>
                <a href="mailto:info@barakahfinance.com" className="hover:text-[#C9A227] transition-colors">
                  info@barakahfinance.com
                </a>
              </li>
              <li>আদিতমারী, লালমনিরহাট</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="mx-auto max-w-[1400px] flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/40">
          <span>© ২০২৬ বারাকাহ ফাইন্যান্স। সর্বস্বত্ব সংরক্ষিত।</span>
          <span>শরিয়াহ পরামর্শক: মাওলানা আব্দুল হান্নান | মাও. ইমরান হোসাইন কাসেমী</span>
        </div>
      </div>
    </footer>
  );
}
