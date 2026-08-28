"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Shop Dynamic Route
//  Route: /shop/[slug]
//
//  This single dynamic route handles two cases:
//  1. /shop/[category-name]  → category filtered product list
//  2. /shop/[product-id]     → product detail page (cuid format)
//
//  Discrimination: if slug looks like a Prisma cuid (starts with
//  "cl" or is >20 chars and contains no spaces) → product detail.
//  Otherwise → category filter.
//
//  Website.txt spec: barakahfinancebd.com/shop/mobile
//                    barakahfinancebd.com/shop/{product-id}
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import NoticeBar from "@/components/layout/NoticeBar";
import Footer from "@/components/layout/Footer";
import ShopCatalog from "@/components/shop/ShopCatalog";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatMoney, toBengaliDigits } from "@/lib/utils/cn";
import { calcMethodA, calcMethodB } from "@/lib/utils/cn";

// ─────────────────────────────────────────────────────────────
// Heuristic: is this slug a product ID (cuid) or a category name?
// Cuid v1: starts with 'c', 25 chars. Cuid v2: 24 chars alphanumeric.
// Category names in Bangla contain non-ASCII chars.
// ─────────────────────────────────────────────────────────────
function isProductId(slug: string): boolean {
  // Category names contain Bengali characters (non-ASCII) or are common English words
  if (/[\u0980-\u09FF]/.test(slug)) return false;       // has Bengali chars → category
  if (slug.length < 20)              return false;       // too short for cuid
  if (/\s/.test(slug))               return false;       // has spaces → category
  return /^[a-z0-9]+$/i.test(slug);                     // alphanumeric only → likely cuid
}

interface Product {
  id: string; productCode: string; name: string; nameEn: string | null;
  category: string; description: string | null; purchasePrice: number;
  sellingPrice: number | null; stockQty: number; outOfStock: boolean;
  isFeatured: boolean; profitMethod: string; profitRate: number;
  images: { url: string; type: string; altText: string | null }[];
}

type CalcMode = "A" | "B";
const INSTALL_OPTIONS = [3, 6, 9, 12];

export default function ShopSlugPage() {
  return (
    <ToastProvider>
      <Navbar />
      <NoticeBar />
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
        <ShopSlugInner />
      </Suspense>
      <Footer />
    </ToastProvider>
  );
}

function ShopSlugInner() {
  const { slug }            = useParams<{ slug: string }>();
  const decodedSlug         = decodeURIComponent(slug ?? "");
  const showProductDetail   = isProductId(decodedSlug);

  if (!showProductDetail) {
    // Category view — reuse ShopCatalog with a pre-set filter
    return (
      <main className="min-h-screen bg-[#FDFAF3]">
        <ShopCatalog initialCategory={decodedSlug} />
      </main>
    );
  }

  return <ProductDetailView productId={decodedSlug} />;
}

