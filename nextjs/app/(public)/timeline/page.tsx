"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Timeline Page
//  Route: /timeline
//
//  Website.txt spec:
//  "এখানে এসে ইউজাররা বিভিন্ন রকম পোস্ট, ঘোষণা, নিউজ
//   দেখতে পারবে। ম্যানুয়াল পোস্টও দেখতে পারবে (নতুন
//   উপরে, পুরাতন নিচে)। পোস্টে ফেইসবুকের মত রিয়েক্ট দিতে
//   পারবে — লগইন ব্যবহারকারী সরাসরি, অতিথিরা নাম লিখে।"
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";
import { ToastProvider, useToast } from "@/components/ui/Toast";

interface Post {
  id:          string;
  title:       string | null;
  content:     string;
  type:        string;
  fbPostUrl:   string | null;
  imageUrl:    string | null;
  publishedAt: string | null;
  author:      { firstName: string; username: string } | null;
  reactions:   { id: string; type: string; name?: string | null }[];
  comments:    { id: string; content: string; name?: string | null; createdAt: string }[];
  _count:      { reactions: number; comments: number };
}

const REACTION_TYPES = [
  { type: "like",  emoji: "👍", label: "পছন্দ" },
  { type: "love",  emoji: "❤️",  label: "ভালোবাসা" },
  { type: "care",  emoji: "🤲", label: "দুআ" },
  { type: "wow",   emoji: "😮", label: "অবাক" },
  { type: "haha",  emoji: "😄", label: "হাহা" },
];

export default function TimelinePage() {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
        <TimelineInner />
      </Suspense>
    </ToastProvider>
  );
}

function TimelineInner() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/public/posts")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setPosts(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function react(postId: string, type: string) {
    const user = session?.user;
    const name = user?.firstName ?? null;
    try {
      const res = await fetch(`/api/public/posts/${postId}/react`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, userId: user?.id ?? null, name }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, ...updated } : p));
      }
    } catch { /* non-fatal */ }
  }

  return (
    <div className="min-h-screen bg-[#FDFAF3]">
      {/* ── Header ── */}
      <div className="bg-[#0D2B1A] py-10 px-4 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#C9A227] mb-2">সংগঠনের কার্যক্রম</span>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>
          টাইমলাইন
        </h1>
        <p className="text-sm text-white/50 mt-1">সর্বশেষ সংবাদ, ঘোষণা ও পোস্ট</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : posts.length === 0 ? (
          <EmptyTimeline />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              session={session}
              isExpanded={expanded.has(post.id)}
              onToggleExpand={() => toggleExpand(post.id)}
              onReact={(type) => react(post.id, type)}
              showToast={showToast}
              onCommentAdded={(updated) =>
                setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, ...updated } : p))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PostCard
