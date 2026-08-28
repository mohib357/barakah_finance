"use client";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { formatMoney } from "@/lib/utils/cn";
import Decimal from "decimal.js";

type Tab = "summary" | "income" | "expense" | "transfer" | "reconcile";

export default function AccountsDashboard() {
  return (
    <ToastProvider>
      <AccountsDashboardInner />
    </ToastProvider>
  );
}

function AccountsDashboardInner() {
  const [tab, setTab] = useState<Tab>("summary");

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "summary",    label: "সারসংক্ষেপ",   icon: "📊" },
    { key: "income",     label: "আয়",           icon: "💰" },
    { key: "expense",    label: "ব্যয়",          icon: "📤" },
    { key: "transfer",   label: "ফান্ড ট্রান্সফার", icon: "🔄" },
    { key: "reconcile",  label: "ব্যালেন্স মিলানো", icon: "🔍" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF3] dark:bg-[#0D2B1A]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2B1A] dark:text-white">
            💼 হিসাব ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-gray-500 mt-1">আয়, ব্যয়, ফান্ড ট্রান্সফার এবং ব্যালেন্স মিলানো</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl bg-white border border-gray-100 p-1 mb-6 shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                tab === t.key
                  ? "bg-[#1D9E75] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "summary"   && <SummaryTab />}
        {tab === "income"    && <IncomeTab />}
        {tab === "expense"   && <ExpenseTab />}
        {tab === "transfer"  && <FundTransferTab />}
        {tab === "reconcile" && <ReconcileTab />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Summary Tab
// ─────────────────────────────────────────────────────────────
function SummaryTab() {
  const [data, setData]     = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts/summary")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!data)   return <p className="text-red-500">ডেটা লোড হয়নি।</p>;

  const accounts    = (data.accounts as { id: string; name: string; currentBalance: string; accountType: string }[]) ?? [];
  const byCategory  = (data.byCategory as { category: string; amount: string; type: string }[]) ?? [];
  const totalIncome = new Decimal((data.totalIncome as string) ?? "0");
  const totalExpense= new Decimal((data.totalExpense as string) ?? "0");
  const netBalance  = new Decimal((data.netBalance as string) ?? "0");

  return (
    <div className="space-y-6">
      {/* Headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="মোট আয়"    value={formatMoney(totalIncome.toNumber())}  color="text-green-600" bg="bg-green-50"  icon="💰" />
        <SummaryCard label="মোট ব্যয়"   value={formatMoney(totalExpense.toNumber())} color="text-red-600"   bg="bg-red-50"    icon="📤" />
        <SummaryCard label="নেট ব্যালেন্স" value={formatMoney(netBalance.toNumber())} color={netBalance.gte(0) ? "text-blue-600" : "text-red-600"} bg="bg-blue-50" icon="🏦" />
      </div>

      {/* Account balances */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 font-semibold text-[#0D2B1A]">একাউন্ট ব্যালেন্স</div>
        <div className="divide-y divide-gray-50">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <span className="font-medium text-sm text-[#0D2B1A]">{acc.name}</span>
                <span className="ml-2 text-xs text-gray-400 capitalize">{acc.accountType.replace("_", " ")}</span>
              </div>
              <span className={cn(
                "font-bold text-sm",
                new Decimal(acc.currentBalance).gte(0) ? "text-green-600" : "text-red-600"
              )}>
                {formatMoney(new Decimal(acc.currentBalance).toNumber())}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* By category */}
      {byCategory.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {(["income", "expense"] as const).map((type) => {
            const cats = byCategory.filter((c) => c.type === type);
            if (!cats.length) return null;
            return (
              <div key={type} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className={cn("px-5 py-3 font-semibold text-sm border-b",
                  type === "income" ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                )}>
                  {type === "income" ? "আয়ের ক্যাটাগরি" : "ব্যয়ের ক্যাটাগরি"}
                </div>
                <div className="divide-y divide-gray-50">
                  {cats.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                      <span className="text-gray-600">{c.category}</span>
                      <span className="font-semibold">{formatMoney(new Decimal(c.amount).toNumber())}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Income Tab
// ─────────────────────────────────────────────────────────────
function IncomeTab() {
  const { showToast } = useToast();
  const [entries,    setEntries]    = useState<IncomeEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm,   setShowForm]   = useState(false);

  // Form state
  const [catId,    setCatId]    = useState("");
  const [amount,   setAmount]   = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [desc,     setDesc]     = useState("");
  const [method,   setMethod]   = useState("CASH");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reason,   setReason]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/accounts/income");
    const d   = await res.json();
    setEntries(d.income ?? []);
    setCategories(d.categories ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!catId || !amount || !date) { showToast("সব তথ্য পূরণ করুন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts/income", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ categoryId: catId, amount: parseFloat(amount), date, description: desc, paymentMethod: method }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(`✅ আয় যোগ হয়েছে। রসিদ: ${d.receiptNumber}`);
      setShowForm(false); setCatId(""); setAmount(""); setDesc("");
      load();
    } finally { setSubmitting(false); }
  }

  async function confirmDelete() {
    if (!deleteId || !reason) { showToast("কারণ লিখুন।", "error"); return; }
    const res = await fetch(`/api/accounts/income?id=${deleteId}`, {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason }),
    });
    const d = await res.json();
    if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
    showToast("মুছে ফেলা হয়েছে।");
    setDeleteId(null); setReason("");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-[#0D2B1A]">আয়ের তালিকা</h2>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="rounded-xl bg-[#1D9E75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F6E56] transition-colors"
        >
          + আয় যোগ করুন
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-2xl border border-[#1D9E75]/20 bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">নতুন আয় এন্ট্রি</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">ক্যাটাগরি *</label>
              <select value={catId} onChange={(e) => setCatId(e.target.value)} className={inp}>
                <option value="">বেছে নিন</option>
                {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">পরিমাণ (৳) *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inp} placeholder="৳" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">তারিখ *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">পেমেন্ট মেথড</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inp}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">বিবরণ</label>
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className={inp} placeholder="ঐচ্ছিক বিবরণ" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={submit} disabled={submitting}
              className="rounded-xl bg-[#1D9E75] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Spinner size="sm" />} সেভ করুন
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm">বাতিল</button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">কেন মুছে ফেলছেন? *</p>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={inp + " mb-2"} placeholder="কারণ লিখুন (min 5 chars)" />
          <div className="flex gap-2">
            <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white">নিশ্চিত করুন</button>
            <button onClick={() => setDeleteId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs">বাতিল</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">রসিদ নং</th>
                  <th className="px-4 py-3 text-left">ক্যাটাগরি</th>
                  <th className="px-4 py-3 text-right">পরিমাণ</th>
                  <th className="px-4 py-3 text-left">তারিখ</th>
                  <th className="px-4 py-3 text-left">মেথড</th>
                  <th className="px-4 py-3 text-left">বিবরণ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">কোনো আয় নেই।</td></tr>
                ) : entries.map((e: IncomeEntry) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-[#1D9E75]">{e.receiptNumber}</td>
                    <td className="px-4 py-3">{e.category?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{formatMoney(e.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{e.date ? new Date(e.date).toLocaleDateString("bn-BD") : "-"}</td>
                    <td className="px-4 py-3 text-xs capitalize">{e.paymentMethod?.toLowerCase().replace("_"," ")}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{e.description || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(e.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        মুছুন
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
  );
}

// ─────────────────────────────────────────────────────────────
// Expense Tab (mirrors Income Tab structure)
// ─────────────────────────────────────────────────────────────
function ExpenseTab() {
  const { showToast } = useToast();
  const [entries,    setEntries]    = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [catId,      setCatId]      = useState("");
  const [amount,     setAmount]     = useState("");
  const [date,       setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [desc,       setDesc]       = useState("");
  const [method,     setMethod]     = useState("CASH");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/accounts/expense");
    const d   = await res.json();
    setEntries(d.expense ?? []);
    setCategories(d.categories ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!catId || !amount || !date) { showToast("সব তথ্য পূরণ করুন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts/expense", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ categoryId: catId, amount: parseFloat(amount), date, description: desc, paymentMethod: method }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(`✅ ব্যয় যোগ হয়েছে। রসিদ: ${d.receiptNumber}`);
      setShowForm(false); setCatId(""); setAmount(""); setDesc("");
      load();
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-[#0D2B1A]">ব্যয়ের তালিকা</h2>
        <button onClick={() => setShowForm((p) => !p)}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          + ব্যয় যোগ করুন
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">নতুন ব্যয় এন্ট্রি</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">ক্যাটাগরি *</label>
              <select value={catId} onChange={(e) => setCatId(e.target.value)} className={inp}>
                <option value="">বেছে নিন</option>
                {categories.map((c: ExpenseCategory) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">পরিমাণ (৳) *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inp} placeholder="৳" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">তারিখ *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">পেমেন্ট মেথড</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inp}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">বিবরণ</label>
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className={inp} placeholder="ঐচ্ছিক" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={submit} disabled={submitting}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Spinner size="sm" />} সেভ করুন
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm">বাতিল</button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">রসিদ নং</th>
                  <th className="px-4 py-3 text-left">ক্যাটাগরি</th>
                  <th className="px-4 py-3 text-right">পরিমাণ</th>
                  <th className="px-4 py-3 text-left">তারিখ</th>
                  <th className="px-4 py-3 text-left">বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">কোনো ব্যয় নেই।</td></tr>
                ) : entries.map((e: ExpenseEntry) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-red-500">{e.receiptNumber}</td>
                    <td className="px-4 py-3">{e.category?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{formatMoney(e.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{e.date ? new Date(e.date).toLocaleDateString("bn-BD") : "-"}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{e.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Fund Transfer Tab
// ─────────────────────────────────────────────────────────────
function FundTransferTab() {
  const { showToast } = useToast();
  const [accounts,   setAccounts]   = useState<{ id: string; name: string; currentBalance: string }[]>([]);
  const [fromId,     setFromId]     = useState("");
  const [toId,       setToId]       = useState("");
  const [amount,     setAmount]     = useState("");
  const [reason,     setReason]     = useState("");
  const [date,       setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/accounts/summary").then((r) => r.json()).then((d) => setAccounts(d.accounts ?? []));
  }, []);

  async function submit() {
    if (!fromId || !toId || !amount) { showToast("সব তথ্য পূরণ করুন।", "error"); return; }
    if (fromId === toId)             { showToast("একই একাউন্টে ট্রান্সফার করা যাবে না।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts/fund-transfer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fromAccountId: fromId, toAccountId: toId, amount: parseFloat(amount), reason, date }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast("✅ ফান্ড ট্রান্সফার সম্পন্ন হয়েছে।");
      setFromId(""); setToId(""); setAmount(""); setReason("");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-bold text-[#0D2B1A] mb-4">ফান্ড ট্রান্সফার</h2>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
          ⚠️ ফান্ড ট্রান্সফার আয় বা ব্যয় হিসেবে গণনা হবে না — এটি শুধুমাত্র একাউন্টের মধ্যে স্থানান্তর।
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">উৎস একাউন্ট *</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={inp}>
            <option value="">বেছে নিন</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (৳{new Decimal(a.currentBalance).toFixed(2)})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">গন্তব্য একাউন্ট *</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className={inp}>
            <option value="">বেছে নিন</option>
            {accounts.filter((a) => a.id !== fromId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">পরিমাণ (৳) *</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inp} placeholder="৳" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">তারিখ</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">কারণ</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className={inp} placeholder="ঐচ্ছিক" />
        </div>
        <button onClick={submit} disabled={submitting}
          className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Spinner size="sm" />} ট্রান্সফার করুন
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Reconcile Tab
// ─────────────────────────────────────────────────────────────
function ReconcileTab() {
  const { showToast } = useToast();
  const [accounts,   setAccounts]   = useState<{ id: string; name: string; currentBalance: string }[]>([]);
  const [acctId,     setAcctId]     = useState("");
  const [actual,     setActual]     = useState("");
  const [adjReason,  setAdjReason]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/accounts/summary").then((r) => r.json()).then((d) => setAccounts(d.accounts ?? []));
  }, []);

  const selectedAcct = accounts.find((a) => a.id === acctId);
  const systemBal = selectedAcct ? new Decimal(selectedAcct.currentBalance) : null;
  const actualDec = actual ? new Decimal(parseFloat(actual)) : null;
  const diff      = systemBal && actualDec ? actualDec.minus(systemBal) : null;

  async function submit() {
    if (!acctId || !actual) { showToast("একাউন্ট ও বাস্তব ব্যালেন্স দিন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts/reconcile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ accountId: acctId, actualBalance: parseFloat(actual), adjustmentReason: adjReason || undefined }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast("✅ ব্যালেন্স মিলানো সম্পন্ন হয়েছে।");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-bold text-[#0D2B1A] mb-4">ব্যালেন্স মিলানো (Reconciliation)</h2>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">একাউন্ট *</label>
          <select value={acctId} onChange={(e) => setAcctId(e.target.value)} className={inp}>
            <option value="">বেছে নিন</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {systemBal && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm">
            <span className="text-blue-600">সিস্টেম ব্যালেন্স: </span>
            <strong className="text-blue-800">{formatMoney(systemBal.toNumber())}</strong>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium mb-1">বাস্তব ব্যালেন্স (৳) *</label>
          <input type="number" value={actual} onChange={(e) => setActual(e.target.value)} className={inp} placeholder="হাতে গুনে দেখা ব্যালেন্স" />
        </div>
        {diff && !diff.isZero() && (
          <div className={cn("rounded-xl px-4 py-3 text-sm",
            diff.gt(0) ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          )}>
            পার্থক্য: {diff.gt(0) ? "+" : ""}{formatMoney(diff.toNumber())}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium mb-1">কারণ</label>
          <input type="text" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} className={inp} placeholder="ব্যাখ্যা (ঐচ্ছিক)" />
        </div>
        <button onClick={submit} disabled={submitting}
          className="w-full rounded-xl bg-[#185FA5] py-3 text-sm font-semibold text-white hover:bg-[#1248a0] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Spinner size="sm" />} মিলিয়ে নিন
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, bg, icon }: { label: string; value: string; color: string; bg: string; icon: string }) {
  return (
    <div className={cn("rounded-2xl p-5 border border-gray-100 bg-white shadow-sm flex items-center gap-4", bg)}>
      <div className="text-3xl">{icon}</div>
      <div>
        <div className={cn("text-xl font-bold", color)}>{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]";

const PAYMENT_METHODS = [
  { value: "CASH",          label: "ক্যাশ" },
  { value: "BKASH",         label: "বিকাশ" },
  { value: "NAGAD",         label: "নগদ" },
  { value: "ROCKET",        label: "রকেট" },
  { value: "BANK_TRANSFER", label: "ব্যাংক ট্রান্সফার" },
  { value: "CARD",          label: "কার্ড" },
  { value: "OTHER",         label: "অন্যান্য" },
];

// Local types
interface Category    { id: string; name: string }
interface ExpenseCategory { id: string; name: string; parentId: string | null }
interface IncomeEntry  { id: string; receiptNumber: string; amount: number; date: string; description?: string; paymentMethod?: string; category?: { name: string } }
interface ExpenseEntry { id: string; receiptNumber: string; amount: number; date: string; description?: string; paymentMethod?: string; category?: { id: string; name: string } }