// ─────────────────────────────────────────────────────────────
// Product Detail View (embedded, not a separate route)
// ─────────────────────────────────────────────────────────────
function ProductDetailView({ productId }: { productId: string }) {
  const router            = useRouter();
  const { data: session } = useSession();
  const { showToast }     = useToast();

  const [product,    setProduct]    = useState<Product | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [imgIdx,     setImgIdx]     = useState(0);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [calcMode,    setCalcMode]    = useState<CalcMode>("B");
  const [downPayment, setDownPayment] = useState("");
  const [profitRate,  setProfitRate]  = useState("");
  const [numInst,     setNumInst]     = useState(6);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.status === 404) { setNotFound(true); return; }
      const d = await res.json();
      if (d.product) {
        setProduct(d.product);
        setProfitRate(String(d.product.profitRate));
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#FDFAF3]"><Spinner size="lg" /></div>;

  if (notFound) {
    // If not found as product, treat slug as category
    return (
      <main className="min-h-screen bg-[#FDFAF3]">
        <ShopCatalog initialCategory={productId} />
      </main>
    );
  }

  if (!product) return null;

  const cost = product.purchasePrice;
  const down = parseFloat(downPayment) || 0;
  const rate = parseFloat(profitRate)  || product.profitRate;

  const plan = (() => {
    try {
      return calcMode === "A"
        ? calcMethodA(cost, 0, numInst, rate)
        : calcMethodB(cost, down, numInst, rate);
    } catch { return null; }
  })();

  const planA = plan && calcMode === "A" ? plan as ReturnType<typeof calcMethodA> : null;
  const planB = plan && calcMode === "B" ? plan as ReturnType<typeof calcMethodB> : null;

  async function submitApplication() {
    if (!session?.user) { router.push(`/login?callbackUrl=/shop/${productId}`); return; }
    if (!plan) { showToast("হিসাব সম্পন্ন করুন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          customerId:      session.user.id,
          productId,
          purchaseCost:    cost,
          downPayment:     down,
          profitMethod:    calcMode === "A" ? "FULL_COST_BASED" : "FINANCED_AMOUNT",
          profitRate:      rate,
          numInstallments: numInst,
        }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "আবেদন ব্যর্থ।", "error"); return; }
      showToast(`✅ আবেদন জমা হয়েছে। অর্ডার: ${d.orderNumber}`);
      setShowModal(false);
      router.push("/dashboard");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-screen bg-[#FDFAF3]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/"     className="hover:text-[#1D9E75]">হোম</Link><span>›</span>
        <Link href="/shop" className="hover:text-[#1D9E75]">শপ</Link><span>›</span>
        <span className="text-[#0D2B1A] font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative h-72 md:h-80 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 mb-3">
            {product.images?.[imgIdx]?.url ? (
              <Image src={product.images[imgIdx].url} alt={product.name} fill className="object-cover" sizes="(max-width:768px)100vw,50vw" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">📦</div>
            )}
            {product.outOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="rounded-2xl bg-red-600 px-5 py-2 text-white font-bold text-lg">স্টক শেষ</span>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={cn("relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                    imgIdx === i ? "border-[#1D9E75]" : "border-gray-100 hover:border-gray-300"
                  )}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1">
              <span className="text-xs text-[#1D9E75] font-semibold uppercase tracking-wide">{product.category}</span>
              <h1 className="text-xl font-bold text-[#0D2B1A] mt-0.5" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>
                {product.name}
              </h1>
              {product.nameEn && <p className="text-sm text-gray-400 mt-0.5">{product.nameEn}</p>}
            </div>
            {product.isFeatured && (
              <span className="rounded-lg bg-[#C9A227] px-2 py-0.5 text-[10px] font-bold text-[#0D2B1A] shrink-0">⭐ ফিচার্ড</span>
            )}
          </div>

          {product.description && <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.description}</p>}

          <div className="rounded-2xl border border-gray-100 bg-[#FDFAF3] p-4 mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#0D2B1A]">{formatMoney(cost)}</span>
              <span className="text-sm text-gray-400">ক্রয়মূল্য</span>
            </div>
            <p className="text-xs text-[#1D9E75] mt-1 font-medium">
              কিস্তিতে পাবেন — লাভ মাত্র {toBengaliDigits(product.profitRate)}% (শরিয়াহ পদ্ধতি)
            </p>
          </div>

          <div className="flex items-center gap-2 mb-5 text-sm">
            <span className={cn("h-2.5 w-2.5 rounded-full", product.outOfStock ? "bg-red-500" : "bg-green-500")} />
            <span className={product.outOfStock ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
              {product.outOfStock ? "স্টক নেই" : `${toBengaliDigits(product.stockQty)}টি স্টকে আছে`}
            </span>
          </div>

          <button
            onClick={() => { if (!session?.user) { router.push(`/login?callbackUrl=/shop/${productId}`); } else { setShowModal(true); } }}
            disabled={product.outOfStock}
            className={cn("w-full rounded-2xl py-3.5 text-base font-bold transition-all",
              product.outOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#1D9E75] text-white hover:bg-[#0F6E56] shadow-lg"
            )}
          >
            {product.outOfStock ? "স্টক নেই" : "📝 কিস্তিতে আবেদন করুন"}
          </button>

          {!session?.user && !product.outOfStock && (
            <p className="text-center text-xs text-gray-400 mt-2">আবেদন করতে লগইন প্রয়োজন।</p>
          )}
        </div>
      </div>

      {/* Calculator Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0D2B1A] text-white">
              <h2 className="font-bold" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>কিস্তি হিসাব করুন</h2>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                {([["B","📌 শরিয়াহ (অর্থায়িত)"],["A","📊 সম্পূর্ণ মূল্য"]] as [CalcMode,string][]).map(([m,lbl]) => (
                  <button key={m} onClick={() => setCalcMode(m)}
                    className={cn("flex-1 rounded-lg py-2 text-xs font-semibold transition-all",
                      calcMode === m ? "bg-white shadow text-[#0D2B1A]" : "text-gray-500"
                    )}>{lbl}</button>
                ))}
              </div>

              {calcMode === "B" && (
                <div className="rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/8 px-4 py-2.5 text-xs text-[#854F0B]">
                  📌 <strong>শরিয়াহ পদ্ধতি:</strong> শুধু অর্থায়িত অংশে লাভ — ডাউনপেমেন্টে নয়।
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {calcMode === "B" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ডাউনপেমেন্ট (৳)</label>
                    <input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)}
                      placeholder="০" min={0} max={cost - 1}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">লাভের হার (%)</label>
                  <input type="number" value={profitRate} onChange={(e) => setProfitRate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  />
                </div>
                <div className={calcMode === "A" ? "col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">কিস্তির সংখ্যা</label>
                  <div className="flex gap-2">
                    {INSTALL_OPTIONS.map((n) => (
                      <button key={n} onClick={() => setNumInst(n)}
                        className={cn("flex-1 rounded-lg py-2 text-xs font-semibold transition-all border",
                          numInst === n ? "bg-[#1D9E75] text-white border-[#1D9E75]" : "border-gray-200 text-gray-600"
                        )}>{toBengaliDigits(n)}</button>
                    ))}
                  </div>
                </div>
              </div>

              {plan && (
                <div className="rounded-xl bg-[#E1F5EE] p-4 text-xs space-y-1.5">
                  <div className="flex justify-between"><span>ক্রয়মূল্য:</span><strong>{formatMoney(cost)}</strong></div>
                  {calcMode === "B" && down > 0 && <div className="flex justify-between"><span>ডাউনপেমেন্ট:</span><strong>{formatMoney(down)}</strong></div>}
                  <div className="flex justify-between"><span>লাভ:</span><strong>{formatMoney(planA ? planA.profit : planB!.profit)}</strong></div>
                  <div className="flex justify-between border-t border-[#1D9E75]/20 pt-1.5">
                    <span className="font-bold">মোট বিক্রয়মূল্য:</span>
                    <strong className="text-[#1D9E75] text-sm">{formatMoney(planA ? planA.total : planB!.totalSale)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">প্রতি কিস্তি ({toBengaliDigits(numInst)} মাস):</span>
                    <strong className="text-[#1D9E75] text-sm">{formatMoney(planA ? planA.perInstall : planB!.perInstall)}</strong>
                  </div>
                </div>
              )}

              <button onClick={submitApplication} disabled={submitting || product.outOfStock || !plan}
                className="w-full rounded-xl bg-[#1D9E75] py-3.5 text-sm font-bold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Spinner size="sm" />}
                📝 কিস্তিতে আবেদন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
