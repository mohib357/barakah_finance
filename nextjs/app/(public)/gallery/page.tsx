"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Gallery Page
//  Route: /gallery
//
//  Website.txt spec:
//  "গ্যালারিতে ক্লিক করলে আলাদা পেইজ অপেন হবে।
//   এই পেইজে একটি ব্যানারে ছবিগুলো রেন্ডমলি ইফেক্ট দিয়ে
//   চেইঞ্জ হতে থাকবে। ব্যানার সেকশনের নিচে হরিজিন্টালি
//   তিনটি বাটন থাকবে। (i) ছবি (ii) ভিডিও (iii) ইভেন্ট।"
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type GalleryTab = "photos" | "videos" | "events";

interface GalleryItem {
  id:           string;
  type:         string;
  title:        string | null;
  url:          string;
  thumbnailUrl: string | null;
  description:  string | null;
  eventDate:    string | null;
}

// Placeholder images shown when no data is fetched (beautiful Islamic geometric patterns via SVG data URIs)
const PLACEHOLDER_BANNER_COLORS = [
  "linear-gradient(135deg,#0D2B1A 0%,#1D9E75 50%,#C9A227 100%)",
  "linear-gradient(135deg,#163a24 0%,#185FA5 50%,#C9A227 100%)",
  "linear-gradient(135deg,#0D2B1A 0%,#854F0B 50%,#1D9E75 100%)",
  "linear-gradient(135deg,#163a24 0%,#3C3489 50%,#1D9E75 100%)",
  "linear-gradient(135deg,#0D2B1A 0%,#972B56 50%,#C9A227 100%)",
];

const BANNER_QUOTES = [
  "সুদমুক্ত লেনদেনে সমৃদ্ধি সবার",
  "শরিয়াহ সম্মত আর্থিক প্রতিষ্ঠান",
  "হালাল পথে সমৃদ্ধির স্বপ্ন",
  "ইসলামী অর্থনীতির আলোকে",
  "ভ্রাতৃত্ব ও সহযোগিতার নিদর্শন",
];

