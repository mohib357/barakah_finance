"use client";
import { useState, useEffect, useCallback } from "react";
import { cn, formatMoney, toBengaliDigits, formatDate } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { ToastProvider, useToast } from "@/components/ui/Toast";

interface QardApp {
  id: string; qardCode: string; status: string;
  borrowerName: string; borrowerPhone: string; borrowerAddress: string | null;
  requestedAmount: number; approvedAmount: number | null; disbursedAmount: number | null;
  repaymentMonths: number; reason: string;
  totalPaid: number; totalRemaining: number;
  guarantorName: string | null; guarantorPhone: string | null;
  createdAt: string; repaymentStartDate: string | null;
  installments: QardInstallment[];
}
interface QardInstallment {
  id: string; installmentNumber: number; dueDate: string;
  dueAmount: number; paidAmount: number; remainingAmount: number; status: string;
}

type Tab = "all" | "applied" | "active" | "completed";

export default function QardAdmin() {
  return <ToastProvider><QardAdminInner /></ToastProvider>;
}

function QardAdminInner() {
  const { showToast } = useToast();
  const [tab,      setTab]      = useState<Tab>("all");
  const [apps,     setApps]     = useState<QardApp[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<QardApp | null>(null);
  const [collectAmt,     setCollectAmt]     = useState("");
  const [collectInstId,  setCollectInstId]  = useState("");
  const [collectMethod,  setCollectMethod]  = useState("CASH");
  const [submitting,     setSubmitting]     = useState(false);
  const [disbAmt,        setDisbAmt]        = useState("");

  const STATUS_FILTER: Record<Tab, string> = {
    all: "", applied: "APPLIED,UNDER_REVIEW", active: "ACTIVE,APPROVED,DISBURSED", completed: "COMPLETED,REJECTED",
  };

  const load = useCallback(async () => {
    setLoading(true);
    const sf = STATUS_FILTER[tab];
    const url = `/api/qard${sf ? `?status=${sf.split(",")[0]}` : ""}`;
    const res = await fetch(url);
    const d   = await res.json();
    setApps(d.applications ?? []);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function doAction(qardId: string, action: string, extra?: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/qard/${qardId}/approve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(d.message);
      load();
      // Refresh selected
      const detRes = await fetch(`/api/qard/${qardId}`);
      const detD   = await detRes.json();
      setSelected(detD.qard);
    } finally { setSubmitting(false); }
  }

  async function collectPayment(qardId: string) {
    if (!collectInstId || !collectAmt) { showToast("কিস্তি ও পরিমাণ দিন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/qard/${qardId}/collect`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ installmentId: collectInstId, amount: parseFloat(collectAmt), paymentMethod: collectMethod }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(`✅ ${d.message} — রসিদ: ${d.receiptNumber}`);
      setCollectAmt(""); setCollectInstId("");
      const detRes = await fetch(`/api/qard/${qardId}`);
      const detD   = await detRes.json();
      setSelected(detD.qard);
      load();
    } finally { setSubmitting(false); }
  }

  const STATUS_BN: Record<string, string> = {
    APPLIED:"আবেদনকৃত", UNDER_REVIEW:"পর্যালোচনায়", APPROVED:"অনুমোদিত",
    REJECTED:"প্রত্যাখ্যাত", DISBURSED:"বিতরিত", ACTIVE:"সক্রিয়",
    PARTIALLY_PAID:"আংশিক", OVERDUE:"বকেয়া", COMPLETED:"সম্পন্ন", CANCELLED:"বাতিল",
  };
  const STATUS_COLOR: Record<string, string> = {
    APPLIED:"bg-blue-50 text-blue-700 border-blue-200",
    UNDER_REVIEW:"bg-amber-50 text-amber-700 border-amber-200",
    APPROVED:"bg-teal-50 text-teal-700 border-teal-200",
    ACTIVE:"bg-green-50 text-green-700 border-green-200",
    REJECTED:"bg-red-50 text-red-700 border-red-200",
    COMPLETED:"bg-gray-50 text-gray-500 border-gray-200",
    OVERDUE:"bg-red-50 text-red-700 border-red-200",
  };

  const TABS = [
    {key:"all"as Tab,label:"সব"},
    {key:"applied"as Tab,label:"আবেদন ও পর্যালোচনা"},
    {key:"active"as Tab,label:"সক্রিয়"},
    {key:"completed"as Tab,label:"সম্পন্ন/প্রত্যাখ্যাত"},
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[#0D2B1A] mb-6">🤝 করজে হাসানা ব্যবস্থাপনা</h1>

        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              tab === t.key ? "bg-[#1D9E75] text-white" : "text-gray-600 hover:bg-gray-50"
            )}>{t.label}</button>
          ))}
        </div>

        <div className="flex gap-5">
          {/* List */}
          <div className={cn("flex-1 min-w-0", selected && "hidden lg:block")}>
            {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
              <div className="space-y-3">
                {apps.length === 0 && <div className="text-center py-12 text-gray-400">কোনো আবেদন নেই।</div>}
                {apps.map((a) => (
                  <div key={a.id} onClick={() => setSelected(a)}
                    className={cn("rounded-2xl border bg-white p-4 cursor-pointer hover:shadow-md transition-all",
                      selected?.id === a.id ? "border-[#1D9E75] shadow-md" : "border-gray-100"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="font-mono text-xs text-[#1D9E75] font-bold">{a.qardCode}</span>
                        <h3 className="font-semibold text-[#0D2B1A] text-sm">{a.borrowerName}</h3>
                        <p className="text-xs text-gray-500">{a.borrowerPhone}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold", STATUS_COLOR[a.status] ?? "bg-gray-50 text-gray-500")}>
                        {STATUS_BN[a.status] ?? a.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>চাওয়া: <strong>{formatMoney(a.requestedAmount)}</strong></span>
                      {a.approvedAmount && <span>অনুমোদিত: <strong className="text-[#1D9E75]">{formatMoney(a.approvedAmount)}</strong></span>}
                      {a.totalRemaining > 0 && <span>বাকি: <strong className="text-red-600">{formatMoney(a.totalRemaining)}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          {selected && (
            <div className="w-full lg:w-3/5 shrink-0">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-[#0D2B1A] text-white">
                  <div>
                    <p className="font-mono text-xs text-[#C9A227]">{selected.qardCode}</p>
                    <h2 className="font-bold">{selected.borrowerName}</h2>
                    <p className="text-xs text-white/60">{selected.borrowerPhone}</p>
                  </div>
                  <span className={cn("rounded-lg border px-2 py-0.5 text-xs font-semibold", STATUS_COLOR[selected.status] ?? "bg-gray-50 text-gray-500")}>
                    {STATUS_BN[selected.status] ?? selected.status}
                  </span>
                </div>

                {/* Info */}
                <div className="px-5 py-4 text-sm border-b border-gray-100 space-y-1.5">
                  <div className="flex justify-between"><span className="text-gray-500">কারণ:</span><span className="text-right max-w-[60%]">{selected.reason}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">চাওয়া:</span><span>{formatMoney(selected.requestedAmount)}</span></div>
                  {selected.approvedAmount && <div className="flex justify-between"><span className="text-gray-500">অনুমোদিত:</span><strong className="text-[#1D9E75]">{formatMoney(selected.approvedAmount)}</strong></div>}
                  <div className="flex justify-between"><span className="text-gray-500">মেয়াদ:</span><span>{toBengaliDigits(selected.repaymentMonths)} মাস</span></div>
                  {selected.guarantorName && <div className="flex justify-between"><span className="text-gray-500">জামিনদার:</span><span>{selected.guarantorName} ({selected.guarantorPhone})</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">পরিশোধ:</span><span className="text-green-600 font-semibold">{formatMoney(selected.totalPaid)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">বাকি:</span><span className={selected.totalRemaining > 0 ? "text-red-600 font-semibold" : "text-green-600"}>{formatMoney(selected.totalRemaining)}</span></div>
                </div>

                {/* 3-step approval pipeline */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-xs font-bold text-[#0D2B1A] mb-3">অনুমোদন পাইপলাইন</p>
                  <div className="flex items-center gap-2 mb-4">
                    {["APPLIED","UNDER_REVIEW","APPROVED","ACTIVE"].map((step, i) => {
                      const statusOrder = ["APPLIED","UNDER_REVIEW","APPROVED","DISBURSED","ACTIVE","COMPLETED"];
                      const currentIdx  = statusOrder.indexOf(selected.status);
                      const stepIdx     = statusOrder.indexOf(step);
                      const isDone      = currentIdx > stepIdx;
                      const isCurrent   = currentIdx === stepIdx;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className={cn("flex-1 h-1 rounded", i === 0 ? "hidden" : isDone ? "bg-[#1D9E75]" : "bg-gray-200")} />
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            isDone ? "bg-[#1D9E75] text-white" : isCurrent ? "bg-[#C9A227] text-[#0D2B1A]" : "bg-gray-100 text-gray-400"
                          )}>
                            {isDone ? "✓" : i+1}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selected.status === "APPLIED" && (
                      <PipelineBtn label="পর্যালোচনায় নিন" color="bg-amber-500 text-white" onClick={() => doAction(selected.id, "review")} disabled={submitting} />
                    )}
                    {selected.status === "UNDER_REVIEW" && (<>
                      <PipelineBtn label="✅ অনুমোদন করুন" color="bg-[#1D9E75] text-white" onClick={() => doAction(selected.id, "approve", { approvedAmount: selected.requestedAmount })} disabled={submitting} />
                      <PipelineBtn label="✕ প্রত্যাখ্যান" color="bg-red-600 text-white" onClick={() => {const r=prompt("কারণ?");if(r)doAction(selected.id,"reject",{rejectionReason:r});}} disabled={submitting} />
                    </>)}
                    {selected.status === "APPROVED" && (
                      <div className="flex gap-2 w-full">
                        <input type="number" value={disbAmt} onChange={(e)=>setDisbAmt(e.target.value)} placeholder={`৳${selected.approvedAmount??selected.requestedAmount}`}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
                        <PipelineBtn label="💸 বিতরণ করুন" color="bg-[#185FA5] text-white" onClick={() => doAction(selected.id, "disburse", { disbursedAmount: parseFloat(disbAmt || String(selected.approvedAmount ?? selected.requestedAmount)) })} disabled={submitting} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Repayment collection */}
                {(selected.status === "ACTIVE" || selected.status === "OVERDUE") && selected.totalRemaining > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100 bg-[#E1F5EE]/30">
                    <p className="text-xs font-bold text-[#0D2B1A] mb-3">💳 পরিশোধ সংগ্রহ</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">কিস্তি</label>
                        <select value={collectInstId} onChange={(e)=>{setCollectInstId(e.target.value);const i=selected.installments.find(x=>x.id===e.target.value);if(i)setCollectAmt(String(i.remainingAmount));}}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:ring-2 focus:ring-[#1D9E75] focus:outline-none">
                          <option value="">বেছে নিন</option>
                          {selected.installments.filter(i=>i.status!=="PAID"&&i.status!=="CANCELLED").map(i=>(
                            <option key={i.id} value={i.id}>{toBengaliDigits(i.installmentNumber)}ম — বাকি ৳{i.remainingAmount.toLocaleString("en-IN")}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">পরিমাণ</label>
                        <input type="number" value={collectAmt} onChange={(e)=>setCollectAmt(e.target.value)} placeholder="৳"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:ring-2 focus:ring-[#1D9E75] focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">মেথড</label>
                        <select value={collectMethod} onChange={(e)=>setCollectMethod(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:ring-2 focus:ring-[#1D9E75] focus:outline-none">
                          {[["CASH","ক্যাশ"],["BKASH","বিকাশ"],["NAGAD","নগদ"],["ROCKET","রকেট"],["BANK_TRANSFER","ব্যাংক"]].map(([v,l])=>(
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button onClick={()=>collectPayment(selected.id)} disabled={submitting||!collectInstId||!collectAmt}
                      className="mt-3 w-full rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2">
                      {submitting&&<Spinner size="sm"/>} পরিশোধ গ্রহণ
                    </button>
                  </div>
                )}

                {/* Repayment schedule */}
                {selected.installments.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left">কিস্তি</th>
                          <th className="px-4 py-2.5 text-left">তারিখ</th>
                          <th className="px-4 py-2.5 text-right">পরিমাণ</th>
                          <th className="px-4 py-2.5 text-right">পরিশোধ</th>
                          <th className="px-4 py-2.5 text-center">অবস্থা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selected.installments.map((i) => (
                          <tr key={i.id} className={i.status==="OVERDUE"?"bg-red-50/30":""}>
                            <td className="px-4 py-2.5">{toBengaliDigits(i.installmentNumber)}ম</td>
                            <td className="px-4 py-2.5 text-gray-500">{formatDate(new Date(i.dueDate))}</td>
                            <td className="px-4 py-2.5 text-right">{formatMoney(i.dueAmount)}</td>
                            <td className="px-4 py-2.5 text-right text-green-600">{formatMoney(i.paidAmount)}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={cn("rounded-full px-2 py-0.5 text-[10px] border font-semibold",
                                i.status==="PAID"?"bg-green-50 text-green-700 border-green-200":
                                i.status==="OVERDUE"?"bg-red-50 text-red-700 border-red-200":
                                "bg-gray-50 text-gray-500 border-gray-200"
                              )}>
                                {i.status==="PAID"?"পরিশোধ":i.status==="OVERDUE"?"বকেয়া":"মুলতবি"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineBtn({ label, color, onClick, disabled }: { label: string; color: string; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 transition-opacity", color)}>
      {label}
    </button>
  );
}
