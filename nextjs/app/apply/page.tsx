"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import NoticeBar from "@/components/layout/NoticeBar";
import Footer from "@/components/layout/Footer";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

// BD address hierarchy (top-level divisions — full data from lib/data/bd-address)
const DIVISIONS = ["ঢাকা","চট্টগ্রাম","রাজশাহী","খুলনা","বরিশাল","সিলেট","রংপুর","ময়মনসিংহ"];
const DISTRICTS: Record<string, string[]> = {
  "ঢাকা":       ["ঢাকা","গাজীপুর","নারায়ণগঞ্জ","মানিকগঞ্জ","মুন্সিগঞ্জ","নরসিংদী","টাঙ্গাইল","কিশোরগঞ্জ","ফরিদপুর","মাদারীপুর","শরীয়তপুর","গোপালগঞ্জ","রাজবাড়ী"],
  "রংপুর":      ["রংপুর","লালমনিরহাট","কুড়িগ্রাম","গাইবান্ধা","নীলফামারী","দিনাজপুর","ঠাকুরগাঁও","পঞ্চগড়"],
  "চট্টগ্রাম":  ["চট্টগ্রাম","কক্সবাজার","রাঙামাটি","বান্দরবান","খাগড়াছড়ি","ফেনী","লক্ষ্মীপুর","নোয়াখালী","কুমিল্লা","ব্রাহ্মণবাড়িয়া","চাঁদপুর"],
  "রাজশাহী":   ["রাজশাহী","নাটোর","নওগাঁ","চাঁপাইনবাবগঞ্জ","জয়পুরহাট","বগুড়া","সিরাজগঞ্জ","পাবনা"],
  "খুলনা":     ["খুলনা","বাগেরহাট","সাতক্ষীরা","যশোর","নড়াইল","মাগুরা","ঝিনাইদহ","কুষ্টিয়া","চুয়াডাঙ্গা","মেহেরপুর"],
  "বরিশাল":    ["বরিশাল","পিরোজপুর","ঝালকাঠি","পটুয়াখালী","ভোলা","বরগুনা"],
  "সিলেট":     ["সিলেট","মৌলভীবাজার","হবিগঞ্জ","সুনামগঞ্জ"],
  "ময়মনসিংহ": ["ময়মনসিংহ","জামালপুর","শেরপুর","নেত্রকোণা"],
};

const INV_TYPES = [
  { key: "MONTHLY_SAVINGS",    icon: "💰", title: "মাসিক সঞ্চয়",     desc: "প্রতি মাসে ২,০০০ টাকা জমা — ১ ইউনিট = ২,০০০ টাকা।" },
  { key: "ONETIME_INVESTMENT", icon: "💎", title: "এককালীন বিনিয়োগ", desc: "একবারে যেকোনো পরিমাণ — ইউনিট হিসেবে গণনা হবে।" },
  { key: "PROJECT_INVESTMENT", icon: "🏗️", title: "প্রজেক্ট বিনিয়োগ",  desc: "নির্দিষ্ট প্রজেক্টে বিনিয়োগ — লাভ আনুপাতিক।" },
];

const STEPS = [
  { num: "১", label: "ব্যক্তিগত" },
  { num: "২", label: "নমিনি" },
  { num: "৩", label: "বিনিয়োগ" },
  { num: "৪", label: "ছবি" },
  { num: "৫", label: "পর্যালোচনা" },
];

export default function ApplyPage() {
  return (
    <ToastProvider>
      <Navbar />
      <NoticeBar />
      <ApplyForm />
      <Footer />
    </ToastProvider>
  );
}

function ApplyForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  // Step 1 — Personal
  const [nameBn, setNameBn]     = useState(session?.user?.firstName ?? "");
  const [nameEn, setNameEn]     = useState("");
  const [father, setFather]     = useState("");
  const [mother, setMother]     = useState("");
  const [dob, setDob]           = useState("");
  const [gender, setGender]     = useState("");
  const [phone, setPhone]       = useState(session?.user?.phone ?? "");
  const [email, setEmail]       = useState(session?.user?.email ?? "");
  const [nid, setNid]           = useState("");
  const [profession, setProfession] = useState("");
  const [division, setDivision]     = useState("");
  const [district, setDistrict]     = useState("");
  const [upazila, setUpazila]       = useState("");
  const [village, setVillage]       = useState("");

  // Step 2 — Nominee
  const [nomName, setNomName]   = useState("");
  const [nomFather, setNomFather] = useState("");
  const [nomRel, setNomRel]     = useState("");
  const [nomPhone, setNomPhone] = useState("");
  const [nomGender, setNomGender] = useState("");
  const [nomAddress, setNomAddress] = useState("");

  // Step 3 — Investment
  const [invType, setInvType]   = useState("MONTHLY_SAVINGS");
  const [invAmount, setInvAmount] = useState("");
  const [invStart, setInvStart]   = useState("");

  // Step 4 — Photos
  const [photoData, setPhotoData] = useState<string>("");   // base64 dataURL
  const [signData, setSignData]   = useState<string>("");
  const [nidFront, setNidFront]   = useState<File | null>(null);
  const [nidBack, setNidBack]     = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef  = useRef<HTMLInputElement>(null);
  const nidFrontRef   = useRef<HTMLInputElement>(null);
  const nidBackRef    = useRef<HTMLInputElement>(null);

  const inp = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]";
  const lbl = "block text-sm font-medium text-[#0D2B1A] mb-1.5";

  // Resize image via canvas (server-safe: runs client-side)
  function resizeImage(file: File, targetW: number, targetH: number, maxKB: number): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width  = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, targetW, targetH);
          // Cover fill
          const scale = Math.max(targetW / img.width, targetH / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (targetW - w) / 2, (targetH - h) / 2, w, h);
          let quality = 0.9;
          let dataUrl = canvas.toDataURL("image/webp", quality);
          // Reduce quality until under maxKB
          while (dataUrl.length * 0.75 > maxKB * 1024 && quality > 0.3) {
            quality -= 0.05;
            dataUrl = canvas.toDataURL("image/webp", quality);
          }
          resolve(dataUrl);
        };
        img.src = ev.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await resizeImage(file, 570, 450, 2048);
    setPhotoData(data);
  }

  async function handleSignChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await resizeImage(file, 300, 80, 100);
    setSignData(data);
  }

  function validateStep() {
    setErr("");
    if (step === 1) {
      if (!nameBn || !nameEn || !father || !dob || !gender || !phone || !nid || !division || !district || !village) {
        setErr("তারকা চিহ্নিত সব তথ্য পূরণ করুন।"); return false;
      }
    }
    if (step === 2) {
      if (!nomName || !nomRel || !nomPhone) {
        setErr("নমিনির নাম, সম্পর্ক ও মোবাইল বাধ্যতামূলক।"); return false;
      }
    }
    if (step === 4) {
      if (!photoData || !signData || !nidFront) {
        setErr("ছবি, স্বাক্ষর ও NID-এর সামনের পৃষ্ঠা বাধ্যতামূলক।"); return false;
      }
    }
    return true;
  }

  function goStep(n: number) {
    if (n > step && !validateStep()) return;
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    if (!session?.user) {
      router.push("/login?callbackUrl=/apply");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId",     session.user.id);
      formData.append("nameBn",     nameBn);
      formData.append("nameEn",     nameEn);
      formData.append("fatherName", father);
      formData.append("motherName", mother);
      formData.append("dob",        dob);
      formData.append("gender",     gender);
      formData.append("phone",      phone);
      formData.append("email",      email);
      formData.append("nid",        nid);
      formData.append("profession", profession);
      formData.append("division",   division);
      formData.append("district",   district);
      formData.append("upazila",    upazila);
      formData.append("village",    village);
      // Nominee
      formData.append("nomineeName",     nomName);
      formData.append("nomineeRelation", nomRel);
      formData.append("nomineePhone",    nomPhone);
      formData.append("nomineeGender",   nomGender);
      formData.append("nomineeAddress",  nomAddress);
      // Investment
      formData.append("investType",   invType);
      formData.append("investAmount", invAmount || "0");
      formData.append("investStart",  invStart);
      // Photos (base64)
      formData.append("photoDataUrl", photoData);
      formData.append("signDataUrl",  signData);
      if (nidFront) formData.append("nidFront", nidFront);
      if (nidBack)  formData.append("nidBack",  nidBack);

      const res = await fetch("/api/member-applications", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "জমা ব্যর্থ।"); return; }
      showToast("✅ আবেদন জমা হয়েছে! কমিটি অনুমোদন দিলে SMS পাবেন।");
      router.push("/dashboard");
    } catch {
      setErr("সার্ভার সমস্যা।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFAF3] pb-20 pt-6">
      <div className="mx-auto max-w-3xl px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-5">
          <Link href="/" className="hover:text-[#1D9E75]">হোম</Link>
          <span>›</span>
          <span className="text-[#0D2B1A] font-medium">সদস্য আবেদন</span>
        </nav>

        <div className="rounded-2xl border border-[#1D9E75]/15 bg-white shadow-lg overflow-hidden">
          {/* Card header */}
          <div className="p-7 pb-5" style={{ background: "linear-gradient(135deg,#0D2B1A,#163a24)" }}>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Noto Serif Bengali', serif" }}>
              📝 সদস্যপদ আবেদন ফরম
            </h1>
            <p className="text-sm text-white/60 mt-1">বারাকাহ ফাইন্যান্সের সদস্য হতে নিচের ফরমটি সম্পূর্ণ পূরণ করুন।</p>
          </div>

          <div className="p-7">
            {/* Step Indicator */}
            <div className="flex items-center mb-8">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => i + 1 < step && setStep(i + 1)}
                      disabled={i + 1 > step}
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                        i + 1 === step && "border-[#1D9E75] bg-[#1D9E75] text-white shadow-md ring-4 ring-[#1D9E75]/20",
                        i + 1  < step && "border-[#1D9E75] bg-[#1D9E75] text-white cursor-pointer",
                        i + 1  > step && "border-gray-200 bg-white text-gray-400"
                      )}
                    >
                      {i + 1 < step ? "✓" : s.num}
                    </button>
                    <span className={cn("text-[10px] mt-1 whitespace-nowrap",
                      i + 1 === step ? "text-[#1D9E75] font-semibold" : "text-gray-400"
                    )}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-1 mb-4 transition-colors",
                      step > i + 1 ? "bg-[#1D9E75]" : "bg-gray-200"
                    )} />
                  )}
                </div>
              ))}
            </div>

            {/* Error */}
            {err && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</div>
            )}

            {/* ── STEP 1: Personal ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-[#0D2B1A] text-base mb-3">ধাপ ১ — ব্যক্তিগত তথ্য</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="নাম (বাংলা) *" value={nameBn} onChange={setNameBn} placeholder="মুহিব্বুল্লাহ আজাদ" />
                  <Field label="নাম (ইংরেজি) *" value={nameEn} onChange={setNameEn} placeholder="Muhibbullah Azad" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="পিতার নাম *" value={father} onChange={setFather} placeholder="পিতার পূর্ণ নাম" />
                  <Field label="মাতার নাম" value={mother} onChange={setMother} placeholder="মাতার পূর্ণ নাম" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="জন্ম তারিখ *" value={dob} onChange={setDob} type="date" />
                  <div>
                    <label className={lbl}>লিঙ্গ *</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={inp}>
                      <option value="">বেছে নিন</option>
                      <option value="MALE">পুরুষ</option>
                      <option value="FEMALE">মহিলা</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="মোবাইল নং *" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" type="tel" />
                  <Field label="ইমেইল" value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="এনআইডি / জন্ম নিবন্ধন নং *" value={nid} onChange={setNid} placeholder="NID নম্বর" />
                  <div>
                    <label className={lbl}>পেশা</label>
                    <select value={profession} onChange={(e) => setProfession(e.target.value)} className={inp}>
                      <option value="">বেছে নিন</option>
                      {["ব্যবসায়ী","কৃষক","শিক্ষক","ছাত্র","গৃহিণী","সরকারি চাকরিজীবী","অন্যান্য"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs font-semibold text-[#0D2B1A] mt-2">📍 বর্তমান ঠিকানা</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>বিভাগ *</label>
                    <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); }} className={inp}>
                      <option value="">বেছে নিন</option>
                      {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>জেলা *</label>
                    <select value={district} onChange={(e) => setDistrict(e.target.value)} className={inp} disabled={!division}>
                      <option value="">বিভাগ বেছে নিন</option>
                      {(DISTRICTS[division] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="উপজেলা/থানা *" value={upazila} onChange={setUpazila} placeholder="উপজেলা/থানা" />
                  <Field label="গ্রাম/মহল্লা/বাসা নং *" value={village} onChange={setVillage} placeholder="গ্রাম/বাসা নং" />
                </div>
              </div>
            )}

            {/* ── STEP 2: Nominee ── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-[#0D2B1A] text-base mb-3">ধাপ ২ — নমিনির তথ্য</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="নমিনির নাম *" value={nomName} onChange={setNomName} placeholder="পূর্ণ নাম" />
                  <Field label="পিতার নাম" value={nomFather} onChange={setNomFather} placeholder="পিতার নাম" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>সম্পর্ক *</label>
                    <select value={nomRel} onChange={(e) => setNomRel(e.target.value)} className={inp}>
                      <option value="">বেছে নিন</option>
                      {["স্বামী","স্ত্রী","পিতা","মাতা","পুত্র","কন্যা","ভাই","বোন","অন্যান্য"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <Field label="মোবাইল নং *" value={nomPhone} onChange={setNomPhone} placeholder="01XXXXXXXXX" type="tel" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>লিঙ্গ</label>
                    <select value={nomGender} onChange={(e) => setNomGender(e.target.value)} className={inp}>
                      <option value="">বেছে নিন</option>
                      <option value="MALE">পুরুষ</option>
                      <option value="FEMALE">মহিলা</option>
                    </select>
                  </div>
                  <Field label="ঠিকানা" value={nomAddress} onChange={setNomAddress} placeholder="নমিনির ঠিকানা" />
                </div>
              </div>
            )}

            {/* ── STEP 3: Investment ── */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-bold text-[#0D2B1A] text-base mb-3">ধাপ ৩ — বিনিয়োগের ধরন</h2>
                {INV_TYPES.map((it) => (
                  <label
                    key={it.key}
                    onClick={() => setInvType(it.key)}
                    className={cn(
                      "block rounded-xl border-2 p-4 cursor-pointer transition-all",
                      invType === it.key
                        ? "border-[#1D9E75] bg-[#E1F5EE]"
                        : "border-gray-200 hover:border-[#1D9E75]/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{it.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[#0D2B1A]">{it.title}</p>
                        <p className="text-xs text-gray-500">{it.desc}</p>
                      </div>
                      <input type="radio" name="invType" value={it.key} checked={invType === it.key} onChange={() => setInvType(it.key)} className="shrink-0" />
                    </div>

                    {/* Extra fields per type */}
                    {invType === it.key && it.key === "MONTHLY_SAVINGS" && (
                      <div className="mt-3 pt-3 border-t border-[#1D9E75]/20">
                        <label className={lbl}>শুরুর মাস *</label>
                        <input type="month" value={invStart} onChange={(e) => setInvStart(e.target.value)} className={inp} />
                      </div>
                    )}
                    {invType === it.key && (it.key === "ONETIME_INVESTMENT" || it.key === "PROJECT_INVESTMENT") && (
                      <div className="mt-3 pt-3 border-t border-[#1D9E75]/20">
                        <label className={lbl}>বিনিয়োগের পরিমাণ (৳) *</label>
                        <input type="number" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} placeholder="৳" className={inp} />
                        {invAmount && (
                          <p className="text-xs text-[#1D9E75] mt-1">
                            ≈ {Math.floor(parseFloat(invAmount) / 2000).toFixed(2)} ইউনিট
                          </p>
                        )}
                      </div>
                    )}
                  </label>
                ))}
              </div>
            )}

            {/* ── STEP 4: Photos ── */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="font-bold text-[#0D2B1A] text-base mb-3">ধাপ ৪ — ছবি ও স্বাক্ষর</h2>

                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Profile Photo */}
                  <div>
                    <p className="text-sm font-medium text-[#0D2B1A] mb-1">আবেদনকারীর ছবি *</p>
                    <p className="text-xs text-gray-400 mb-2">পাসপোর্ট সাইজ, সাদা ব্যাকগ্রাউন্ড। সর্বোচ্চ ২ MB।</p>
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1D9E75] transition-colors flex flex-col items-center justify-center p-6 min-h-[140px]"
                    >
                      {photoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoData} alt="photo preview" className="max-h-32 rounded-lg object-cover" />
                      ) : (
                        <>
                          <span className="text-3xl mb-2">📷</span>
                          <span className="text-xs text-gray-400">ক্লিক করে ছবি বেছে নিন</span>
                          <span className="text-[10px] text-gray-300 mt-1">৫৭০×৪৫০ px | সর্বোচ্চ ২ MB</span>
                        </>
                      )}
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>

                  {/* Signature */}
                  <div>
                    <p className="text-sm font-medium text-[#0D2B1A] mb-1">স্বাক্ষর *</p>
                    <p className="text-xs text-gray-400 mb-2">সাদা ব্যাকগ্রাউন্ডে স্বাক্ষর। সর্বোচ্চ ১০০ KB।</p>
                    <div
                      onClick={() => signInputRef.current?.click()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1D9E75] transition-colors flex flex-col items-center justify-center p-6 min-h-[140px]"
                    >
                      {signData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signData} alt="signature preview" className="max-h-20 object-contain" />
                      ) : (
                        <>
                          <span className="text-3xl mb-2">✍️</span>
                          <span className="text-xs text-gray-400">ক্লিক করে স্বাক্ষর বেছে নিন</span>
                          <span className="text-[10px] text-gray-300 mt-1">৩০০×৮০ px | সর্বোচ্চ ১০০ KB</span>
                        </>
                      )}
                    </div>
                    <input ref={signInputRef} type="file" accept="image/*" className="hidden" onChange={handleSignChange} />
                  </div>
                </div>

                {/* NID Upload */}
                <div>
                  <p className="text-sm font-medium text-[#0D2B1A] mb-2">এনআইডি কার্ড *</p>
                  <div className="flex gap-4 flex-wrap">
                    {[
                      { label: "সামনের পৃষ্ঠা *", ref: nidFrontRef, file: nidFront, setFile: setNidFront },
                      { label: "পেছনের পৃষ্ঠা",   ref: nidBackRef,  file: nidBack,  setFile: setNidBack  },
                    ].map((nidField) => (
                      <div key={nidField.label}>
                        <p className="text-xs text-gray-500 mb-1">{nidField.label}</p>
                        <div
                          onClick={() => nidField.ref.current?.click()}
                          className="w-40 h-24 cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1D9E75] flex flex-col items-center justify-center transition-colors"
                        >
                          {nidField.file ? (
                            <span className="text-xs text-[#1D9E75] font-medium">✓ {nidField.file.name.slice(0, 15)}...</span>
                          ) : (
                            <>
                              <span className="text-2xl">🪪</span>
                              <span className="text-[10px] text-gray-400 mt-1">আপলোড করুন</span>
                            </>
                          )}
                        </div>
                        <input
                          ref={nidField.ref}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => nidField.setFile(e.target.files?.[0] ?? null)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 5: Review ── */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="font-bold text-[#0D2B1A] text-base mb-3">ধাপ ৫ — পর্যালোচনা ও জমা</h2>
                <ReviewRow label="নাম (বাংলা)"    value={nameBn} />
                <ReviewRow label="নাম (ইংরেজি)"   value={nameEn} />
                <ReviewRow label="পিতার নাম"       value={father} />
                <ReviewRow label="জন্ম তারিখ"      value={dob} />
                <ReviewRow label="মোবাইল"          value={phone} />
                <ReviewRow label="NID"              value={nid} />
                <ReviewRow label="ঠিকানা"           value={`${village}, ${upazila}, ${district}, ${division}`} />
                <ReviewRow label="নমিনি"            value={`${nomName} (${nomRel})`} />
                <ReviewRow label="বিনিয়োগের ধরন"  value={INV_TYPES.find((t) => t.key === invType)?.title ?? invType} />
                {invAmount && <ReviewRow label="বিনিয়োগের পরিমাণ" value={`৳${invAmount}`} />}
                <div className="flex gap-4 mt-2">
                  {photoData && <img src={photoData} alt="photo" className="h-20 rounded-lg border" />}
                  {signData  && <img src={signData}  alt="sign"  className="h-10 border rounded self-end" />}
                </div>

                <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                  ⚠️ আবেদন জমা দেওয়ার পর কমিটি অনুমোদন করলে আপনাকে SMS পাঠানো হবে এবং পেমেন্ট করতে বলা হবে।
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button onClick={() => goStep(step - 1)} className="rounded-xl border-2 border-gray-200 px-6 py-2.5 text-sm font-semibold text-[#0D2B1A] hover:border-[#1D9E75] transition-colors">
                  ← পূর্ববর্তী
                </button>
              ) : <div />}

              {step < 5 ? (
                <button onClick={() => goStep(step + 1)} className="rounded-xl bg-[#1D9E75] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] transition-colors">
                  পরবর্তী →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-[#1D9E75] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#0F6E56] disabled:opacity-60 transition-colors"
                >
                  {loading && <Spinner size="sm" />}
                  ✅ আবেদন জমা দিন
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#0D2B1A] mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="w-40 shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-[#0D2B1A]">{value || "—"}</span>
    </div>
  );
}
