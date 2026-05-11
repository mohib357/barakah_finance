// C: \Project\Barakah_Finance\js\data.js

// Geographic data, occupations, translations

// ─── DIVISION → DISTRICT → THANA → POST OFFICE DATA ───
const BD_DATA = {
  "রংপুর": {
    "লালমনিরহাট": {
      "আদিতমারী": [
        { name: "আদিতমারী", code: "5510" },
        { name: "মহিষখোচা", code: "5511" },
        { name: "পলাশী", code: "5512" },
        { name: "সারপুকুর", code: "5513" },
        { name: "ভেলাবাড়ী", code: "5514" },
      ],
      "কালীগঞ্জ": [
        { name: "কালীগঞ্জ", code: "5530" },
        { name: "গোড়ল", code: "5531" },
        { name: "তুষভান্ডার", code: "5532" },
        { name: "কাকিনা", code: "5533" },
      ],
      "হাতীবান্ধা": [
        { name: "হাতীবান্ধা", code: "5520" },
        { name: "ডাউয়াবাড়ী", code: "5521" },
        { name: "নওদাবাস", code: "5522" },
      ],
      "লালমনিরহাট সদর": [
        { name: "লালমনিরহাট", code: "5500" },
        { name: "বড়বাড়ী", code: "5501" },
        { name: "মোগলহাট", code: "5502" },
        { name: "গোকুন্ডা", code: "5503" },
        { name: "বড়খাতা", code: "5504" },
      ],
      "পাটগ্রাম": [
        { name: "পাটগ্রাম", code: "5540" },
        { name: "বুড়িমারী", code: "5541" },
        { name: "দহগ্রাম", code: "5542" },
      ],
    },
    "রংপুর সদর": {
      "রংপুর সদর": [
        { name: "রংপুর", code: "5400" },
        { name: "পায়রাবন্দ", code: "5401" },
      ],
      "পীরগাছা": [{ name: "পীরগাছা", code: "5420" }],
      "গঙ্গাচড়া": [{ name: "গঙ্গাচড়া", code: "5410" }],
      "কাউনিয়া": [{ name: "কাউনিয়া", code: "5430" }],
      "মিঠাপুকুর": [{ name: "মিঠাপুকুর", code: "5450" }],
      "বদরগঞ্জ": [{ name: "বদরগঞ্জ", code: "5460" }],
      "তারাগঞ্জ": [{ name: "তারাগঞ্জ", code: "5470" }],
    },
    "কুড়িগ্রাম": {
      "কুড়িগ্রাম সদর": [
        { name: "কুড়িগ্রাম", code: "5600" },
        { name: "পান্ডুল", code: "5601" },
      ],
      "রাজারহাট": [{ name: "রাজারহাট", code: "5610" }],
      "উলিপুর": [{ name: "উলিপুর", code: "5620" }],
      "চিলমারী": [{ name: "চিলমারী", code: "5630" }],
    },
    "নীলফামারী": {
      "নীলফামারী সদর": [
        { name: "নীলফামারী", code: "5300" },
      ],
      "সৈয়দপুর": [{ name: "সৈয়দপুর", code: "5310" }],
      "জলঢাকা": [{ name: "জলঢাকা", code: "5320" }],
      "ডিমলা": [{ name: "ডিমলা", code: "5330" }],
    },
    "গাইবান্ধা": {
      "গাইবান্ধা সদর": [{ name: "গাইবান্ধা", code: "5700" }],
      "সাঘাটা": [{ name: "সাঘাটা", code: "5710" }],
      "সুন্দরগঞ্জ": [{ name: "সুন্দরগঞ্জ", code: "5720" }],
    },
  },
  "ঢাকা": {
    "ঢাকা": {
      "মিরপুর": [
        { name: "মিরপুর-১", code: "1216" },
        { name: "মিরপুর-১০", code: "1216" },
        { name: "মিরপুর-১২", code: "1216" },
      ],
      "উত্তরা": [
        { name: "উত্তরা", code: "1230" },
        { name: "আজমপুর", code: "1230" },
      ],
      "মতিঝিল": [
        { name: "মতিঝিল", code: "1000" },
        { name: "আরামবাগ", code: "1000" },
      ],
      "সাভার": [
        { name: "সাভার বাজার", code: "1340" },
        { name: "ভাকুর্তা", code: "1341" },
      ],
    },
    "গাজীপুর": {
      "গাজীপুর সদর": [
        { name: "গাজীপুর", code: "1700" },
        { name: "জয়দেবপুর", code: "1700" },
      ],
      "টঙ্গী": [{ name: "টঙ্গী", code: "1710" }],
    },
    "নারায়ণগঞ্জ": {
      "নারায়ণগঞ্জ সদর": [
        { name: "নারায়ণগঞ্জ", code: "1400" },
      ],
      "রূপগঞ্জ": [{ name: "রূপগঞ্জ", code: "1460" }],
    },
  },
  "চট্টগ্রাম": {
    "চট্টগ্রাম": {
      "কোতোয়ালী": [
        { name: "চট্টগ্রাম GPO", code: "4000" },
        { name: "আন্দরকিল্লা", code: "4000" },
      ],
      "হাটহাজারী": [{ name: "হাটহাজারী", code: "4330" }],
      "রাউজান": [{ name: "রাউজান", code: "4340" }],
      "সীতাকুণ্ড": [{ name: "সীতাকুণ্ড", code: "4310" }],
    },
    "কক্সবাজার": {
      "কক্সবাজার সদর": [
        { name: "কক্সবাজার", code: "4700" },
      ],
    },
  },
  "সিলেট": {
    "সিলেট": {
      "সিলেট সদর": [
        { name: "সিলেট", code: "3100" },
      ],
      "বিয়ানীবাজার": [{ name: "বিয়ানীবাজার", code: "3150" }],
    },
  },
  "রাজশাহী": {
    "রাজশাহী": {
      "বোয়ালিয়া": [
        { name: "রাজশাহী", code: "6000" },
      ],
      "পবা": [{ name: "কাশিয়াডাঙ্গা", code: "6200" }],
    },
  },
  "খুলনা": {
    "খুলনা": {
      "সদর": [{ name: "খুলনা GPO", code: "9000" }],
    },
  },
  "বরিশাল": {
    "বরিশাল": {
      "কোতোয়ালী": [{ name: "বরিশাল GPO", code: "8200" }],
    },
  },
  "ময়মনসিংহ": {
    "ময়মনসিংহ": {
      "ময়মনসিংহ সদর": [{ name: "ময়মনসিংহ", code: "2200" }],
    },
  },
};

