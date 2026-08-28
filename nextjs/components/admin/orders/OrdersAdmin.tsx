"use client";
import { useState, useEffect, useCallback } from "react";
import { cn, formatMoney, toBengaliDigits } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils/cn";

// ── Types ──────────────────────────────────────────────────
interface Order {
  id: string; orderNumber: string; status: string;
  purchaseCost: number; totalPayable: number; totalPaid: number; totalRemaining: number;
  numInstallments: number; orderDate: string;
  customer: { id: string; name: string; phone: string; clientID: string };
  product:  { id: string; name: string; category: string };
  installments: Installment[];
}
interface Installment {
  id: string; installmentNumber: number; dueDate: string; graceDate: string;
  dueAmount: number; paidAmount: number; remainingAmount: number; status: string;
  isDownPayment?: boolean;
}

type Tab = "all" | "pending" | "approved" | "due";

export default function OrdersAdmin() {
  return <ToastProvider><OrdersAdminInner /></ToastProvider>;
}

function OrdersAdminInner() {
  const { showToast } = useToast();
  const [tab,     setTab]     = useState<Tab>("all");
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState<Order | null>(null);
  const [collectAmt, setCollectAmt] = useState("");
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectInstId, setCollectInstId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = tab === "pending" ? "status=PENDING" : tab === "approved" ? "status=APPROVED" : "";
    const res = await fetch(`/api/orders${params ? `?${params}` : ""}`);
    const d   = await res.json();

    let result: Order[] = d.orders ?? [];
    if (tab === "due") {
      const dueRes = await fetch("/api/installments?overdue=true");
      const dueD   = await dueRes.json();
      // Show orders that have overdue installments
      const orderIds = Array.from(new Set((dueD.installments ?? []).map((i: { orderId: string }) => i.orderId)));
      result = result.filter((o) => orderIds.includes(o.id));
    }

    setOrders(result);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function approve(orderId: string, action: "approve" | "reject", reason?: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ action, reason }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(d.message);
      load();
      if (selected?.id === orderId) setSelected(null);
    } finally { setSubmitting(false); }
  }

  async function collectPayment(orderId: string) {
    if (!collectInstId || !collectAmt) { showToast("কিস্তি ও পরিমাণ নির্বাচন করুন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/installments/collect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ orderId, installmentId: collectInstId, amount: parseFloat(collectAmt), paymentMethod: collectMethod }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(`✅ ${d.message} — রসিদ: ${d.receiptNumber}`);
      setCollectAmt(""); setCollectInstId("");
      // Reload selected order details
      const detRes = await fetch(`/api/orders/${orderId}`);
      const detD   = await detRes.json();
      setSelected(detD.order);
      load();
    } finally { setSubmitting(false); }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",      label: "সব অর্ডার" },
    { key: "pending",  label: "মুলতবি" },
    { key: "approved", label: "অনুমোদিত" },
    { key: "due",      label: "মেয়াদোত্তীর্ণ" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED:  "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    REJECTED:  "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-50 text-gray-500 border-gray-200",
  };

  const STATUS_BN: Record<string, string> = {
    PENDING:"মুলতবি", APPROVED:"অনুমোদিত", COMPLETED:"সম্পন্ন", REJECTED:"প্রত্যাখ্যাত", CANCELLED:"বাতিল",
    UPCOMING:"আসন্ন", DUE:"বাকি", PARTIALLY_PAID:"আংশিক", PAID:"পরিশোধিত", OVERDUE:"মেয়াদোত্তীর্ণ",
  };

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[#0D2B1A] mb-6">📦 অর্ডার ও কিস্তি ব্যবস্থাপনা</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              tab === t.key ? "bg-[#1D9E75] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            )}>{t.label}</button>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Order list */}
          <div className={cn("flex-1 min-w-0", selected && "hidden lg:block lg:w-2/5")}>
            {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
              <div className="space-y-3">
                {orders.length === 0 && <div className="text-center py-12 text-gray-400">কোনো অর্ডার নেই।</div>}
                {orders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className={cn(
                      "rounded-2xl border bg-white p-4 cursor-pointer hover:shadow-md transition-all",
                      selected?.id === o.id ? "border-[#1D9E75] shadow-md" : "border-gray-100"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="font-mono text-xs text-[#1D9E75] font-bold">{o.orderNumber}</span>
                        <h3 className="font-semibold text-[#0D2B1A] text-sm">{o.customer.name}</h3>
                        <p className="text-xs text-gray-500">{o.product.name} · {o.product.category}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[o.status] ?? "bg-gray-50 text-gray-500")}>
                        {STATUS_BN[o.status] ?? o.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>মোট: <strong className="text-[#0D2B1A]">{formatMoney(o.totalPayable)}</strong></span>
                      <span>বাকি: <strong className={o.totalRemaining > 0 ? "text-red-600" : "text-green-600"}>{formatMoney(o.totalRemaining)}</strong></span>
                      <span>{toBengaliDigits(o.numInstallments)} কিস্তি</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order detail panel */}
          {selected && (
            <div className="w-full lg:w-3/5 shrink-0">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-[#0D2B1A] text-white">
                  <div>
                    <p className="font-mono text-xs text-[#C9A227]">{selected.orderNumber}</p>
                    <h2 className="font-bold">{selected.customer.name}</h2>
                    <p className="text-xs text-white/60">{selected.customer.phone} · {selected.product.name}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white text-xl leading-none">✕</button>
                </div>

                {/* Financial summary */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  {[
                    { label: "মোট", value: formatMoney(selected.totalPayable) },
                    { label: "পরিশোধ", value: formatMoney(selected.totalPaid), color: "text-green-600" },
                    { label: "বাকি", value: formatMoney(selected.totalRemaining), color: selected.totalRemaining > 0 ? "text-red-600" : "text-green-600" },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3 text-center">
                      <div className={cn("font-bold text-sm", s.color ?? "text-[#0D2B1A]")}>{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                {selected.status === "PENDING" && (
                  <div className="flex gap-3 px-5 py-3 border-b border-gray-100">
                    <button
                      onClick={() => approve(selected.id, "approve")}
                      disabled={submitting}
                      className="flex-1 rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60"
                    >
                      ✅ অনুমোদন
                    </button>
                    <button
                      onClick={() => { const r = prompt("প্রত্যাখ্যানের কারণ?"); if (r) approve(selected.id, "reject", r); }}
                      disabled={submitting}
                      className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      ✕ প্রত্যাখ্যান
                    </button>
                  </div>
                )}

                {/* Payment collection (only for approved orders with remaining) */}
                {selected.status === "APPROVED" && selected.totalRemaining > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100 bg-[#E1F5EE]/30">
                    <p className="text-xs font-bold text-[#0D2B1A] mb-3">💳 কিস্তি সংগ্রহ</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">কিস্তি নির্বাচন</label>
                        <select
                          value={collectInstId}
                          onChange={(e) => {
                            setCollectInstId(e.target.value);
                            const inst = selected.installments.find((i) => i.id === e.target.value);
                            if (inst) setCollectAmt(String(inst.remainingAmount));
                          }}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                        >
                          <option value="">বেছে নিন</option>
                          {selected.installments
                            .filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
                            .map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.installmentNumber === 0 ? "ডাউনপেমেন্ট" : `${toBengaliDigits(i.installmentNumber)}ম কিস্তি`}
                                {" — বাকি: ৳"}{i.remainingAmount.toLocaleString("en-IN")}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">পরিমাণ (৳)</label>
                        <input
                          type="number"
                          value={collectAmt}
                          onChange={(e) => setCollectAmt(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                          placeholder="৳"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">মেথড</label>
                        <select
                          value={collectMethod}
                          onChange={(e) => setCollectMethod(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                        >
                          {[["CASH","ক্যাশ"],["BKASH","বিকাশ"],["NAGAD","নগদ"],["ROCKET","রকেট"],["BANK_TRANSFER","ব্যাংক"]].map(([v,l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => collectPayment(selected.id)}
                      disabled={submitting || !collectInstId || !collectAmt}
                      className="mt-3 w-full rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting && <Spinner size="sm" />}
                      পেমেন্ট নিন
                    </button>
                  </div>
                )}

                {/* Installment schedule table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2.5 text-left">#</th>
                        <th className="px-4 py-2.5 text-left">তারিখ</th>
                        <th className="px-4 py-2.5 text-right">পরিমাণ</th>
                        <th className="px-4 py-2.5 text-right">পরিশোধ</th>
                        <th className="px-4 py-2.5 text-right">বাকি</th>
                        <th className="px-4 py-2.5 text-center">অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selected.installments.map((inst) => {
                        const isOverdue = inst.status !== "PAID" && new Date(inst.dueDate) < new Date();
                        const isDue     = inst.status === "DUE" || (inst.status === "UPCOMING" && new Date(inst.graceDate) <= new Date());
                        return (
                          <tr key={inst.id} className={cn(
                            "hover:bg-gray-50",
                            isOverdue ? "bg-red-50/30" : isDue ? "bg-amber-50/30" : ""
                          )}>
                            <td className="px-4 py-2.5 font-medium text-[#0D2B1A]">
                              {inst.installmentNumber === 0 ? "ডাউন" : toBengaliDigits(inst.installmentNumber)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {formatDate(new Date(inst.dueDate))}
                              {isOverdue && <span className="ml-1 text-red-500">⚠</span>}
                              {isDue && !isOverdue && <span className="ml-1 text-amber-500">⏰</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right">{formatMoney(inst.dueAmount)}</td>
                            <td className="px-4 py-2.5 text-right text-green-600">{formatMoney(inst.paidAmount)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-red-600">{formatMoney(inst.remainingAmount)}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                                inst.status === "PAID"           ? "bg-green-50 text-green-700 border-green-200" :
                                inst.status === "OVERDUE"        ? "bg-red-50 text-red-700 border-red-200" :
                                inst.status === "DUE"            ? "bg-amber-50 text-amber-700 border-amber-200" :
                                inst.status === "PARTIALLY_PAID" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                                    "bg-gray-50 text-gray-500 border-gray-200"
                              )}>
                                {{PAID:"পরিশোধ",OVERDUE:"বকেয়া",DUE:"বাকি",PARTIALLY_PAID:"আংশিক",UPCOMING:"আসন্ন"}[inst.status] ?? inst.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
