"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Global Audit Log Viewer
//
//  Spec (Website.txt):
//  • Immutable — no edit or delete by any admin
//  • Only Super Admin can access
//  • Filter by: User, Module, Action, Record ID, Date range
//  • JSON diff viewer: old value vs new value side-by-side
//  • Shows: User, Action, Module, Record ID, IP, Timestamp
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { cn, toBengaliDigits } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { ToastProvider } from "@/components/ui/Toast";

// ── Types ──────────────────────────────────────────────────
interface AuditEntry {
  id: string;
  action: string;
  module: string;
  recordId: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason:   string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string | null; username: string } | null;
}

interface AuditResponse {
  entries: AuditEntry[];
  total:   number;
  page:    number;
  pages:   number;
}

const MODULES = [
  "members","customers","products","orders","installments","payments",
  "receipts","savings","qard","charity","accounts","expenses","projects",
  "assets","profit","sms","committee","users","permissions","settings",
  "fund_transfers","receipts",
];

const ACTIONS = [
  "CREATE","UPDATE","DELETE","CANCEL","REVERSE","APPROVE","REJECT",
  "LOGIN","LOGOUT","PERMISSION_CHANGE","SETTING_CHANGE","BACKUP",
  "PASSWORD_CHANGE","OTP_VERIFY",
];

const ACTION_COLORS: Record<string, string> = {
  CREATE:           "bg-green-100 text-green-700 border-green-200",
  UPDATE:           "bg-blue-100 text-blue-700 border-blue-200",
  DELETE:           "bg-red-100 text-red-700 border-red-200",
  CANCEL:           "bg-orange-100 text-orange-700 border-orange-200",
  REVERSE:          "bg-purple-100 text-purple-700 border-purple-200",
  APPROVE:          "bg-teal-100 text-teal-700 border-teal-200",
  REJECT:           "bg-red-100 text-red-700 border-red-200",
  LOGIN:            "bg-gray-100 text-gray-600 border-gray-200",
  LOGOUT:           "bg-gray-100 text-gray-600 border-gray-200",
  SETTING_CHANGE:   "bg-amber-100 text-amber-700 border-amber-200",
  PERMISSION_CHANGE:"bg-purple-100 text-purple-700 border-purple-200",
  PASSWORD_CHANGE:  "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export default function AuditLogViewer() {
  return <ToastProvider><AuditLogViewerInner /></ToastProvider>;
}

