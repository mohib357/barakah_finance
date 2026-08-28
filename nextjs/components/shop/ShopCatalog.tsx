"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatMoney, toBengaliDigits } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { calcMethodB } from "@/lib/utils/cn";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Product {
  id:           string;
  productCode:  string;
  name:         string;
  nameEn:       string | null;
  category:     string;
  description:  string | null;
  purchasePrice:number;
  sellingPrice: number | null;
  stockQty:     number;
  isActive:     boolean;
  isFeatured:   boolean;
  outOfStock:   boolean;
  profitMethod: string;
  profitRate:   number;
  images:       { url: string; type: string }[];
}

interface Props {
  initialCategory?: string;
}

// ─────────────────────────────────────────────────────────────
// Wrapper to use Suspense for useSearchParams
// ─────────────────────────────────────────────────────────────
export default function ShopCatalog({ initialCategory }: Props) {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <ShopCatalogInner initialCategory={initialCategory} />
    </Suspense>
  );
}

function ShopCatalogInner({ initialCategory }: Props) {
  const router     = useRouter();
  const params     = useSearchParams();
  const { data: session } = useSession();

  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState(params.get("q") ?? "");
  const [category,   setCategory]   = useState(initialCategory ?? params.get("cat") ?? "");
  const [sort,       setSort]       = useState<"name" | "price_asc" | "price_desc">("name");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ active: "true" });
      if (search)   qs.set("q",        search);
      if (category) qs.set("category", category);
      const res = await fetch(`/api/products?${qs.toString()}`);
      const d   = await res.json();
      setProducts(d.products   ?? []);
      setCategories(d.categories ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { load(); }, [load]);

  // Sort products
  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc")  return a.purchasePrice - b.purchasePrice;
    if (sort === "price_desc") return b.purchasePrice - a.purchasePrice;
    return a.name.localeCompare(b.name);
  });

  function handleApply(productId: string) {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/shop/${productId}`);
    } else {
      router.push(`/shop/${productId}`);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0D2B1A]" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>
          🛒 পণ্য ক্যাটালগ
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          কিস্তিতে কিনুন — মাত্র ১০% লাভে, শরিয়াহ সম্মত পদ্ধতিতে
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar ── */}
        <aside className="lg:w-56 shrink-0">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sticky top-24">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">ক্যাটাগরি</h3>
            <nav className="space-y-1">
              <button
                onClick={() => setCategory("")}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                  !category ? "bg-[#1D9E75] text-white font-semibold" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                🏪 সব পণ্য ({toBengaliDigits(products.length)})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat === category ? "" : cat)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                      category === cat ? "bg-[#1D9E75] text-white font-semibold" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {CAT_ICONS[cat] ?? "📦"} {cat}
                    <span className={cn("ml-1 text-xs", category === cat ? "text-white/70" : "text-gray-400")}>
                      ({toBengaliDigits(count)})
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Search + sort bar */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="পণ্য খুঁজুন…"
                className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-white"
            >
              <option value="name">নাম অনুযায়ী</option>
              <option value="price_asc">মূল্য (কম → বেশি)</option>
              <option value="price_desc">মূল্য (বেশি → কম)</option>
            </select>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl">🔍</span>
              <p className="mt-4 text-gray-500">কোনো পণ্য পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onApply={() => handleApply(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ProductCard
// ─────────────────────────────────────────────────────────────
function ProductCard({ product: p, onApply }: { product: Product; onApply: () => void }) {
  // Quick installment preview — Method B (Shariah)
  const plan6 = (() => {
    try {
      return calcMethodB(p.purchasePrice, 0, 6, p.profitRate);
    } catch { return null; }
  })();

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image / placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {p.images?.[0]?.url ? (
          <Image
            src={p.images[0].url}
            alt={p.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {CAT_ICONS[p.category] ?? "📦"}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {p.isFeatured && (
            <span className="rounded-lg bg-[#C9A227] px-2 py-0.5 text-[10px] font-bold text-[#0D2B1A]">
              ⭐ ফিচার্ড
            </span>
          )}
          {p.outOfStock && (
            <span className="rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
              স্টক শেষ
            </span>
          )}
          {!p.outOfStock && p.stockQty <= 3 && (
            <span className="rounded-lg bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
              মাত্র {toBengaliDigits(p.stockQty)}টি বাকি
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-[#0D2B1A] text-sm leading-tight line-clamp-2">{p.name}</h3>
          <span className="shrink-0 rounded-lg bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-semibold text-[#1D9E75]">
            {p.category}
          </span>
        </div>

        {p.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{p.description}</p>
        )}

        {/* Price */}
        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#0D2B1A]">{formatMoney(p.purchasePrice)}</span>
            <span className="text-xs text-gray-400">ক্রয়মূল্য</span>
          </div>

          {/* Installment preview */}
          {plan6 && (
            <div className="rounded-xl bg-[#E1F5EE] px-3 py-2 text-xs space-y-0.5">
              <div className="flex justify-between text-gray-600">
                <span>মোট মূল্য ({p.profitRate}% লাভ)</span>
                <strong className="text-[#0D2B1A]">{formatMoney(plan6.totalSale)}</strong>
              </div>
              <div className="flex justify-between text-[#1D9E75]">
                <span>৬ কিস্তিতে (প্রতি মাস)</span>
                <strong>{formatMoney(plan6.perInstall)}</strong>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Link
              href={`/shop/${p.id}`}
              className="flex-1 rounded-xl border border-[#1D9E75] py-2 text-center text-xs font-semibold text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white transition-colors"
            >
              বিস্তারিত
            </Link>
            <button
              onClick={onApply}
              disabled={p.outOfStock}
              className={cn(
                "flex-1 rounded-xl py-2 text-xs font-semibold transition-colors",
                p.outOfStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#1D9E75] text-white hover:bg-[#0F6E56]"
              )}
            >
              {p.outOfStock ? "স্টক শেষ" : "আবেদন করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, string> = {
  "মোবাইল":       "📱",
  "ইলেকট্রনিক্স": "🖥️",
  "মোটরযান":      "🏍️",
  "গৃহস্থালি":    "🏠",
  "কৃষি":         "🌾",
  "শিক্ষা":       "📚",
  "স্বাস্থ্য":   "🏥",
  "পোশাক":        "👔",
};
