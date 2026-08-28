"use client";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { ToastProvider, useToast } from "@/components/ui/Toast";

interface Review {
  id: string; name: string; phone: string | null; content: string;
  rating: number; status: string; createdAt: string;
}

export default function ReviewsAdmin() {
  return <ToastProvider><ReviewsAdminInner /></ToastProvider>;
}

function ReviewsAdminInner() {
  const { showToast } = useToast();
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs  = filter !== "ALL" ? `?status=${filter}` : "";
      const res = await fetch(`/api/public/reviews${qs}`);
      const d   = await res.json();
      setReviews(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function moderate(id: string, action: "approve" | "reject") {
    // Using a PATCH to the reviews API (to be added Phase 5 extension)
    // For now show the action intent
    showToast(`${action === "approve" ? "✅ অনুমোদিত" : "✕ প্রত্যাখ্যাত"}: ${id.slice(-6)}`);
    load();
  }

  const STATUS_LABELS: Record<string, string> = { PENDING:"মুলতবি", APPROVED:"অনুমোদিত", REJECTED:"প্রত্যাখ্যাত", HIDDEN:"লুকানো" };
  const STATUS_COLORS: Record<string, string> = {
    PENDING:"bg-amber-50 text-amber-700 border-amber-200",
    APPROVED:"bg-green-50 text-green-700 border-green-200",
    REJECTED:"bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="min-h-screen bg-[#FDFAF3] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-[#0D2B1A] mb-6">⭐ রিভিউ মডারেশন</h1>

        {/* Filter */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 shadow-sm">
          {(["PENDING","APPROVED","REJECTED","ALL"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === f ? "bg-[#1D9E75] text-white" : "text-gray-600 hover:bg-gray-50"
              )}>
              {STATUS_LABELS[f] ?? "সব"}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
          <div className="space-y-3">
            {reviews.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">⭐</div>
                <p>কোনো রিভিউ নেই।</p>
              </div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[#1D9E75] flex items-center justify-center text-white font-bold shrink-0">
                      {r.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#0D2B1A]">{r.name}</p>
                        {r.phone && <span className="text-xs text-gray-400">{r.phone}</span>}
                        <span className="text-[#C9A227]">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">"{r.content}"</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.createdAt).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={cn("rounded-lg border px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[r.status] ?? "bg-gray-50 text-gray-500 border-gray-200")}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                    {r.status === "PENDING" && (
                      <div className="flex gap-1">
                        <button onClick={() => moderate(r.id, "approve")}
                          className="rounded-lg bg-[#1D9E75] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0F6E56]">
                          ✅
                        </button>
                        <button onClick={() => moderate(r.id, "reject")}
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