function AuditLogViewerInner() {
  const [entries,   setEntries]   = useState<AuditEntry[]>([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<AuditEntry | null>(null);

  // Filters
  const [fModule,   setFModule]   = useState("");
  const [fAction,   setFAction]   = useState("");
  const [fUserId,   setFUserId]   = useState("");
  const [fRecordId, setFRecordId] = useState("");
  const [fFrom,     setFFrom]     = useState("");
  const [fTo,       setFTo]       = useState("");
  const [page,      setPage]      = useState(1);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (fModule)   qs.set("module",   fModule);
      if (fAction)   qs.set("action",   fAction);
      if (fUserId)   qs.set("userId",   fUserId);
      if (fRecordId) qs.set("recordId", fRecordId);
      if (fFrom)     qs.set("from",     fFrom);
      if (fTo)       qs.set("to",       fTo);

      const res = await fetch(`/api/audit-log?${qs}`);
      if (!res.ok) { setLoading(false); return; }
      const d: AuditResponse = await res.json();
      setEntries(d.entries ?? []);
      setTotal(d.total    ?? 0);
      setPages(d.pages    ?? 1);
    } finally { setLoading(false); }
  }, [page, fModule, fAction, fUserId, fRecordId, fFrom, fTo]);

  useEffect(() => { load(); }, [load]);

  function search() { setPage(1); load(); }
  function reset()  { setFModule(""); setFAction(""); setFUserId(""); setFRecordId(""); setFFrom(""); setFTo(""); setPage(1); }

  // ── JSON diff renderer ──
  function renderJSON(val: unknown): string {
    if (val === null || val === undefined) return "—";
    try { return JSON.stringify(val, null, 2); }
    catch { return String(val); }
  }

  function DiffViewer({ entry }: { entry: AuditEntry }) {
    const hasOld = entry.oldValue !== null && entry.oldValue !== undefined;
    const hasNew = entry.newValue !== null && entry.newValue !== undefined;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {hasOld && (
            <div>
              <div className="text-xs font-bold text-red-600 mb-1.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> পূর্ববর্তী মান
              </div>
              <pre className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-800 overflow-auto max-h-48 font-mono whitespace-pre-wrap break-all">
                {renderJSON(entry.oldValue)}
              </pre>
            </div>
          )}
          {hasNew && (
            <div className={cn(!hasOld && "col-span-2")}>
              <div className="text-xs font-bold text-green-600 mb-1.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> নতুন মান
              </div>
              <pre className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-800 overflow-auto max-h-48 font-mono whitespace-pre-wrap break-all">
                {renderJSON(entry.newValue)}
              </pre>
            </div>
          )}
          {!hasOld && !hasNew && (
            <div className="col-span-2 text-center py-4 text-gray-400 text-sm">কোনো ডেটা নেই।</div>
          )}
        </div>
        {entry.reason && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 text-xs text-amber-700">
            <strong>কারণ:</strong> {entry.reason}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          {entry.ipAddress && (
            <div><span className="font-medium text-gray-600">IP:</span> {entry.ipAddress}</div>
          )}
          {entry.recordId && (
            <div className="truncate"><span className="font-medium text-gray-600">Record:</span> <span className="font-mono">{entry.recordId}</span></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[#0D2B1A]">📋 গ্লোবাল অডিট লগ</h1>
            <p className="text-sm text-gray-500">
              অপরিবর্তনীয় কার্যক্রমের নথি · মোট {toBengaliDigits(total)} এন্ট্রি
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 font-semibold">
            🔒 শুধুমাত্র Super Admin — পড়ামাত্র অ্যাক্সেস
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">মডিউল</label>
              <select value={fModule} onChange={(e) => setFModule(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              >
                <option value="">সব</option>
                {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">অ্যাকশন</label>
              <select value={fAction} onChange={(e) => setFAction(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              >
                <option value="">সব</option>
                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">User ID</label>
              <input value={fUserId} onChange={(e) => setFUserId(e.target.value)} placeholder="User ID"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Record ID</label>
              <input value={fRecordId} onChange={(e) => setFRecordId(e.target.value)} placeholder="Record ID"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">শুরু</label>
              <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">শেষ</label>
              <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={search}
              className="rounded-xl bg-[#1D9E75] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0F6E56] transition-colors"
            >
              🔍 খুঁজুন
            </button>
            <button onClick={reset}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              রিসেট
            </button>
          </div>
        </div>

        <div className="flex gap-5">
          {/* ── Log table ── */}
          <div className={cn("flex-1 min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden", selected && "hidden lg:block")}>
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📋</div>
                <p>কোনো লগ এন্ট্রি নেই।</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">সময়</th>
                        <th className="px-4 py-3 text-left font-semibold">ব্যবহারকারী</th>
                        <th className="px-4 py-3 text-left font-semibold">অ্যাকশন</th>
                        <th className="px-4 py-3 text-left font-semibold">মডিউল</th>
                        <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Record ID</th>
                        <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {entries.map((entry) => (
                        <tr
                          key={entry.id}
                          onClick={() => setSelected(entry === selected ? null : entry)}
                          className={cn(
                            "cursor-pointer hover:bg-gray-50 transition-colors",
                            selected?.id === entry.id && "bg-[#E1F5EE]/50"
                          )}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            {new Date(entry.createdAt).toLocaleString("bn-BD", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-4 py-3">
                            {entry.user ? (
                              <div>
                                <span className="font-semibold text-[#0D2B1A]">{entry.user.firstName}</span>
                                <span className="text-gray-400 ml-1">@{entry.user.username}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">System</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold",
                              ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-600 border-gray-200"
                            )}>
                              {entry.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-gray-600 font-mono">
                              {entry.module}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-400 truncate max-w-[120px] hidden md:table-cell">
                            {entry.recordId ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                            {entry.ipAddress ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      পৃষ্ঠা {toBengaliDigits(page)} / {toBengaliDigits(pages)} · মোট {toBengaliDigits(total)} এন্ট্রি
                    </span>
                    <div className="flex gap-1">
                      <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        ← আগে
                      </button>
                      <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        পরে →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Detail / Diff viewer ── */}
          {selected && (
            <div className="w-full lg:w-96 shrink-0">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden sticky top-24">
                <div className="flex items-center justify-between px-5 py-4 bg-[#0D2B1A] text-white">
                  <div>
                    <p className="font-bold text-sm">{selected.action} · {selected.module}</p>
                    <p className="text-xs text-white/60">
                      {new Date(selected.createdAt).toLocaleString("bn-BD")}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white text-xl">✕</button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Meta */}
                  <div className="text-xs space-y-1.5">
                    {selected.user && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">ব্যবহারকারী:</span>
                        <strong>{selected.user.firstName} (@{selected.user.username})</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">অ্যাকশন:</span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        ACTION_COLORS[selected.action] ?? "bg-gray-100 text-gray-600"
                      )}>{selected.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">মডিউল:</span>
                      <span className="font-mono text-xs">{selected.module}</span>
                    </div>
                    {selected.recordId && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500 shrink-0">Record:</span>
                        <span className="font-mono text-xs text-right break-all">{selected.recordId}</span>
                      </div>
                    )}
                    {selected.ipAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">IP:</span>
                        <span className="font-mono text-xs">{selected.ipAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-bold text-[#0D2B1A] mb-3">পরিবর্তনের বিবরণ</p>
                    <DiffViewer entry={selected} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Diff viewer (inner, access to selected) ──
  function DiffViewer({ entry }: { entry: AuditEntry }) {
    const hasOld = entry.oldValue !== null && entry.oldValue !== undefined;
    const hasNew = entry.newValue !== null && entry.newValue !== undefined;

    function renderJSON(val: unknown): string {
      if (val === null || val === undefined) return "—";
      try { return JSON.stringify(val, null, 2); }
      catch { return String(val); }
    }

    return (
      <div className="space-y-3">
        <div className={cn("grid gap-3", hasOld && hasNew ? "grid-cols-1" : "grid-cols-1")}>
          {hasOld && (
            <div>
              <div className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> পূর্ববর্তী মান
              </div>
              <pre className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-800 overflow-auto max-h-36 font-mono whitespace-pre-wrap break-all">
                {renderJSON(entry.oldValue)}
              </pre>
            </div>
          )}
          {hasNew && (
            <div>
              <div className="text-xs font-bold text-green-600 mb-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> নতুন মান
              </div>
              <pre className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-800 overflow-auto max-h-36 font-mono whitespace-pre-wrap break-all">
                {renderJSON(entry.newValue)}
              </pre>
            </div>
          )}
          {!hasOld && !hasNew && (
            <p className="text-center text-gray-400 text-xs py-3">ডেটা পরিবর্তন নেই।</p>
          )}
        </div>
        {entry.reason && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
            <strong>কারণ:</strong> {entry.reason}
          </div>
        )}
      </div>
    );
  }
}
