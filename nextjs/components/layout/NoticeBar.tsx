"use client";
import { useEffect, useState, useRef } from "react";

interface Notice {
  id: string;
  text: string;
  color?: string;
  bgColor?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontSize?: number;
  style?: string; // "bold" | "italic" | "normal"
}

const DEFAULT_NOTICES: Notice[] = [
  { id: "n1", text: "🌙 বারাকাহ ফাইন্যান্সে আপনাকে স্বাগতম! সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।", color: "#fff", style: "bold" },
  { id: "n2", text: "📢 মাসিক সঞ্চয়ের শেষ তারিখ প্রতি মাসের ১৫ তারিখ।", color: "#F0D78A", style: "normal" },
  { id: "n3", text: "🤝 করজে হাসানা — বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা। যোগ্য সদস্যরা আবেদন করুন।", color: "#a7f3d0", style: "normal" },
  { id: "n4", text: "📦 কিস্তিতে পণ্য কিনুন — মাত্র ১০% লাভে ৬ মাসে পরিশোধ।", color: "#fde68a", style: "normal" },
];

export default function NoticeBar() {
  const [notices, setNotices] = useState<Notice[]>(DEFAULT_NOTICES);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/public/notices")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setNotices(data);
      })
      .catch(() => {}); // stay with defaults on any error
  }, []);

  // Build style per notice
  function noticeStyle(n: Notice): React.CSSProperties {
    const style = n.style ?? "normal";
    return {
      color:      n.color ?? "#fff",
      fontWeight: (style === "bold" || n.fontBold) ? 700 : 400,
      fontStyle:  (style === "italic" || n.fontItalic) ? "italic" : "normal",
      fontSize:   n.fontSize ? `${n.fontSize}px` : "13px",
      padding:    "0 28px",
      whiteSpace: "nowrap",
    };
  }

  // Duplicate items for seamless loop
  const items = [...notices, ...notices];

  return (
    <div
      className="relative flex items-center overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #9A7D0A 0%, #C9A227 30%, #C9A227 70%, #9A7D0A 100%)",
        minHeight: "36px",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
      }}
    >
      {/* Label */}
      <div className="shrink-0 flex items-center gap-1.5 pl-4 pr-3 border-r border-black/20 h-full">
        <span className="text-[11px] font-bold text-[#0D2B1A] uppercase tracking-widest">📢 নোটিশ</span>
      </div>

      {/* Scrolling track */}
      <div
        className="relative overflow-hidden flex-1"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="inline-flex"
          style={{
            animation: `noticeScroll 40s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {items.map((n, i) => (
            <span key={`${n.id}-${i}`} style={noticeStyle(n)}>
              {n.text}
            </span>
          ))}
        </div>
      </div>

      {/* Keyframes injected once via a style tag */}
      <style jsx>{`
        @keyframes noticeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