export default function GalleryPage() {
  const [tab,          setTab]          = useState<GalleryTab>("photos");
  const [items,        setItems]        = useState<GalleryItem[]>([]);
  const [bannerIdx,    setBannerIdx]    = useState(0);
  const [bannerFading, setBannerFading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Fetch gallery items from API
  useEffect(() => {
    fetch("/api/public/gallery")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .catch(() => {});
  }, []);

  // Banner auto-rotate with fade transition
  const rotateBanner = useCallback(() => {
    setBannerFading(true);
    setTimeout(() => {
      setBannerIdx((prev) => (prev + 1) % PLACEHOLDER_BANNER_COLORS.length);
      setBannerFading(false);
    }, 400);
  }, []);

  useEffect(() => {
    const iv = setInterval(rotateBanner, 4000);
    return () => clearInterval(iv);
  }, [rotateBanner]);

  const bannerPhotos = items.filter((i) => i.type === "photo").slice(0, 5);
  const tabItems = items.filter((i) => {
    if (tab === "photos") return i.type === "photo";
    if (tab === "videos") return i.type === "video";
    return i.type === "event";
  });

  const TABS: { key: GalleryTab; icon: string; label: string }[] = [
    { key: "photos", icon: "🖼️", label: "ছবি" },
    { key: "videos", icon: "🎬", label: "ভিডিও" },
    { key: "events", icon: "📅", label: "ইভেন্ট" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF3]">

      {/* ── Banner with random image/color effect ── */}
      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        {bannerPhotos.length > 0 ? (
          /* Real photo banner */
          <div
            className={cn("absolute inset-0 transition-opacity duration-500", bannerFading ? "opacity-0" : "opacity-100")}
          >
            <Image
              src={bannerPhotos[bannerIdx % bannerPhotos.length]?.url ?? ""}
              alt="Gallery banner"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        ) : (
          /* Placeholder gradient banner */
          <div
            className={cn("absolute inset-0 transition-opacity duration-500", bannerFading ? "opacity-0" : "opacity-100")}
            style={{ background: PLACEHOLDER_BANNER_COLORS[bannerIdx] }}
          >
            {/* Decorative Islamic geometric overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Banner content */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center text-center px-6",
            "transition-opacity duration-500",
            bannerFading ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/50 bg-[#C9A227]/15 px-4 py-1.5 text-xs font-semibold text-[#F0D78A] mb-4">
            📸 বারাকাহ ফাইন্যান্স গ্যালারি
          </div>
          <p
            className="text-xl sm:text-2xl md:text-3xl font-bold text-white"
            style={{ fontFamily: "'Noto Serif Bengali', serif" }}
          >
            {BANNER_QUOTES[bannerIdx]}
          </p>
          <p className="text-sm text-white/60 mt-2">Barakah Finance — সুদমুক্ত লেনদেনে সমৃদ্ধি সবার</p>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {PLACEHOLDER_BANNER_COLORS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setBannerIdx(i); }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === bannerIdx ? "w-6 bg-[#C9A227]" : "w-1.5 bg-white/40"
              )}
            />
          ))}
        </div>
      </div>

      {/* ── 3 Tab buttons ── */}
      <div className="sticky top-[70px] z-30 bg-[#FDFAF3] border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold border-b-2 transition-all",
                  tab === t.key
                    ? "border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE]/40"
                    : "border-transparent text-gray-500 hover:text-[#1D9E75] hover:bg-gray-50"
                )}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gallery grid ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {tabItems.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tabItems.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}
        >
          <div className="relative max-w-3xl w-full rounded-2xl bg-[#0D2B1A] overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors text-lg"
            >
              ✕
            </button>
            {selectedItem.type === "photo" && (
              <div className="relative h-64 sm:h-96">
                <Image src={selectedItem.url} alt={selectedItem.title ?? ""} fill className="object-contain" sizes="90vw" />
              </div>
            )}
            {selectedItem.type === "video" && (
              <video src={selectedItem.url} controls className="w-full max-h-96 object-contain bg-black" />
            )}
            {selectedItem.title && (
              <div className="px-5 py-4">
                <p className="font-semibold text-white">{selectedItem.title}</p>
                {selectedItem.description && <p className="text-sm text-white/60 mt-1">{selectedItem.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
    >
      {item.type === "photo" && (
        <Image
          src={item.thumbnailUrl ?? item.url}
          alt={item.title ?? "Gallery image"}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      )}
      {item.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0D2B1A]">
          <span className="text-4xl">▶️</span>
        </div>
      )}
      {item.type === "event" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1D9E75] to-[#0D2B1A] p-3 text-center">
          <span className="text-2xl mb-1">📅</span>
          <p className="text-xs font-semibold text-white line-clamp-2">{item.title}</p>
          {item.eventDate && (
            <p className="text-[10px] text-white/60 mt-1">{new Date(item.eventDate).toLocaleDateString("bn-BD")}</p>
          )}
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 text-white text-2xl transition-opacity">
          {item.type === "video" ? "▶️" : "🔍"}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: GalleryTab }) {
  const info = {
    photos: { icon: "🖼️", title: "কোনো ছবি নেই",   sub: "এখনো কোনো ছবি আপলোড করা হয়নি।" },
    videos: { icon: "🎬", title: "কোনো ভিডিও নেই",  sub: "এখনো কোনো ভিডিও আপলোড করা হয়নি।" },
    events: { icon: "📅", title: "কোনো ইভেন্ট নেই", sub: "এখনো কোনো ইভেন্ট যোগ করা হয়নি।" },
  }[tab];

  return (
    <div className="text-center py-20">
      <span className="text-6xl">{info.icon}</span>
      <h2 className="mt-4 text-xl font-bold text-[#0D2B1A]">{info.title}</h2>
      <p className="text-gray-400 mt-2 text-sm">{info.sub}</p>
    </div>
  );
}
