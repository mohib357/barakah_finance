import { getInitials, avatarColor } from "@/lib/utils/cn";

const MEMBERS = [
  { name: "জনাব সাইফুল্লাহ",               phone: "০১৭৩৭১৩১০৯৫", role: "সভাপতি" },
  { name: "মাওলানা ইমরান হোসাইন কাসেমী",   phone: "০১৩১৭১২১৮২৬", role: "সহ-সভাপতি" },
  { name: "জনাব মুহিব্বুল্লাহ আজাদ",        phone: "০১৭১৭২৬৭০০৫", role: "সাধারণ সম্পাদক" },
  { name: "জনাব মাসুম বিল্লাহ",            phone: "০১৭৫০৮২৭৭৬০", role: "যুগ্ম সম্পাদক" },
  { name: "জনাব আনোয়ার হোসেন সেলিম",       phone: "০১৬৪৮২৪৮০০৬", role: "কোষাধ্যক্ষ" },
  { name: "জনাব আবু সুফিয়ান",             phone: "০১৭৪৩০৬৮০৬৩", role: "সহকারী কোষাধ্যক্ষ" },
  { name: "মাওলানা রাকিবুল ইসলাম",         phone: "০১৯১৯২৭২৫৯৬", role: "অপারেশন ম্যানেজার" },
  { name: "হাফেজ সাইফুল ইসলাম",           phone: "০১৭৯৮৯৭১০৫২", role: "অপারেশন ম্যানেজার" },
  { name: "জনাব আমিনুল ইসলাম",            phone: "০১৭৭৩২৫৫৪৩৫", role: "অপারেশন ম্যানেজার" },
  { name: "মাওলানা আব্দুল হান্নান",          phone: "০১৩০৮৭৫৭৬৯২", role: "শরিয়াহ পরামর্শক" },
  { name: "জনাব শেখ তামজিদ আহমাদ",        phone: "০১৩৩৮৩১৬৭১১", role: "আইটি ও মিডিয়া" },
  { name: "হা. মাহমুদুল হাসান",            phone: "০১৩১১৮৫৬৩০৭", role: "সদস্য সমন্বয়ক" },
  { name: "হা. মুশফিকুর রহমান নাঈম",       phone: "০১৩১০১১৩১০৭", role: "সদস্য সমন্বয়ক" },
  { name: "ক্বারী এমদাদুল্লাহ",             phone: "০১৭৮৪৮৭০০৩৮", role: "সদস্য সমন্বয়ক" },
  { name: "জনাব মিজানুর রহমান",            phone: "০১৮১৬৩৩৮৮৯০", role: "সদস্য সমন্বয়ক" },
  { name: "জনাব শাহ আলম",               phone: "০১৭১৬২২৫৯২৫", role: "সদস্য সমন্বয়ক" },
  { name: "মাওলানা আবু রায়হান মাহফুজ",    phone: "০১৭০৩২১১৫৮৭", role: "সদস্য সমন্বয়ক" },
  { name: "মাওলানা আব্দুস সামাদ কাসেমী",   phone: "০১৭২৩৭৯১৮৭৬", role: "সদস্য সমন্বয়ক" },
];

export default function CommitteeSection() {
  return (
    <section id="members" className="py-20 px-5" style={{ background: "linear-gradient(180deg,#f0f9f4,#FDFAF3)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12 reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">প্রতিষ্ঠাতা সদস্যবৃন্দ</span>
          <h2 className="text-3xl font-bold text-[#0D2B1A]" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            আমাদের দলের পরিচয়
          </h2>
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {MEMBERS.map((m, i) => (
            <div
              key={i}
              className="reveal group flex flex-col items-center text-center rounded-2xl border border-[#1D9E75]/10 bg-white p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-base mb-2 shadow-md"
                style={{ background: avatarColor(i) }}
              >
                {getInitials(m.name)}
              </div>
              <h4 className="text-xs font-bold text-[#0D2B1A] leading-tight mb-0.5 line-clamp-2">{m.name}</h4>
              <span className="text-[10px] text-[#1D9E75] font-semibold">{m.role}</span>
              <p className="text-[10px] text-[#4A5A4A] mt-1">{m.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
