export default function HowItWorks() {
  const steps = [
    { num: "১", title: "আবেদন",       desc: "অনলাইনে ফরম পূরণ করুন" },
    { num: "২", title: "যাচাই",        desc: "কমিটি পর্যালোচনা করবেন" },
    { num: "৩", title: "অনুমোদন",     desc: "পণ্য বাজার থেকে ক্রয়" },
    { num: "৪", title: "ডাউনপেমেন্ট", desc: "মোট মূল্যের ১/৬ জমা" },
    { num: "৫", title: "কিস্তি পরিশোধ", desc: "৫ মাসে সমান কিস্তিতে" },
  ];

  return (
    <section id="how" className="py-20 px-5" style={{ background: "linear-gradient(180deg,#FDFAF3,#f0f9f4)" }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12 reveal">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">প্রক্রিয়া</span>
          <h2 className="text-3xl font-bold text-[#0D2B1A]" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
            কীভাবে কাজ করে?
          </h2>
        </div>

        <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-0">
          {/* Connecting line */}
          <div className="hidden sm:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-[#1D9E75]/30 to-transparent" />

          {steps.map((s, i) => (
            <div key={i} className="relative flex-1 flex flex-col items-center text-center reveal" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="relative z-10 h-16 w-16 rounded-full bg-[#0D2B1A] border-2 border-[#C9A227] flex items-center justify-center text-[#C9A227] text-xl font-bold mb-4 shadow-lg">
                {s.num}
              </div>
              <h3 className="font-bold text-[#0D2B1A] text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-[#4A5A4A] max-w-[120px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
