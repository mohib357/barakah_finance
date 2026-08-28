"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — SMS Admin Panel
//
//  Features:
//  • BulkSMSBD balance widget (live fetch)
//  • SMS template manager (CRUD, dynamic tokens)
//  • Broadcast composer (group or custom numbers)
//  • SMS history log with filter
//
//  Dynamic tokens: {name} {amount} {due_date} {member_id}
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { cn, toBengaliDigits } from "@/lib/utils/cn";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

// ── Types ──────────────────────────────────────────────────
interface SMSTemplate {
  id: string; name: string; category: string; template: string; isActive: boolean;
}
interface SMSRecord {
  id: string; phone: string; message: string; status: string;
  sentAt: string | null; count: number;
  sentBy?: { firstName: string; username: string } | null;
}

type Tab = "compose" | "templates" | "history";

// ─────────────────────────────────────────────────────────────
// Token definitions (Website.txt spec)
// ─────────────────────────────────────────────────────────────
const TOKENS = [
  { token: "{name}",      desc: "প্রাপকের নাম" },
  { token: "{amount}",    desc: "টাকার পরিমাণ" },
  { token: "{due_date}",  desc: "শেষ তারিখ" },
  { token: "{member_id}", desc: "সদস্য আইডি" },
  { token: "{receipt_id}",desc: "রসিদ নম্বর" },
  { token: "{qard_id}",   desc: "করজ আইডি" },
  { token: "{order_id}",  desc: "অর্ডার নম্বর" },
];

const GROUPS = [
  { value: "members",   label: "👥 সকল সদস্য" },
  { value: "clients",   label: "🛒 সকল ক্লাইন্ট" },
  { value: "qard",      label: "🤝 করজ গ্রহীতা" },
  { value: "committee", label: "🏛️ কমিটি সদস্য" },
  { value: "all",       label: "📢 সবাই (All Users)" },
];

const TEMPLATE_CATEGORIES = [
  { value: "payment_received",    label: "পেমেন্ট গ্রহণ" },
  { value: "due_reminder",        label: "কিস্তি মনে করিয়ে দেওয়া" },
  { value: "overdue",             label: "মেয়াদোত্তীর্ণ" },
  { value: "membership_approved", label: "সদস্যপদ অনুমোদন" },
  { value: "qard_approved",       label: "করজ অনুমোদন" },
  { value: "birthday",            label: "জন্মদিনের শুভেচ্ছা" },
  { value: "notice",              label: "সাধারণ নোটিশ" },
  { value: "other",               label: "অন্যান্য" },
];

export default function SMSAdmin() {
  return <ToastProvider><SMSAdminInner /></ToastProvider>;
}

