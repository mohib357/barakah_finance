"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import NoticeBar from "@/components/layout/NoticeBar";
import Footer from "@/components/layout/Footer";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { cn, formatMoney, toBengaliDigits } from "@/lib/utils/cn";
import { calcMethodA, calcMethodB } from "@/lib/utils/cn";

interface Product {
  id: string; productCode: string; name: string; nameEn: string | null;
  category: string; description: string | null; purchasePrice: number;
  sellingPrice: number | null; stockQty: number; outOfStock: boolean;
  isFeatured: boolean; profitMethod: string; profitRate: number;
  images: { url: string; type: string; altText: string | null }[];
}

type CalcMode = "A" | "B";

export default function ProductDetailPage() {
  return (
    <ToastProvider>
      <Navbar />
      <NoticeBar />
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
        <ProductDetailInner />
      </Suspense>
      <Footer />
    </ToastProvider>
  );
}

function ProductDetailInner() {
  const { id }         = useParams<{ id: string }>();
  const router         = useRouter();
  const { data: session } = useSession();
  const { showToast }  = useToast();

  const [product,  setProduct]  = useState<Product | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [showModal,setShowModal]= useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calculator state
  const [calcMode, setCalcMode]       = useState<CalcMode>("B");
  const [downPayment, setDownPayment] = useState("");
  const [profitRate, setProfitRate]   = useState("");
  const [numInst, setNumInst]         = useState(6);

  const load = useCallback(async () => {
    const res = await fetch(`/api/products/${id}`);
    const d   = await res.json();
    setProduct(d.product ?? null);
    if (d.product) {
      setProfitRate(String(d.product.profitRate));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-500">পণ্য পাওয়া যায়নি।</p>
      <Link href="/shop" className="mt-4 inline-block text-[#1D9E75] underline">শপে ফিরুন</Link>
    </div>
  );

  const cost = product.purchasePrice;
  const down = parseFloat(downPayment) || 0;
  const rate = parseFloat(profitRate) || product.profitRate;

  // Calculate plan
  const plan = (() => {
    try {
      return calcMode === "A"
        ? calcMethodA(cost, 0, numInst, rate)
        : calcMethodB(cost, down, numInst, rate);
    } catch { return null; }
  })();

  async function submitApplication() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/shop/${product!.id}`);
      return;
    }
    if (!plan) { showToast("হিসাব সম্পন্ন করুন।", "error"); return; }

    setSubmitting(true);
    try {
      // Find or create customer record for this user, then create order
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          // Admin will need to link customer — for self-service we submit an application
          customerId:      session.user.id, // placeholder; backend resolves
          productId:       product!.id,
          purchaseCost:    cost,
          downPayment:     down,
          profitMethod:    calcMode === "A" ? "FULL_COST_BASED" : "FINANCED_AMOUNT",
          profitRate:      rate,
          numInstallments: numInst,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        showToast(d.error ?? "আবেদন ব্যর্থ হয়েছে।", "error");
        return;
      }
      showToast(`✅ আবেদন জমা হয়েছে। অর্ডার: ${d.orderNumber}`);
      setShowModal(false);
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  const INSTALL_OPTIONS = [3, 6, 9, 12];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/"    className="hover:text-[#1D9E75]">হোম</Link>
        <span>›</span>
        <Link href="/shop" className="hover:text-[#1D9E75]">শপ</Link>
        <span>›</span>
        <span className="text-[#0D2B1A] font-medium">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ── Images ── */}
        <div>
          {/* Main image */}
          <div className="relative h-72 md:h-80 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 mb-3">
            {product.images?.[imgIdx]?.url ? (
              <Image
                src={product.images[imgIdx].url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">📦</div>
            )}
            {product.outOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="rounded-2xl bg-red-600 px-5 py-2 text-white font-bold text-lg">স্টক শেষ</span>
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                    imgIdx === i ? "border-[#1D9E75]" : "border-gray-100 hover:border-gray-300"
                  )}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ── */}
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

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.description}</p>
          )}

          {/* Price */}
          <div className="rounded-2xl border border-gray-100 bg-[#FDFAF3] p-4 mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#0D2B1A]">{formatMoney(cost)}</span>
              <span className="text-sm text-gray-400">বাজারমূল্য</span>
            </div>
            <p className="text-xs text-[#1D9E75] mt-1 font-medium">
              কিস্তিতে পাবেন — লাভ মাত্র {toBengaliDigits(product.profitRate)}%
            </p>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5 text-sm">
            <span className={cn("h-2.5 w-2.5 rounded-full", product.outOfStock ? "bg-red-500" : "bg-green-500")} />
            <span className={product.outOfStock ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
              {product.outOfStock ? "স্টক নেই" : `${toBengaliDigits(product.stockQty)}টি স্টকে আছে`}
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              if (!session?.user) {
                router.push(`/login?callbackUrl=/shop/${product.id}`);
              } else {
                setShowModal(true);
              }
            }}
            disabled={product.outOfStock}
            className={cn(
              "w-full rounded-2xl py-3.5 text-base font-bold transition-all",
              product.outOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#1D9E75] text-white hover:bg-[#0F6E56] shadow-lg hover:shadow-[#1D9E75]/30"
            )}
          >
            {product.outOfStock ? "স্টক নেই" : "📝 কিস্তিতে আবেদন করুন"}
          </button>

          {!session?.user && !product.outOfStock && (
            <p className="text-center text-xs text-gray-400 mt-2">আবেদন করতে লগইন প্রয়োজন।</p>
          )}
        </div>
      </div>

      {/* ── Installment Calculator Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0D2B1A] text-white">
              <h2 className="font-bold" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>কিস্তি হিসাব করুন</h2>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Mode tabs */}
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                {([["B","📌 শরিয়াহ পদ্ধতি (অর্থায়িত)"],["A","📊 সম্পূর্ণ মূল্য ভিত্তিক"]] as [CalcMode, string][]).map(([m, lbl]) => (
                  <button
                    key={m}
                    onClick={() => setCalcMode(m)}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold transition-all",
                      calcMode === m ? "bg-white shadow text-[#0D2B1A]" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Shariah note */}
              {calcMode === "B" && (
                <div className="rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/8 px-4 py-2.5 text-xs text-[#854F0B]">
                  📌 <strong>শরিয়াহ পদ্ধতি:</strong> শুধুমাত্র অর্থায়িত অংশের উপর লাভ ধরা হয় — ডাউনপেমেন্টের উপর নয়।
                </div>
              )}

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                {calcMode === "B" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ডাউনপেমেন্ট (৳)</label>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      placeholder="০ (ঐচ্ছিক)"
                      min={0} max={cost - 1}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">লাভের হার (%)</label>
                  <input
                    type="number"
                    value={profitRate}
                    onChange={(e) => setProfitRate(e.target.value)}
                    min={0} max={100}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  />
                </div>
                <div className={calcMode === "A" ? "col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">কিস্তির সংখ্যা</label>
                  <div className="flex gap-2">
                    {INSTALL_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumInst(n)}
                        className={cn(
                          "flex-1 rounded-lg py-2 text-xs font-semibold transition-all border",
                          numInst === n ? "bg-[#1D9E75] text-white border-[#1D9E75]" : "border-gray-200 text-gray-600 hover:border-[#1D9E75]"
                        )}
                      >
                        {toBengaliDigits(n)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result */}
              {plan && (
                <div className="rounded-xl bg-[#E1F5EE] p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <ResultRow label="ক্রয়মূল্য"     value={formatMoney(cost)} />
                    {calcMode === "B" && down > 0 && <ResultRow label="ডাউনপেমেন্ট" value={formatMoney(down)} />}
                    <ResultRow label="লাভ"            value={formatMoney(calcMode === "A" ? (plan as ReturnType<typeof calcMethodA>).profit : (plan as ReturnType<typeof calcMethodB>).profit)} />
                    <ResultRow label="মোট বিক্রয়মূল্য" value={formatMoney(calcMode === "A" ? (plan as ReturnType<typeof calcMethodA>).total : (plan as ReturnType<typeof calcMethodB>).totalSale)} highlight />
                    <ResultRow label={`প্রতি কিস্তি (${toBengaliDigits(numInst)} মাস)`} value={formatMoney(calcMode === "A" ? (plan as ReturnType<typeof calcMethodA>).perInstall : (plan as ReturnType<typeof calcMethodB>).perInstall)} highlight />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">* শেষ কিস্তিতে সামান্য সমন্বয় হতে পারে।</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={submitApplication}
                disabled={submitting || product.outOfStock || !plan}
                className="w-full rounded-xl bg-[#1D9E75] py-3.5 text-sm font-bold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
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

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <strong className={highlight ? "text-[#1D9E75] text-sm" : "text-[#0D2B1A]"}>{value}</strong>
    </div>
  );
}

const INSTALL_OPTIONS = [3, 6, 9, 12];