// ─────────────────────────────────────────────────────────────
function PostCard({
  post, session, isExpanded, onToggleExpand, onReact, showToast, onCommentAdded,
}: {
  post:            Post;
  session:         ReturnType<typeof useSession>["data"];
  isExpanded:      boolean;
  onToggleExpand:  () => void;
  onReact:         (type: string) => void;
  showToast:       (msg: string, type?: "success"|"error"|"info"|"warning") => void;
  onCommentAdded:  (updated: Partial<Post>) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showComments,  setShowComments]  = useState(false);
  const [comment,       setComment]       = useState("");
  const [guestName,     setGuestName]     = useState("");
  const [submitting,    setSubmitting]    = useState(false);

  const reactionCounts = REACTION_TYPES.map((r) => ({
    ...r,
    count: post.reactions.filter((rx) => rx.type === r.type).length,
  })).filter((r) => r.count > 0);

  const totalReactions = post._count.reactions;
  const totalComments  = post._count.comments;

  async function submitComment() {
    const user = session?.user;
    const name = user?.firstName ?? guestName.trim();
    if (!name) { showToast("নাম দিন।", "error"); return; }
    if (!comment.trim()) { showToast("মন্তব্য লিখুন।", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/posts/${post.id}/comment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: comment, userId: user?.id ?? null, name }),
      });
      if (res.ok) {
        const updated = await res.json();
        onCommentAdded(updated);
        setComment(""); setGuestName("");
        showToast("✅ মন্তব্য পাঠানো হয়েছে। অনুমোদনের পর প্রকাশিত হবে।");
      }
    } catch { showToast("মন্তব্য পাঠাতে ব্যর্থ।", "error"); }
    finally { setSubmitting(false); }
  }

  const textShort = post.content.length > 280;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Author / Meta */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0D2B1A] flex items-center justify-center text-white font-bold text-sm shrink-0">
          {post.author?.firstName?.[0] ?? "ব"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#0D2B1A]">
            {post.author?.firstName ?? "বারাকাহ ফাইন্যান্স"}
          </p>
          <p className="text-xs text-gray-400">
            {post.publishedAt ? formatDate(new Date(post.publishedAt)) : ""}
            {post.type !== "MANUAL" && (
              <span className="ml-2 rounded-full bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                {post.type === "FACEBOOK_EMBED" ? "Facebook" : post.type}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {post.title && (
          <h3 className="font-bold text-[#0D2B1A] mb-2" style={{ fontFamily: "'Noto Serif Bengali',serif" }}>
            {post.title}
          </h3>
        )}

        {post.imageUrl && (
          <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden mb-3 bg-gray-100">
            <Image src={post.imageUrl} alt={post.title ?? "Post image"} fill className="object-cover" sizes="(max-width:640px)100vw,672px" />
          </div>
        )}

        {/* Facebook embed */}
        {post.type === "FACEBOOK_EMBED" && post.fbPostUrl && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 mb-3">
            <Link href={post.fbPostUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-700 font-medium hover:underline"
            >
              <span className="text-xl">📘</span>
              <span>Facebook-এ দেখুন →</span>
            </Link>
          </div>
        )}

        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {isExpanded || !textShort ? post.content : post.content.slice(0, 280) + "…"}
        </p>
        {textShort && (
          <button onClick={onToggleExpand} className="text-xs text-[#1D9E75] font-semibold mt-1 hover:underline">
            {isExpanded ? "কম দেখুন" : "আরও দেখুন"}
          </button>
        )}
      </div>

      {/* Reaction summary bar */}
      {(totalReactions > 0 || totalComments > 0) && (
        <div className="flex items-center justify-between px-5 py-2 border-t border-gray-50 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            {reactionCounts.slice(0, 3).map((r) => (
              <span key={r.type} title={`${r.count} ${r.label}`}>{r.emoji}</span>
            ))}
            {totalReactions > 0 && <span className="ml-1">{totalReactions}</span>}
          </div>
          {totalComments > 0 && (
            <button onClick={() => setShowComments((p) => !p)} className="hover:text-[#1D9E75] transition-colors">
              {totalComments}টি মন্তব্য
            </button>
          )}
        </div>
      )}

      {/* React + Comment action bar */}
      <div className="flex border-t border-gray-50 relative">
        {/* React button with popover */}
        <div className="flex-1 relative">
          <button
            onClick={() => setShowReactions((p) => !p)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-[#1D9E75] transition-colors font-medium"
          >
            <span>👍</span>
            <span>রিয়েক্ট</span>
          </button>
          {/* Reaction picker */}
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white border border-gray-100 rounded-2xl shadow-xl px-3 py-2 z-20">
              {REACTION_TYPES.map((r) => (
                <button
                  key={r.type}
                  onClick={() => { onReact(r.type); setShowReactions(false); }}
                  title={r.label}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment button */}
        <button
          onClick={() => setShowComments((p) => !p)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-[#1D9E75] transition-colors font-medium border-l border-gray-50"
        >
          <span>💬</span>
          <span>মন্তব্য</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-50 px-5 py-4 space-y-3 bg-gray-50/30">
          {/* Existing approved comments */}
          {post.comments.filter((c) => c.content).map((c, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(c.name ?? "?")[0]}
              </div>
              <div className="flex-1 rounded-xl bg-white border border-gray-100 px-3 py-2">
                <p className="text-xs font-semibold text-[#0D2B1A]">{c.name ?? "অজ্ঞাত"}</p>
                <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}

          {/* Comment form */}
          <div className="flex gap-2.5 pt-1">
            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
              {session?.user?.firstName?.[0] ?? "?"}
            </div>
            <div className="flex-1 space-y-2">
              {/* Guest name field */}
              {!session?.user && (
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="আপনার নাম *"
                  className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                />
              )}
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="মন্তব্য লিখুন…"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                />
                <button
                  onClick={submitComment}
                  disabled={submitting || !comment.trim()}
                  className="rounded-xl bg-[#1D9E75] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 transition-colors"
                >
                  {submitting ? "…" : "পাঠান"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📅</div>
      <h2 className="text-xl font-bold text-[#0D2B1A]">কোনো পোস্ট নেই</h2>
      <p className="text-gray-400 mt-2 text-sm">এখনো কোনো পোস্ট প্রকাশিত হয়নি।</p>
      <Link href="/" className="inline-block mt-5 text-sm text-[#1D9E75] hover:underline">
        ← মূল পেজে ফিরুন
      </Link>
    </div>
  );
}