function SMSAdminInner() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("compose");

  // Balance
  const [balance,  setBalance]  = useState<number | null>(null);
  const [balLoad,  setBalLoad]  = useState(false);

  // Templates
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [tmplLoad,  setTmplLoad]  = useState(false);
  // Template form
  const [tmplName,  setTmplName]  = useState("");
  const [tmplCat,   setTmplCat]   = useState("notice");
  const [tmplBody,  setTmplBody]  = useState("");
  const [editId,    setEditId]    = useState<string | null>(null);
  const [tmplSub,   setTmplSub]   = useState(false);

  // Compose
  const [sendMode,    setSendMode]    = useState<"group" | "custom">("group");
  const [sendGroup,   setSendGroup]   = useState("members");
  const [customNums,  setCustomNums]  = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTmpl,setSelectedTmpl]= useState("");
  const [message,     setMessage]     = useState("");
  const [tokenVals,   setTokenVals]   = useState<Record<string, string>>({});
  const [sendSub,     setSendSub]     = useState(false);
  const [sendResult,  setSendResult]  = useState<{ sentCount: number; failedCount: number; total: number } | null>(null);

  // History
  const [records,   setRecords]   = useState<SMSRecord[]>([]);
  const [histLoad,  setHistLoad]  = useState(false);
  const [histFrom,  setHistFrom]  = useState("");
  const [histTo,    setHistTo]    = useState("");

  // ── Load balance ──
  const loadBalance = useCallback(async () => {
    setBalLoad(true);
    try {
      const res = await fetch("/api/sms/balance");
      const d   = await res.json();
      setBalance(d.balance ?? 0);
    } finally { setBalLoad(false); }
  }, []);

  // ── Load templates ──
  const loadTemplates = useCallback(async () => {
    setTmplLoad(true);
    try {
      const res = await fetch("/api/sms");
      const d   = await res.json();
      setTemplates(d.templates ?? []);
    } finally { setTmplLoad(false); }
  }, []);

  // ── Load history ──
  const loadHistory = useCallback(async () => {
    setHistLoad(true);
    try {
      const qs = new URLSearchParams({ type: "records" });
      if (histFrom) qs.set("from", histFrom);
      if (histTo)   qs.set("to",   histTo);
      const res = await fetch(`/api/sms?${qs}`);
      const d   = await res.json();
      setRecords(d.records ?? []);
    } finally { setHistLoad(false); }
  }, [histFrom, histTo]);

  useEffect(() => {
    loadBalance();
    loadTemplates();
  }, [loadBalance, loadTemplates]);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  // ── Compose: resolve final message when template selected ──
  useEffect(() => {
    if (useTemplate && selectedTmpl) {
      const tmpl = templates.find((t) => t.id === selectedTmpl);
      if (tmpl) setMessage(tmpl.template);
    }
  }, [selectedTmpl, useTemplate, templates]);

  // ── Detect tokens in current message ──
  const usedTokens = TOKENS.filter((t) => message.includes(t.token));

  // ── Interpolate message preview ──
  function interpolate(msg: string) {
    return msg.replace(/\{(\w+)\}/g, (_, k) => tokenVals[k] ?? `{${k}}`);
  }

  const charCount   = message.length;
  const smsCount    = Math.ceil(charCount / 160) || 1;

  // ── Save template ──
  async function saveTemplate() {
    if (!tmplName || !tmplBody) { showToast("নাম ও বার্তা দিন।", "error"); return; }
    setTmplSub(true);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: editId, name: tmplName, category: tmplCat, template: tmplBody }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(d.message);
      setTmplName(""); setTmplBody(""); setEditId(null);
      loadTemplates();
    } finally { setTmplSub(false); }
  }

  function editTemplate(tmpl: SMSTemplate) {
    setEditId(tmpl.id); setTmplName(tmpl.name); setTmplCat(tmpl.category); setTmplBody(tmpl.template);
  }

  // ── Send SMS ──
  async function sendSMS() {
    if (!message.trim()) { showToast("বার্তা লিখুন।", "error"); return; }
    const finalMessage = interpolate(message);

    const body: Record<string, unknown> = {
      message: finalMessage,
      ...(useTemplate && selectedTmpl ? { templateId: selectedTmpl } : {}),
      tokens:  tokenVals,
    };

    if (sendMode === "group") {
      body.group = sendGroup;
    } else {
      const phones = customNums.split(/[\n,;]+/).map((p) => p.trim()).filter(Boolean);
      if (phones.length === 0) { showToast("অন্তত একটি নম্বর দিন।", "error"); return; }
      body.phones = phones;
    }

    setSendSub(true); setSendResult(null);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "পাঠাতে ব্যর্থ।", "error"); return; }
      showToast(`✅ ${d.message}`);
      setSendResult({ sentCount: d.sentCount, failedCount: d.failedCount, total: d.total });
      loadBalance();
    } finally { setSendSub(false); }
  }

  const TAB_BTN = (key: Tab, lbl: string) => (
    <button key={key} onClick={() => setTab(key)}
      className={cn("px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
        tab === key ? "bg-[#1D9E75] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
      )}>{lbl}</button>
  );

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Header + balance ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0D2B1A]">📱 SMS ব্যবস্থাপনা</h1>
            <p className="text-sm text-gray-500">BulkSMSBD গেটওয়ে · টেমপ্লেট ও গ্রুপ বার্তা</p>
          </div>

          {/* Balance widget */}
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
            <div className="text-2xl">📊</div>
            <div>
              <div className="text-xs text-gray-500">SMS ব্যালেন্স</div>
              <div className="flex items-center gap-2">
                {balLoad
                  ? <Spinner size="sm" />
                  : <span className={cn("text-xl font-bold", (balance ?? 0) < 100 ? "text-red-600" : "text-[#1D9E75]")}>
                      {toBengaliDigits(balance ?? 0)}
                    </span>
                }
                <button onClick={loadBalance} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">🔄</button>
              </div>
              {(balance ?? 0) < 100 && (
                <div className="text-[10px] text-red-500 font-semibold mt-0.5">⚠️ ব্যালেন্স কম — রিচার্জ করুন</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {TAB_BTN("compose",   "✉️ বার্তা পাঠান")}
          {TAB_BTN("templates", "📋 টেমপ্লেট")}
          {TAB_BTN("history",   "📜 ইতিহাস")}
        </div>

        {/* ════════ TAB: COMPOSE ════════ */}
        {tab === "compose" && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Left: compose form */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-[#0D2B1A] text-sm">বার্তা লিখুন</h2>

              {/* Recipient mode */}
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                {(["group","custom"] as const).map((m) => (
                  <button key={m} onClick={() => setSendMode(m)}
                    className={cn("flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
                      sendMode === m ? "bg-white shadow text-[#0D2B1A]" : "text-gray-500"
                    )}
                  >
                    {m === "group" ? "👥 গ্রুপ" : "📞 কাস্টম নম্বর"}
                  </button>
                ))}
              </div>

              {sendMode === "group" ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">গ্রুপ নির্বাচন *</label>
                  <select value={sendGroup} onChange={(e) => setSendGroup(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  >
                    {GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    মোবাইল নম্বর * <span className="text-gray-400">(কমা বা নতুন লাইনে আলাদা করুন)</span>
                  </label>
                  <textarea
                    value={customNums}
                    onChange={(e) => setCustomNums(e.target.value)}
                    rows={3}
                    placeholder="01XXXXXXXXX&#10;01XXXXXXXXX"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] resize-none"
                  />
                </div>
              )}

              {/* Template toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={useTemplate} onChange={(e) => setUseTemplate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">টেমপ্লেট ব্যবহার করুন</span>
              </label>

              {useTemplate && (
                <select value={selectedTmpl} onChange={(e) => setSelectedTmpl(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                >
                  <option value="">— টেমপ্লেট বেছে নিন —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}

              {/* Message textarea */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">বার্তা *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="এখানে বার্তা লিখুন… {name}, {amount}, {due_date} ইত্যাদি টোকেন ব্যবহার করুন।"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] resize-none"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>{toBengaliDigits(charCount)} অক্ষর</span>
                  <span>{toBengaliDigits(smsCount)} SMS ব্যবহৃত হবে</span>
                </div>
              </div>

              {/* Token quick-insert */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">টোকেন যোগ করুন</p>
                <div className="flex flex-wrap gap-1.5">
                  {TOKENS.map((t) => (
                    <button key={t.token}
                      onClick={() => setMessage((prev) => prev + t.token)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-mono text-gray-600 hover:bg-[#E1F5EE] hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all"
                      title={t.desc}
                    >
                      {t.token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token values (if tokens used) */}
              {usedTokens.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700">টোকেনের মান দিন (ঐচ্ছিক — ব্যক্তিগত পাঠানোর জন্য)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {usedTokens.map((t) => (
                      <div key={t.token}>
                        <label className="block text-[10px] text-amber-600 mb-0.5">{t.token} ({t.desc})</label>
                        <input
                          value={tokenVals[t.token.slice(1, -1)] ?? ""}
                          onChange={(e) => setTokenVals((prev) => ({ ...prev, [t.token.slice(1, -1)]: e.target.value }))}
                          placeholder="মান লিখুন"
                          className="w-full rounded-lg border border-amber-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={sendSMS} disabled={sendSub || !message.trim()}
                className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-bold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {sendSub && <Spinner size="sm" />}
                📤 SMS পাঠান
              </button>

              {/* Send result */}
              {sendResult && (
                <div className={cn("rounded-xl px-4 py-3 text-sm font-semibold",
                  sendResult.failedCount === 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                )}>
                  ✅ {toBengaliDigits(sendResult.sentCount)}/{toBengaliDigits(sendResult.total)} পাঠানো সফল
                  {sendResult.failedCount > 0 && ` · ${toBengaliDigits(sendResult.failedCount)}টি ব্যর্থ`}
                </div>
              )}
            </div>

            {/* Right: preview */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h3 className="font-bold text-[#0D2B1A] text-sm mb-3">📱 প্রিভিউ</h3>
                <div className="rounded-xl bg-[#0D2B1A] p-4 min-h-24">
                  <div className="inline-block rounded-2xl rounded-tl-none bg-[#1D9E75] px-4 py-3 max-w-[90%]">
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {interpolate(message) || "বার্তা এখানে দেখাবে…"}
                    </p>
                  </div>
                  <div className="text-right mt-2">
                    <span className="text-[10px] text-white/40">
                      {new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* BulkSMSBD info */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h3 className="font-bold text-[#0D2B1A] text-sm mb-3">🔌 গেটওয়ে তথ্য</h3>
                <dl className="space-y-2 text-xs">
                  {[
                    ["প্রোভাইডার",   "BulkSMSBD (bulksmsbd.net)"],
                    ["API URL",      process.env.NODE_ENV === "development" ? "configured via .env" : "http://bulksmsbd.net/api/smsapi"],
                    ["Sender ID",    "8809617611021"],
                    ["এনকোডিং",      "UTF-8 (Bangla সাপোর্ট)"],
                    ["Char/SMS",     "160 (English) / 70 (Bangla)"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-gray-500 shrink-0">{k}:</dt>
                      <dd className="font-mono text-gray-700 text-right break-all">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* ════════ TAB: TEMPLATES ════════ */}
        {tab === "templates" && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Template form */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-[#0D2B1A] text-sm">
                {editId ? "টেমপ্লেট সম্পাদনা" : "নতুন টেমপ্লেট"}
              </h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">নাম *</label>
                <input value={tmplName} onChange={(e) => setTmplName(e.target.value)}
                  placeholder="টেমপ্লেটের নাম"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ক্যাটাগরি</label>
                <select value={tmplCat} onChange={(e) => setTmplCat(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                >
                  {TEMPLATE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">টেমপ্লেট বার্তা *</label>
                <textarea value={tmplBody} onChange={(e) => setTmplBody(e.target.value)} rows={5}
                  placeholder="প্রিয় {name}, আপনার {amount} টাকার কিস্তি {due_date} তারিখে প্রদেয়। — বারাকাহ ফাইন্যান্স"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] resize-none"
                />
                <div className="text-[10px] text-gray-400 mt-1">{tmplBody.length} অক্ষর</div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveTemplate} disabled={tmplSub}
                  className="flex-1 rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {tmplSub && <Spinner size="sm" />}
                  {editId ? "আপডেট করুন" : "সেভ করুন"}
                </button>
                {editId && (
                  <button onClick={() => { setEditId(null); setTmplName(""); setTmplBody(""); setTmplCat("notice"); }}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600"
                  >
                    বাতিল
                  </button>
                )}
              </div>
            </div>

            {/* Template list */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 font-bold text-[#0D2B1A] text-sm">
                বিদ্যমান টেমপ্লেট ({toBengaliDigits(templates.length)}টি)
              </div>
              {tmplLoad ? <div className="flex justify-center py-8"><Spinner /></div> : (
                <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                  {templates.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">কোনো টেমপ্লেট নেই।</div>
                  )}
                  {templates.map((t) => (
                    <div key={t.id} className="px-5 py-3 hover:bg-gray-50 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#0D2B1A]">{t.name}</p>
                          <p className="text-[10px] text-[#1D9E75] font-medium">
                            {TEMPLATE_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.template}</p>
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editTemplate(t)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-100"
                          >
                            সম্পাদনা
                          </button>
                          <button
                            onClick={() => { setMessage(t.template); setTab("compose"); }}
                            className="rounded-lg bg-[#E1F5EE] px-2 py-1 text-[10px] text-[#1D9E75] font-semibold hover:bg-[#1D9E75] hover:text-white"
                          >
                            ব্যবহার করুন
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ TAB: HISTORY ════════ */}
        {tab === "history" && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-[#0D2B1A] text-sm flex-1">SMS ইতিহাস</h2>
              <input type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
              <button onClick={loadHistory} className="rounded-xl bg-[#1D9E75] px-4 py-1.5 text-sm text-white font-semibold hover:bg-[#0F6E56]">
                খুঁজুন
              </button>
            </div>

            {histLoad ? <div className="flex justify-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">মোবাইল</th>
                      <th className="px-4 py-3 text-left">বার্তা</th>
                      <th className="px-4 py-3 text-center">SMS</th>
                      <th className="px-4 py-3 text-center">অবস্থা</th>
                      <th className="px-4 py-3 text-left">সময়</th>
                      <th className="px-4 py-3 text-left">পাঠিয়েছেন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">কোনো রেকর্ড নেই।</td></tr>
                    ) : records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono">{r.phone}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.message}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{toBengaliDigits(r.count)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            r.status === "SENT"    ? "bg-green-50 text-green-700 border-green-200" :
                            r.status === "FAILED"  ? "bg-red-50 text-red-700 border-red-200" :
                                                     "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {r.status === "SENT" ? "সফল" : r.status === "FAILED" ? "ব্যর্থ" : "মুলতবি"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {r.sentAt ? new Date(r.sentAt).toLocaleString("bn-BD") : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {r.sentBy ? `${r.sentBy.firstName} (${r.sentBy.username})` : "System"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
