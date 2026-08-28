"use client";
import { useState, useEffect, useCallback } from "react";
import { cn, formatMoney } from "@/lib/utils/cn";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

interface Product {
  id: string; productCode: string; name: string; category: string;
  purchasePrice: number; profitRate: number; stockQty: number;
  isActive: boolean; isFeatured: boolean; outOfStock: boolean;
  profitMethod: string;
}

export default function ProductsAdmin() {
  return <ToastProvider><ProductsAdminInner /></ToastProvider>;
}

function ProductsAdminInner() {
  const { showToast } = useToast();
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("");

  // New product form
  const [code,   setCode]   = useState("");
  const [name,   setName]   = useState("");
  const [cat,    setCat]    = useState("");
  const [desc,   setDesc]   = useState("");
  const [cost,   setCost]   = useState("");
  const [rate,   setRate]   = useState("10");
  const [stock,  setStock]  = useState("0");
  const [method, setMethod] = useState("FINANCED_AMOUNT");
  const [featured, setFeatured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/products?${new URLSearchParams({ q: search, ...(catFilter ? { category: catFilter } : {}), active: "true" }).toString()}`;
    const res = await fetch(url);
    const d   = await res.json();
    setProducts(d.products  ?? []);
    setCategories(d.categories ?? []);
    setLoading(false);
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!code || !name || !cat || !cost) { showToast("সব তথ্য পূরণ করুন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode: code, name, category: cat, description: desc, purchasePrice: parseFloat(cost), profitRate: parseFloat(rate), stockQty: parseInt(stock), profitMethod: method, isFeatured: featured }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast("✅ পণ্য তৈরি হয়েছে।");
      setShowForm(false);
      setCode(""); setName(""); setCat(""); setDesc(""); setCost(""); setRate("10"); setStock("0");
      load();
    } finally { setSubmitting(false); }
  }

  async function toggleActive(id: string, current: boolean) {
    if (current) {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      showToast("পণ্য নিষ্ক্রিয় করা হয়েছে।");
    } else {
      await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: true }) });
      showToast("পণ্য সক্রিয় হয়েছে।");
    }
    load();
  }

  const inp = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]";

  return (
    <div className="min-h-screen bg-[#FDFAF3] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#0D2B1A]">🛒 পণ্য ব্যবস্থাপনা</h1>
          <button onClick={() => setShowForm((p) => !p)} className="rounded-xl bg-[#1D9E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F6E56]">
            + নতুন পণ্য
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="পণ্য সার্চ করুন…" className={cn(inp, "max-w-xs")} />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={cn(inp, "max-w-[180px]")}>
            <option value="">সব ক্যাটাগরি</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-2xl border border-[#1D9E75]/20 bg-white p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4">নতুন পণ্য যোগ</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium mb-1">পণ্য কোড *</label><input className={inp} value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-001" /></div>
              <div><label className="block text-xs font-medium mb-1">পণ্যের নাম *</label><input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Samsung Galaxy A15" /></div>
              <div><label className="block text-xs font-medium mb-1">ক্যাটাগরি *</label><input className={inp} value={cat} onChange={(e) => setCat(e.target.value)} placeholder="মোবাইল" list="cat-list" /><datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
              <div><label className="block text-xs font-medium mb-1">ক্রয়মূল্য (৳) *</label><input className={inp} type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="৳" /></div>
              <div><label className="block text-xs font-medium mb-1">মুনাফার হার (%)</label><input className={inp} type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1">স্টক পরিমাণ</label><input className={inp} type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1">মুনাফা পদ্ধতি</label>
                <select className={inp} value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="FINANCED_AMOUNT">অর্থায়িত পরিমাণ (শরিয়াহ)</option>
                  <option value="FULL_COST_BASED">সম্পূর্ণ মূল্য ভিত্তিক</option>
                  <option value="CUSTOM">কাস্টম</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1">বিবরণ</label><input className={inp} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="পণ্যের বিবরণ" /></div>
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              ফিচার্ড পণ্য হিসেবে দেখান
            </label>
            <div className="flex gap-3 mt-4">
              <button onClick={create} disabled={submitting} className="rounded-xl bg-[#1D9E75] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center gap-2">
                {submitting && <Spinner size="sm" />} সেভ করুন
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm">বাতিল</button>
            </div>
          </div>
        )}

        {/* Product table */}
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">কোড</th>
                    <th className="px-4 py-3 text-left">পণ্যের নাম</th>
                    <th className="px-4 py-3 text-left">ক্যাটাগরি</th>
                    <th className="px-4 py-3 text-right">ক্রয়মূল্য</th>
                    <th className="px-4 py-3 text-center">মুনাফা</th>
                    <th className="px-4 py-3 text-center">স্টক</th>
                    <th className="px-4 py-3 text-center">অবস্থা</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-400">কোনো পণ্য নেই।</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id} className={cn("hover:bg-gray-50", !p.isActive && "opacity-50")}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.productCode}</td>
                      <td className="px-4 py-3 font-medium text-[#0D2B1A]">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.category}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(p.purchasePrice)}</td>
                      <td className="px-4 py-3 text-center text-xs">{p.profitRate}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-semibold",
                          p.outOfStock ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                        )}>
                          {p.outOfStock ? "শেষ" : p.stockQty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-block w-2 h-2 rounded-full", p.isActive ? "bg-green-400" : "bg-gray-300")} />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(p.id, p.isActive)} className={cn("text-xs font-medium", p.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700")}>
                          {p.isActive ? "নিষ্ক্রিয়" : "সক্রিয়"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
