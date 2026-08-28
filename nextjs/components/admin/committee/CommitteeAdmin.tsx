"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Committee & Governance Admin
//
//  Website.txt spec:
//  • Running committee list (session dates, designations)
//  • Past committees (history by session)
//  • Approval authority rules (membership, qard, large txn)
//  • Only Super Admin can add/modify committee sessions
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { cn, toBengaliDigits, formatDate } from "@/lib/utils/cn";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

interface CommitteeMember {
  id: string; name: string; designation: string; phone: string | null;
  userId: string | null; memberID: string | null; sortOrder: number; status: string;
  joinedAt: string; leftAt: string | null;
}
interface CommitteeSession {
  id: string; sessionName: string; sessionStart: string; sessionEnd: string;
  isActive: boolean; members: CommitteeMember[];
}
interface CommitteeRule {
  id: string; name: string; description: string | null; requiresApproval: boolean;
  minApprovers: number; appliesTo: string; isActive: boolean;
}

type Tab = "running" | "past" | "rules";

export default function CommitteeAdmin({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return <ToastProvider><CommitteeAdminInner isSuperAdmin={isSuperAdmin} /></ToastProvider>;
}

function CommitteeAdminInner({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("running");

  const [sessions, setSessions] = useState<CommitteeSession[]>([]);
  const [rules,    setRules]    = useState<CommitteeRule[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Add member form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memName,  setMemName]  = useState("");
  const [memDesg,  setMemDesg]  = useState("");
  const [memPhone, setMemPhone] = useState("");
  const [memOrder, setMemOrder] = useState("1");
  const [memSub,   setMemSub]   = useState(false);

  // Add session form (Super Admin only)
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessName,  setSessName]  = useState("");
  const [sessStart, setSessStart] = useState("");
  const [sessEnd,   setSessEnd]   = useState("");
  const [sessSub,   setSessSub]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/committee");
      const d   = await res.json();
      setSessions(d.sessions ?? []);
      setRules(d.rules     ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const running = sessions.filter((s) => s.isActive);
  const past    = sessions.filter((s) => !s.isActive);

  async function addMember() {
    const activeSession = running[0];
    if (!activeSession) { showToast("কোনো সক্রিয় সেশন নেই।", "error"); return; }
    if (!memName || !memDesg) { showToast("নাম ও পদবী দিন।", "error"); return; }
    setMemSub(true);
    try {
      const res = await fetch("/api/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          sessionId: activeSession.id, name: memName, designation: memDesg,
          phone: memPhone || undefined, sortOrder: parseInt(memOrder) || 1,
        }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(d.message);
      setMemName(""); setMemDesg(""); setMemPhone(""); setMemOrder("1");
      setShowMemberForm(false); load();
    } finally { setMemSub(false); }
  }

  async function createSession() {
    if (!sessName || !sessStart || !sessEnd) { showToast("সব তথ্য দিন।", "error"); return; }
    setSessSub(true);
    try {
      const res = await fetch("/api/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: "session", sessionName: sessName, sessionStart: sessStart, sessionEnd: sessEnd }),
      });
      const d = await res.json();
      if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
      showToast(d.message);
      setSessName(""); setSessStart(""); setSessEnd("");
      setShowSessionForm(false); load();
    } finally { setSessSub(false); }
  }

  async function removeMember(memberId: string) {
    if (!confirm("এই সদস্যকে মেয়াদোত্তীর্ণ করবেন?")) return;
    const res = await fetch(`/api/committee/${memberId}`, { method: "DELETE" });
    const d   = await res.json();
    if (!res.ok) { showToast(d.error ?? "Error", "error"); return; }
    showToast(d.message); load();
  }

  const DESIGNATION_COLORS: Record<string, string> = {
    "সভাপতি":            "bg-[#C9A227] text-[#0D2B1A]",
    "সহ-সভাপতি":        "bg-amber-100 text-amber-800",
    "সাধারণ সম্পাদক":   "bg-blue-100 text-blue-800",
    "যুগ্ম সম্পাদক":    "bg-indigo-100 text-indigo-800",
    "কোষাধ্যক্ষ":        "bg-green-100 text-green-800",
    "শরিয়াহ পরামর্শক": "bg-teal-100 text-teal-800",
  };

  const RULE_APPLIES: Record<string, string> = {
    membership:        "সদস্যপদ",
    qard:              "করজ অনুমোদন",
    large_transaction: "বড় লেনদেন",
    project:           "প্রজেক্ট",
    investment:        "বিনিয়োগ",
  };

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#0D2B1A]">🏛️ কমিটি ব্যবস্থাপনা</h1>
            <p className="text-sm text-gray-500">কমিটি সদস্য, সেশন ও অনুমোদনের নিয়মকানুন</p>
          </div>
          {isSuperAdmin && (
            <button onClick={() => setShowSessionForm((p) => !p)}
              className="rounded-xl bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1248a0] transition-colors"
            >
              + নতুন সেশন
            </button>
          )}
        </div>

        {/* Session form */}
        {showSessionForm && isSuperAdmin && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-3">
            <h3 className="font-semibold text-blue-800 text-sm">নতুন কমিটি সেশন তৈরি</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-blue-700 mb-1">সেশনের নাম *</label>
                <input value={sessName} onChange={(e) => setSessName(e.target.value)} placeholder="২০২৬-২০২৮ আহ্বায়ক কমিটি"
                  className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">শুরুর তারিখ *</label>
                <input type="date" value={sessStart} onChange={(e) => setSessStart(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">শেষের তারিখ *</label>
                <input type="date" value={sessEnd} onChange={(e) => setSessEnd(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-end">
                <button onClick={createSession} disabled={sessSub}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {sessSub && <Spinner size="sm" />} সেশন তৈরি করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {([
            ["running","চলতি কমিটি"],
            ["past","পুরাতন কমিটি"],
            ["rules","অনুমোদনের নিয়ম"],
          ] as [Tab, string][]).map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k)}
              className={cn("px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
                tab === k ? "bg-[#1D9E75] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              )}>{lbl}</button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (<>

          {/* ── RUNNING COMMITTEE ── */}
          {tab === "running" && (
            <div className="space-y-5">
              {running.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🏛️</div>
                  <p>কোনো সক্রিয় কমিটি নেই। {isSuperAdmin && "উপরে 'নতুন সেশন' তৈরি করুন।"}</p>
                </div>
              ) : running.map((session) => (
                <div key={session.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 bg-[#0D2B1A] text-white">
                    <div>
                      <h2 className="font-bold">{session.sessionName}</h2>
                      <p className="text-xs text-white/60">
                        {formatDate(new Date(session.sessionStart))} — {formatDate(new Date(session.sessionEnd))}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-500 px-3 py-0.5 text-xs font-bold text-white">
                      সক্রিয়
                    </span>
                  </div>

                  {/* Member grid */}
                  <div className="p-5">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {[...session.members].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => (
                        <div key={m.id} className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-[#1D9E75]/30 transition-all">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {m.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#0D2B1A] text-sm truncate">{m.name}</p>
                            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5",
                              DESIGNATION_COLORS[m.designation] ?? "bg-gray-100 text-gray-700"
                            )}>
                              {m.designation}
                            </span>
                            {m.phone && <p className="text-[10px] text-gray-400 mt-0.5">{m.phone}</p>}
                          </div>
                          {isSuperAdmin && (
                            <button onClick={() => removeMember(m.id)}
                              className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add member */}
                    {isSuperAdmin && (
                      <>
                        <button onClick={() => setShowMemberForm((p) => !p)}
                          className="text-sm text-[#1D9E75] font-semibold hover:underline flex items-center gap-1"
                        >
                          + সদস্য যোগ করুন
                        </button>
                        {showMemberForm && (
                          <div className="mt-4 rounded-xl border border-[#1D9E75]/20 bg-[#E1F5EE]/30 p-4 space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">নাম *</label>
                                <input value={memName} onChange={(e) => setMemName(e.target.value)} placeholder="সদস্যের নাম"
                                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">পদবী *</label>
                                <input value={memDesg} onChange={(e) => setMemDesg(e.target.value)} placeholder="যেমন: সদস্য সমন্বয়ক"
                                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                                  list="designations"
                                />
                                <datalist id="designations">
                                  {["সভাপতি","সহ-সভাপতি","সাধারণ সম্পাদক","যুগ্ম সম্পাদক","কোষাধ্যক্ষ","সহকারী কোষাধ্যক্ষ","শরিয়াহ পরামর্শক","সদস্য সমন্বয়ক","অপারেশন ম্যানেজার"].map((d) => (
                                    <option key={d} value={d} />
                                  ))}
                                </datalist>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">মোবাইল</label>
                                <input value={memPhone} onChange={(e) => setMemPhone(e.target.value)} placeholder="01XXXXXXXXX"
                                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">ক্রম</label>
                                <input type="number" value={memOrder} onChange={(e) => setMemOrder(e.target.value)} min={1}
                                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={addMember} disabled={memSub}
                                className="rounded-xl bg-[#1D9E75] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 flex items-center gap-2"
                              >
                                {memSub && <Spinner size="sm" />} যোগ করুন
                              </button>
                              <button onClick={() => setShowMemberForm(false)}
                                className="rounded-xl border border-gray-200 px-5 py-2 text-sm text-gray-600"
                              >
                                বাতিল
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PAST COMMITTEES ── */}
          {tab === "past" && (
            <div className="space-y-4">
              {past.length === 0 ? (
                <div className="text-center py-16 text-gray-400">কোনো পুরাতন কমিটি নেই।</div>
              ) : past.map((session) => (
                <details key={session.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden group">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                    <div>
                      <h3 className="font-bold text-[#0D2B1A]">{session.sessionName}</h3>
                      <p className="text-xs text-gray-500">
                        {formatDate(new Date(session.sessionStart))} — {formatDate(new Date(session.sessionEnd))}
                        <span className="ml-2 text-gray-400">({toBengaliDigits(session.members.length)}জন সদস্য)</span>
                      </p>
                    </div>
                    <span className="text-gray-400 text-sm group-open:rotate-90 transition-transform">▶</span>
                  </summary>
                  <div className="px-5 py-4 border-t border-gray-50">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[...session.members].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => (
                        <div key={m.id} className="flex items-center gap-2 rounded-xl border border-gray-100 p-2.5">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                            {m.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0D2B1A] text-xs truncate">{m.name}</p>
                            <p className="text-[10px] text-gray-400">{m.designation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* ── APPROVAL RULES ── */}
          {tab === "rules" && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-bold text-[#0D2B1A] text-sm">অনুমোদনের কর্তৃত্ব বিধি</h2>
                <p className="text-xs text-gray-500 mt-0.5">কোন ধরনের সিদ্ধান্তে কমিটির অনুমোদন প্রয়োজন।</p>
              </div>
              <div className="divide-y divide-gray-50">
                {rules.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">কোনো নিয়ম নেই।</div>
                ) : rules.map((rule) => (
                  <div key={rule.id} className="px-5 py-4 flex items-start gap-4">
                    <div className={cn(
                      "h-2 w-2 rounded-full mt-1.5 shrink-0",
                      rule.requiresApproval ? "bg-[#1D9E75]" : "bg-gray-300"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#0D2B1A] text-sm">{rule.name}</h3>
                        <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                          {RULE_APPLIES[rule.appliesTo] ?? rule.appliesTo}
                        </span>
                        {rule.requiresApproval && (
                          <span className="rounded-lg bg-[#E1F5EE] px-2 py-0.5 text-[10px] text-[#1D9E75] font-semibold">
                            ন্যূনতম {toBengaliDigits(rule.minApprovers)} অনুমোদন প্রয়োজন
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                      )}
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      rule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {rule.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