// ─── TRANSLATION STRINGS ───
const TRANSLATIONS = {
  bn: {
    hdrTitle: "বারাকাহ ফাইন্যান্স",
    hdrSlogan: "সুদমুক্ত লেনদেনে সমৃদ্ধি সবার",
    hdrAddress: "📍 আদিতমারী, লালমনিরহাট | 📞 +8801581093611",
    formTitle: "সদস্য পদের জন্য আবেদন ফরম",
    formSubtitle: "সকল তারকা (*) চিহ্নিত তথ্য পূরণ করা আবশ্যক",
    sec1Title: "আবেদনকারীর ব্যক্তিগত তথ্য",
    sec2Title: "নমিনির তথ্য",
    sec3Title: "আর্থিক অঙ্গীকার ও শর্তাবলী",
    sec4Title: "স্বাক্ষর ও তারিখ",
    lblSubmit: "✅ আবেদন জমা দিন",
    successTitle: "আবেদন সফলভাবে জমা হয়েছে!",
    successMsg: "আপনার আবেদনটি পেন্ডিং অবস্থায় রয়েছে। কমিটি যাচাই-বাছাই শেষে আপনাকে জানানো হবে।",
    adminLink: "অ্যাডমিন প্যানেল",
  },
  en: {
    hdrTitle: "Barakah Finance",
    hdrSlogan: "Prosperity for all through interest-free transactions",
    hdrAddress: "📍 Aditamari, Lalmonirhat | 📞 +8801581093611",
    formTitle: "Membership Application Form",
    formSubtitle: "All fields marked with (*) are required",
    sec1Title: "Applicant's Personal Information",
    sec2Title: "Nominee Information",
    sec3Title: "Financial Commitments & Terms",
    sec4Title: "Signature & Date",
    lblSubmit: "✅ Submit Application",
    successTitle: "Application Submitted Successfully!",
    successMsg: "Your application is pending review. You will be notified after the committee verifies your details.",
    adminLink: "Admin Panel",
  },
  ar: {
    hdrTitle: "تمويل بركة",
    hdrSlogan: "الرخاء للجميع من خلال المعاملات الخالية من الربا",
    hdrAddress: "📍 أديتاماري، لالمونيرهات | 📞 +8801581093611",
    formTitle: "استمارة طلب العضوية",
    formSubtitle: "جميع الحقول المميزة (*) إلزامية",
    sec1Title: "المعلومات الشخصية للمتقدم",
    sec2Title: "معلومات المرشح",
    sec3Title: "الالتزامات المالية والشروط",
    sec4Title: "التوقيع والتاريخ",
    lblSubmit: "✅ تقديم الطلب",
    successTitle: "تم تقديم الطلب بنجاح!",
    successMsg: "طلبك قيد المراجعة. ستتم إخطارك بعد التحقق من تفاصيلك.",
    adminLink: "لوحة الإدارة",
  },
};

// ─── COUNTRY PHONE CODES ───
const COUNTRY_CODES = [
  { code: "+880", flag: "🇧🇩", name: "BD", digits: 11 },
  { code: "+91", flag: "🇮🇳", name: "IN", digits: 10 },
  { code: "+1", flag: "🇺🇸", name: "US", digits: 10 },
  { code: "+44", flag: "🇬🇧", name: "GB", digits: 10 },
  { code: "+61", flag: "🇦🇺", name: "AU", digits: 9 },
  { code: "+966", flag: "🇸🇦", name: "SA", digits: 9 },
  { code: "+971", flag: "🇦🇪", name: "AE", digits: 9 },
  { code: "+974", flag: "🇶🇦", name: "QA", digits: 8 },
  { code: "+60", flag: "🇲🇾", name: "MY", digits: 9 },
  { code: "+65", flag: "🇸🇬", name: "SG", digits: 8 },
  { code: "+20", flag: "🇪🇬", name: "EG", digits: 10 },
  { code: "+49", flag: "🇩🇪", name: "DE", digits: 10 },
  { code: "+33", flag: "🇫🇷", name: "FR", digits: 9 },
  { code: "+7", flag: "🇷🇺", name: "RU", digits: 10 },
];
