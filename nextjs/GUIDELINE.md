# বারাকাহ ফাইন্যান্স — সম্পূর্ণ প্রযুক্তিগত গাইডলাইন
# Barakah Finance — Complete Technical Guideline & Deployment Manual

> **Build ID:** `-EOmWrtVdzgiZY9VK9oNC`  
> **Framework:** Next.js 14.2.5 · TypeScript · PostgreSQL · Prisma ORM  
> **Status:** ✅ Production build: 0 errors · 22 pages · 41 API routes · 63 DB models · 25 enums

---

## অধ্যায় ১ — ভাষা ও আর্কিটেকচার / Language & Architecture

### ১.১ কোডবেসের ভাষা

| স্তর | ভাষা | কারণ |
|------|------|------|
| সোর্স কোড | **ইংরেজি** | TypeScript/React standard; international developer readability |
| ডাটাবেস স্কিমা | **ইংরেজি** | Prisma ORM convention; SQL compatibility |
| API response keys | **ইংরেজি** | JSON standard; frontend mapping |
| UI লেবেল (ডিফল্ট) | **বাংলা** | Website.txt spec: "ওয়েবসাইটের মূল ল্যাঙ্গুয়েজ হবে ইংরেজি" — public UI বাংলায় |
| i18n support | **bn / en / ar** | `lib/i18n/translations.ts` — RTL সহ আরবি সাপোর্ট |

### ১.২ মনোলিথিক আর্কিটেকচার (একক ব্যবস্থা)

```
barakahfinancebd.com
├── / (Public Website)         → app/(public)/
├── /shop                      → E-Commerce Catalog
├── /apply                     → Membership Form (5-step)
├── /login, /verify            → Auth Flow
├── /dashboard                 → Member Portal
└── /admin/*                   → Management Panel (Admin/Super Admin)
```

একই Next.js অ্যাপ্লিকেশন সব তিনটি পোর্টাল পরিচালনা করে — একটি central database।

---

## অধ্যায় ২ — ডাটাবেস আর্কিটেকচার / Database Architecture

### ২.১ কোন তথ্য কোথায় সংরক্ষিত হয়

```
PostgreSQL Database: barakah_finance
│
├── MASTER 1: পরিচয় ও অ্যাক্সেস
│   ├── User              → সব ব্যবহারকারীর একমাত্র পরিচয় (single source of truth)
│   ├── UserProfile       → ব্যক্তিগত তথ্য (নাম, ঠিকানা, পেশা, ছবি)
│   ├── UserPhone         → একাধিক মোবাইল নম্বর
│   ├── SocialLink        → Facebook/WhatsApp/LinkedIn লিংক
│   ├── UserKYC           → NID, ছবি, স্বাক্ষর (restricted access)
│   ├── UserRole          → একজন ব্যক্তি একাধিক role-এ থাকতে পারেন
│   ├── UserSession       → সক্রিয় session tracking (IP, device)
│   ├── OTPRecord         → SMS OTP (bcrypt hashed, TTL, attempt limit)
│   └── UsernameHistory   → ইউজারনেম পরিবর্তনের ইতিহাস
│
├── MASTER 2: সদস্যপদ ও সঞ্চয়
│   ├── Member            → সদস্যের আর্থিক অংশগ্রহণ, ইউনিট, status
│   ├── MemberApplication → আবেদন workflow (PENDING → APPROVED → COMPLETED)
│   ├── SavingsRecord     → প্রতি মাসের সঞ্চয় এন্ট্রি (immutable on PAID)
│   └── CapitalMovement   → মূলধনের প্রতিটি পরিবর্তন (day-weighted profit calculation)
│
├── MASTER 3: পণ্য ও কিস্তি
│   ├── Customer          → পণ্য ক্রেতার প্রোফাইল (User-এর সাথে linked)
│   ├── Product           → পণ্য ক্যাটালগ, স্টক, profit method
│   ├── ProductImage      → পণ্যের একাধিক ছবি
│   ├── Order             → কিস্তি অর্ডার (price snapshot সহ permanently stored)
│   ├── Installment       → কিস্তি schedule (auto-generated, rounding-adjusted)
│   ├── OrderGuarantor    → জামিনদার লিংক
│   └── OrderWitness      → সাক্ষী তথ্য
│
├── MASTER 4: পেমেন্ট ও রসিদ
│   ├── Payment           → প্রতিটি পেমেন্ট (IMMUTABLE — no hard delete)
│   └── Receipt           → রসিদ রেজিস্ট্রি (M-XXXX/C-XXXX, never reused)
│
├── MASTER 5: হিসাব
│   ├── FinancialAccount  → Cash/Bank/bKash/Nagad/Rocket আলাদা আলাদা
│   ├── IncomeCategory    → আয়ের ক্যাটাগরি
│   ├── IncomeEntry       → আয়ের রেকর্ড (soft-delete only)
│   ├── ExpenseCategory   → ব্যয়ের ক্যাটাগরি (hierarchical)
│   ├── ExpenseEntry      → ব্যয়ের রেকর্ড (soft-delete only)
│   ├── LedgerEntry       → সাধারণ খাতা (auto-populated, double-entry)
│   ├── FundTransfer      → ফান্ড-টু-ফান্ড (Income/Expense নয়, Transfer)
│   ├── PayOrderRule      → পে-অর্ডার template
│   └── PayOrder          → assigned পে-অর্ডার per member/customer
│
├── MASTER 6: প্রজেক্ট ও মুনাফা
│   ├── Project           → বিনিয়োগ প্রজেক্ট
│   ├── ProjectMember     → বিনিয়োগকারীদের শেয়ার
│   ├── FixedAsset        → স্থায়ী সম্পত্তি
│   ├── ProfitDistribution       → মুনাফা বণ্টন cycle
│   ├── ProfitDistributionMember → প্রতিটি সদস্যের অংশ
│   └── WithdrawalRequest → টাকা তোলার আবেদন
│
├── MASTER 7: করজে হাসানা
│   ├── QardApplication   → আবেদন + approval + disbursement workflow
│   ├── QardInstallment   → পরিশোধের কিস্তি schedule
│   └── QardFundMovement  → Qard fund এর inflow/outflow
│
├── MASTER 8: চ্যারিটি
│   ├── CharityCategory   → চ্যারিটির ক্যাটাগরি
│   ├── CharityFundraising → অনুদান সংগ্রহ (late fee → এখানেই যায়)
│   ├── CharityExpenditure → ব্যয়
│   └── CharityApplication → সহযোগিতার আবেদন
│
├── MASTER 9: কমিটি
│   ├── CommitteeSession  → কমিটির মেয়াদ
│   ├── CommitteeMember   → কমিটি সদস্যবৃন্দ
│   └── CommitteeRule     → অনুমোদনের কর্তৃত্ব বিধি
│
├── MASTER 10: যোগাযোগ
│   ├── SMSTemplate       → Dynamic token টেমপ্লেট ({name}, {amount}, {due_date})
│   ├── SMSRecord         → পাঠানো সব SMS এর ইতিহাস
│   └── SMSRecharge       → SMS ব্যালেন্স রিচার্জ ইতিহাস
│
├── MASTER 11: ওয়েবসাইট কন্টেন্ট
│   ├── Notice            → স্ক্রলিং নোটিশ বার
│   ├── Badge             → Hero section badge cards
│   ├── Review            → পাবলিক রিভিউ (moderation)
│   ├── Post              → Timeline posts
│   ├── PostReaction      → রিয়েক্ট (logged-in + anonymous)
│   ├── PostComment       → মন্তব্য
│   └── GalleryItem       → ছবি/ভিডিও/ইভেন্ট
│
└── MASTER 12: সিস্টেম
    ├── SystemSettings    → সকল configurable settings (একটি row: id="global")
    ├── SettingsHistory   → settings পরিবর্তনের ইতিহাস
    ├── UserPermission    → granular module:action permission override
    ├── AuditLog          → IMMUTABLE global audit trail
    ├── ActivityFeed      → Live activity monitor (short retention, 500 max)
    └── Notification      → Push/in-app notifications
```

### ২.২ ডাটা স্থায়িত্বের নিয়ম (Financial Immutability)

```
Rule 1: Payment, Receipt, Installment, SavingsRecord, QardApplication
        → Hard delete FORBIDDEN → Cancel/Void/Reversal entry ব্যবহার করতে হবে

Rule 2: ReceiptNumber (M-0001, C-0001) → একবার issued হলে কখনো reuse হবে না
        Cancelled receipts stay permanently in registry

Rule 3: AuditLog → কেউ সম্পাদনা বা মুছতে পারবে না (Super Admin শুধু পড়তে পারবেন)

Rule 4: IncomeEntry/ExpenseEntry → soft-delete (isDeleted=true + reason + deletedBy)
        Reversal ledger entry automatically created

Rule 5: All financial calculations → Decimal.js (precision=28, ROUND_HALF_EVEN)
        কোনো JavaScript floating-point math ব্যবহার নেই
```

### ২.৩ ব্যাকআপ সিস্টেম

```
স্থানীয় ব্যাকআপ (Cron Job):
  প্রতি ঘণ্টায়: pg_dump → backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz
  রিটেনশন: ৬০ দিন (পুরনো ফাইল auto-delete)

env variables:
  BACKUP_DIR=./backups
  BACKUP_INTERVAL_HOURS=1
  BACKUP_RETENTION_DAYS=60

Cron script: scripts/backup.js (production-এ setup করতে হবে)
```

---

## অধ্যায় ৩ — লগইন ও অ্যাক্সেস সিস্টেম / Authentication

### ৩.১ একটিমাত্র লগইন পেজ সবার জন্য

**URL:** `https://barakahfinancebd.com/login`

সব ধরনের ব্যবহারকারী — Super Admin, Admin, Member, Customer, সাধারণ User — একই লগইন পেজ থেকে প্রবেশ করবেন। লগইনের পর role অনুযায়ী পুনর্নির্দেশ হবে:

| Role | লগইনের পর যাবে |
|------|----------------|
| `SUPER_ADMIN` | `/admin` → 2FA confirm → `/admin` |
| `ADMIN` | `/admin` (2FA optional, configurable) |
| `MEMBER` | `/dashboard` |
| `CUSTOMER` | `/dashboard` |
| `USER` | `/dashboard` |

### ৩.২ ডিফল্ট সিডেড ক্রেডেনশিয়াল

> ⚠️ **প্রথম লগইনের পরই পাসওয়ার্ড পরিবর্তন করুন!**

| ভূমিকা | ইউজারনেম | পাসওয়ার্ড | মন্তব্য |
|--------|----------|-----------|---------|
| **Super Admin** | `admin` | `admin1234` | সম্পূর্ণ সিস্টেম নিয়ন্ত্রণ |

নতুন Admin তৈরি করতে: লগইন → `/admin` → সদস্য তালিকায় যান → User-এর role পরিবর্তন করুন `ADMIN`-এ।

নতুন Member তৈরির দুটো পথ:
1. Public signup → `/login?tab=signup` → OTP verify → Member Application Form → Admin approval
2. Admin manually: `/admin/members` → Add Member

### ৩.৩ লগইন প্রক্রিয়া (বিস্তারিত)

```
ব্যবহারকারী: Mobile / Email / Username + Password লিখুন

Step 1: NextAuth CredentialsProvider
  → User.phone বা User.email বা User.username দিয়ে DB খোঁজা
  → bcrypt.compare(password, user.passwordHash) — 12 salt rounds
  → isActive + isLocked চেক

Step 2: 2FA প্রয়োজন?
  → Super Admin: হ্যাঁ (mandatory by default)
  → Admin: settings অনুযায়ী
  → অন্যরা: না

Step 3: JWT token তৈরি
  → { id, username, firstName, systemRole, isVerified, ... }
  → 7 দিনের মেয়াদ
  → cookie-based HttpOnly storage (NextAuth)

Step 4: Middleware protection
  → প্রতিটি request-এ JWT verify
  → Role hierarchy চেক
  → 2FA flag চেক (twoFARequired + twoFAVerified)

Step 5: Redirect by role
```

### ৩.৪ OTP সিস্টেম (SMS — BulkSMSBD)

```
Gateway: http://bulksmsbd.net/api/smsapi
API Key: PEORenxMbnajRYOPGnsD (configure in .env.local)
Sender:  8809617611021

OTP নিরাপত্তা:
  - 6-digit cryptographically random (crypto.randomBytes)
  - bcrypt hashed (8 rounds) before DB storage
  - TTL: 10 minutes (configurable via OTP_TTL_SECONDS)
  - Max 5 attempts before invalidation
  - Development mode: OTP shown in server console (never in production)
```

---

## অধ্যায় ৪ — ব্যবহারকারী রোডম্যাপ / User Manual

### ৪.১ পাবলিক ভিজিটর যাত্রা

```
barakahfinancebd.com/
  ├─ নোটিশ বার → admin থেকে পরিচালিত
  ├─ হিরো সেকশন → CTA buttons:
  │   ├─ "সদস্য হতে আবেদন করুন" → /login (login gate) → /apply
  │   ├─ "কেনাকাটা করুন"         → /login (login gate) → /shop
  │   └─ "আরও জানুন"             → /learn-more (no login needed)
  ├─ ব্যাজ গ্রিড → live stats from API
  ├─ কেন বারাকাহ? → 6 feature cards
  ├─ কিস্তি ক্যালকুলেটর → Method A + B (no login needed)
  ├─ রিভিউ carousel → auto-scroll, submit without login
  ├─ কীভাবে কাজ করে? → 5-step visual
  └─ Footer → emergency contacts
```

### ৪.২ নতুন সদস্য আবেদন (/apply)

```
ধাপ ১ — ব্যক্তিগত তথ্য:
  নাম (বাংলা + ইংরেজি), পিতার নাম, মাতার নাম, জন্ম তারিখ,
  লিঙ্গ, মোবাইল, ইমেইল, NID, পেশা, বিভাগ→জেলা (cascade)

ধাপ ২ — নমিনির তথ্য:
  নাম, সম্পর্ক, মোবাইল, লিঙ্গ, ঠিকানা

ধাপ ৩ — বিনিয়োগের ধরন:
  ○ মাসিক সঞ্চয় (৳২,০০০/মাস = ১ ইউনিট)
  ○ এককালীন বিনিয়োগ (যেকোনো পরিমাণ)
  ○ প্রজেক্ট বিনিয়োগ (নির্দিষ্ট প্রজেক্টে)

ধাপ ৪ — ছবি ও স্বাক্ষর:
  ছবি: ৫৭০×৪৫০ px, Max 2MB (canvas auto-resize)
  স্বাক্ষর: ৩০০×৮০ px, Max 100KB (fixed ratio crop)
  NID সামনে + পেছনে: upload

ধাপ ৫ — পর্যালোচনা ও জমা:
  সব তথ্য দেখুন → "আবেদন জমা দিন" → PENDING status

Admin Approval Flow:
  Admin review → Approve → Payment request SMS
  Member pays → Member ID activated → SMS confirmation
```

### ৪.৩ পাবলিক শপ (/shop)

```
/shop
  → Category sidebar (বাম)
  → Search bar (Bengali/English)
  → Product grid (stock badge, installment preview)
  → Sort: নাম/মূল্য ascending/descending

/shop/[slug] → category OR product detail
  যদি slug = Bengali category name → ওই ক্যাটাগরির পণ্য filter
  যদি slug = product cuid (>20 alphanumeric) → product detail

Product Detail:
  → Image gallery (multiple images)
  → Installment Calculator Modal:
      Method A: সম্পূর্ণ মূল্যে লাভ
      Method B: অর্থায়িত অংশে লাভ (শরিয়াহ - default)
  → "কিস্তিতে আবেদন করুন" → login gate → Order submission
```

### ৪.৪ সদস্য ড্যাশবোর্ড (/dashboard)

```
সদস্য লগইনের পর:
  → মুনাফার উদ্ধৃতি (Quran/Hadith - random)
  → Summary cards: সঞ্চয়, ইউনিট, পরবর্তী কিস্তি, বকেয়া

মূল প্যানেল:
  ├─ সঞ্চয় → মাসিক জমার ইতিহাস, unit value, লাভ
  ├─ কিস্তি → order list, schedule, পরিশোধ status
  ├─ করজ → আবেদন করুন, চলমান করজ, পরিশোধ schedule
  ├─ প্রফাইল → সম্পাদনা (ছবি, ঠিকানা, সোশ্যাল লিংক)
  ├─ KYC → NID upload, status tracking
  └─ টাকা উইড্র → request form (30-day notice)

ইউনিট পোর্টফোলিও:
  মোট ডিপোজিট ÷ ইউনিট মূল্য (৳২,০০০) = ইউনিট সংখ্যা
  Day-weighted profit calculation API: /api/units/portfolio
```

### ৪.৫ অ্যাডমিন প্যানেল (/admin/*)

```
/admin                → Master Dashboard (Action Center + Live Activity)
/admin/members        → সদস্য তালিকা, আবেদন অনুমোদন
/admin/orders         → কিস্তি অর্ডার, payment collection
/admin/qard           → করজ 3-step pipeline (Review→Approve→Disburse)
/admin/accounts       → আয়/ব্যয়, fund transfer, reconciliation
/admin/products       → পণ্য ক্যাটালগ, স্টক management
/admin/sms            → BulkSMSBD panel, template, broadcast
/admin/committee      → কমিটি registry, past sessions, approval rules
/admin/audit-logs     → Immutable audit trail (Super Admin only)
/admin/reviews        → রিভিউ moderation
```

### ৪.৬ Admin — পেমেন্ট সংগ্রহ প্রক্রিয়া

```
১. /admin/orders → অর্ডার select করুন
২. "কিস্তি সংগ্রহ" section → কিস্তি dropdown থেকে select
৩. পরিমাণ লিখুন (কম/বেশি/সমান — সব supported)
৪. Payment method: Cash/bKash/Nagad/Rocket/Bank
৫. "পেমেন্ট নিন" → Receipt number generated (C-XXXX)
৬. SMS auto-send (checkbox control করুন)

Partial payment: remaining balance outstanding-এ থাকে
Overpayment: পরবর্তী installment-এ advance হিসেবে যায়
```

### ৪.৭ SMS ব্রডকাস্ট প্রক্রিয়া

```
/admin/sms → "বার্তা পাঠান" tab
  ├─ Group: সকল সদস্য / ক্লাইন্ট / করজ গ্রহীতা / কমিটি / সবাই
  └─ Custom: নম্বর paste করুন (comma/newline separated)

Dynamic tokens:
  {name}      → প্রাপকের নাম
  {amount}    → টাকার পরিমাণ
  {due_date}  → শেষ তারিখ
  {member_id} → সদস্য আইডি
  {receipt_id}→ রসিদ নম্বর

Preview: real-time SMS preview in mobile mockup
Balance: BulkSMSBD live balance widget
```

---

## অধ্যায় ৫ — নিরাপত্তা আর্কিটেকচার / Security

### ৫.১ প্রযুক্তিগত নিরাপত্তা স্তরসমূহ

```
Layer 1: HTTPS/TLS (Namecheap SSL + cPanel Let's Encrypt)
  HSTS header: max-age=63072000; includeSubDomains; preload
  CSP: Content-Security-Policy (script/style/img sources restricted)
  X-Frame-Options: SAMEORIGIN (clickjacking prevention)
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

Layer 2: Authentication
  JWT: HS256, 7-day expiry, HttpOnly cookie
  Password: bcrypt 12 rounds
  OTP: crypto.randomBytes → 6-digit → bcrypt 8 rounds
  2FA: TOTP (RFC 6238) via otplib — Super Admin mandatory
  Rate limiting: Edge middleware (10 auth requests/min/IP)

Layer 3: Authorization (RBAC)
  9-level role hierarchy: USER → WITNESS → GUARANTOR → CUSTOMER
                          → INVESTOR → MEMBER → STAFF → ADMIN → SUPER_ADMIN
  Module:Action permissions (view/create/edit/approve/etc.)
  Individual UserPermission overrides (DB-stored)
  All admin routes: role-checked at Edge middleware level

Layer 4: Database Safety
  ACID transactions: prisma.$transaction() for all financial ops
  No hard deletes on financial records
  Soft-delete with reason, actor, timestamp
  Decimal.js: precision=28, ROUND_HALF_EVEN (no float drift)

Layer 5: Input Validation
  Zod schemas on all API route handlers
  Parameterized queries (Prisma prevents SQL injection)
  File upload: type/size validation + sharp resize

Layer 6: Clean URLs
  No .html/.php/.js extensions exposed
  Dynamic routes hidden: /shop/[slug] shows as /shop/product-name
  File paths not leaked in error responses
```

### ৫.২ অডিট ট্রেইল

প্রতিটি গুরুত্বপূর্ণ কাজের জন্য `AuditLog` table-এ লেখা হয়:

```
AuditLog {
  userId    → কে করেছেন
  action    → CREATE/UPDATE/DELETE/APPROVE/REJECT/LOGIN/...
  module    → members/orders/qard/accounts/settings/...
  recordId  → কোন রেকর্ড
  oldValue  → আগের মান (JSON)
  newValue  → নতুন মান (JSON)
  reason    → কারণ (delete/cancel-এর জন্য mandatory)
  ipAddress → request IP
  userAgent → browser/device
  createdAt → timestamp
}
```

> **এই log কেউ মুছতে পারবেন না।** Super Admin শুধু `/admin/audit-logs` থেকে পড়তে পারবেন।

---

## অধ্যায় ৬ — লোকাল সেটআপ / Local Development Setup

### ৬.১ প্রয়োজনীয় সফটওয়্যার

```
Node.js ≥ 18.17.0    → https://nodejs.org/
PostgreSQL ≥ 14       → https://www.postgresql.org/
```

### ৬.২ ধাপে ধাপে লোকাল সেটআপ

```powershell
# ── ধাপ ১: প্রজেক্ট ফোল্ডারে যান ──────────────────────────
cd C:\Project\barakah_finance\nextjs

# ── ধাপ ২: Dependencies install করুন ───────────────────────
npm install

# ── ধাপ ৩: Environment file তৈরি করুন ──────────────────────
Copy-Item .env.example .env.local

# ── ধাপ ৪: .env.local ফাইল সম্পাদনা করুন ───────────────────
# নিচের মানগুলো দিয়ে পূরণ করুন:

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_min_32_chars_change_this_now

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/barakah_finance?schema=public"

JWT_SECRET=another_secret_min_64_chars_for_jwt_tokens
JWT_EXPIRES_IN=7d

OTP_TTL_SECONDS=600
TOTP_ISSUER=BarakahFinance

SMS_API_KEY=PEORenxMbnajRYOPGnsD
SMS_API_URL=http://bulksmsbd.net/api/smsapi
SMS_BALANCE_URL=http://bulksmsbd.net/api/getBalanceApi
SMS_SENDER_ID=8809617611021

# ── ধাপ ৫: PostgreSQL এ database তৈরি করুন ─────────────────
# PostgreSQL command line (psql):
# psql -U postgres
# CREATE DATABASE barakah_finance;
# \q

# ── ধাপ ৬: Prisma client generate করুন ─────────────────────
npx prisma generate

# ── ধাপ ৭: Schema push করুন (tables তৈরি হবে) ──────────────
npx prisma db push

# ── ধাপ ৮: Default data seed করুন ──────────────────────────
npx prisma db seed
# এটি তৈরি করবে:
#   ✅ Super Admin (username: admin, password: admin1234)
#   ✅ System settings
#   ✅ Default notices (3টি)
#   ✅ Default badges (6টি)
#   ✅ SMS templates (7টি)
#   ✅ Committee session + 7 members
#   ✅ Income/Expense categories
#   ✅ Pay order rules
#   ✅ Financial accounts (Cash, bKash, Nagad, Rocket, Bank)

# ── ধাপ ৯: Development server চালু করুন ─────────────────────
npm run dev
# → http://localhost:3000 খুলবে

# ── ধাপ ১০ (ঐচ্ছিক): Prisma Studio — DB GUI ─────────────────
npx prisma studio
# → http://localhost:5555
```

### ৬.৩ প্রথমবার লগইন (লোকাল)

```
URL: http://localhost:3000/login
Username: admin
Password: admin1234

⚠️ প্রথম লগইনের পরই:
   /admin → Settings → পাসওয়ার্ড পরিবর্তন করুন
   Super Admin 2FA Setup করুন (Google Authenticator)
```

---

## অধ্যায় ৭ — Namecheap cPanel Deployment Guide

### ৭.১ পূর্বশর্ত

- Namecheap hosting account with Node.js support (VPS বা Business Hosting)
- cPanel access
- Domain: `barakahfinancebd.com`
- PostgreSQL database (cPanel Remote MySQL নয় — PostgreSQL লাগবে)

> **Note:** Namecheap shared hosting-এ PostgreSQL নাও থাকতে পারে। সেক্ষেত্রে Railway.app বা Supabase.com থেকে free PostgreSQL নিন।

### ৭.২ PostgreSQL Database সেটআপ

**Option A — Railway.app (প্রস্তাবিত)**

```
১. https://railway.app → Sign Up (GitHub দিয়ে)
২. New Project → Database → Add PostgreSQL
৩. PostgreSQL service-এ click → Variables tab
৪. DATABASE_URL কপি করুন:
   postgresql://postgres:PASSWORD@HOST:PORT/railway
```

**Option B — Supabase.com (বিকল্প)**

```
১. https://supabase.com → New Project
২. Database → Connection string → URI কপি করুন
```

**Option C — cPanel-এ PostgreSQL (যদি থাকে)**

```
cPanel → PostgreSQL Databases
  ১. Create Database: barakah_finance
  ২. Create User: barakah_user (strong password)
  ৩. Add User to Database (All Privileges)
  
Connection string:
postgresql://barakah_user:PASSWORD@localhost:5432/barakah_finance
```

### ৭.৩ Production Build প্রস্তুতি (লোকাল মেশিনে)

```powershell
cd C:\Project\barakah_finance\nextjs

# ১. Production .env.local তৈরি করুন:
NEXTAUTH_URL=https://barakahfinancebd.com
NEXTAUTH_SECRET=use_openssl_rand_base64_32_output_here
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?schema=public"
JWT_SECRET=use_openssl_rand_base64_64_output_here
NODE_ENV=production
SMS_API_KEY=PEORenxMbnajRYOPGnsD
SMS_API_URL=http://bulksmsbd.net/api/smsapi
SMS_SENDER_ID=8809617611021

# ২. Production build তৈরি করুন
npm run build

# ৩. Upload-এর জন্য ZIP তৈরি করুন
# Include: .next/, public/, prisma/, lib/, app/, components/, types/,
#           package.json, package-lock.json, next.config.mjs,
#           postcss.config.js, tailwind.config.ts, tsconfig.json,
#           middleware.ts, .env.local (renamed to .env on server)
# Exclude: node_modules/, .git/, backups/, .env.example
```

### ৭.৪ cPanel File Upload

```
Method 1: File Manager (ছোট প্রজেক্টের জন্য)
  cPanel → File Manager → public_html বা subdirectory
  Upload ZIP → Extract

Method 2: FTP/SFTP (প্রস্তাবিত)
  FileZilla দিয়ে:
  Host: barakahfinancebd.com
  Port: 21 (FTP) or 22 (SFTP)
  Upload all files to: /home/username/barakah-nextjs/

Directory structure on server:
  /home/username/barakah-nextjs/
    ├── .next/
    ├── public/
    ├── prisma/
    ├── node_modules/       ← npm install --production চালানোর পরে
    ├── package.json
    ├── next.config.mjs
    ├── middleware.ts
    └── .env                ← .env.local rename করুন
```

### ৭.৫ cPanel Node.js App Setup

```
cPanel → "Setup Node.js App"

১. Create Application:
   ┌─────────────────────────────────────────────────────┐
   │ Node.js version:     18.x (বা সর্বোচ্চ available)  │
   │ Application mode:    Production                      │
   │ Application root:    /home/username/barakah-nextjs   │
   │ Application URL:     barakahfinancebd.com            │
   │ Application startup: server.js                       │
   └─────────────────────────────────────────────────────┘

২. Environment variables যোগ করুন:
   NODE_ENV           = production
   NEXTAUTH_URL       = https://barakahfinancebd.com
   NEXTAUTH_SECRET    = [generate করুন]
   DATABASE_URL       = postgresql://...
   JWT_SECRET         = [generate করুন]
   SMS_API_KEY        = PEORenxMbnajRYOPGnsD
   SMS_API_URL        = http://bulksmsbd.net/api/smsapi
   SMS_SENDER_ID      = 8809617611021
   OTP_TTL_SECONDS    = 600
   TOTP_ISSUER        = BarakahFinance

৩. Save → Application তৈরি হবে
```

### ৭.৬ server.js তৈরি করুন (Next.js custom server)

`barakah-nextjs/server.js` ফাইল:

```javascript
const { createServer } = require("http");
const { parse }        = require("url");
const next             = require("next");

const dev  = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app  = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Barakah Finance ready on http://localhost:${port}`);
  });
});
```

### ৭.৭ Production এ প্রথমবার চালু করা

cPanel Terminal বা SSH-এ:

```bash
cd /home/username/barakah-nextjs

# ১. Dependencies install (production only)
npm install --production

# ২. Prisma client generate
npx prisma generate

# ৩. Database tables তৈরি করুন
npx prisma db push

# ৪. Default data seed করুন
npx prisma db seed

# ৫. Build verify (already done locally, but run again to be safe)
npm run build

# ৬. Application start (cPanel Node.js App panel থেকে "Start" করুন)
```

### ৭.৮ Cron Job — Hourly Backup Setup

cPanel → Cron Jobs → Add New Cron Job:

```
Timing: Every hour (Select "Every Hour" preset)
Command:
cd /home/username/barakah-nextjs && node scripts/backup.js >> /home/username/logs/backup.log 2>&1
```

**`scripts/backup.js`** ফাইল তৈরি করুন:

```javascript
const { execSync } = require("child_process");
const path         = require("path");
const fs           = require("fs");

const dbUrl  = process.env.DATABASE_URL || "";
const match  = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!match) { console.error("Invalid DATABASE_URL"); process.exit(1); }

const [, user, pass, host, port, dbName] = match;
const date     = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const backupDir = process.env.BACKUP_DIR || "./backups";
const filePath  = path.join(backupDir, `backup_${date}.sql`);

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

process.env.PGPASSWORD = pass;
execSync(`pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -f "${filePath}"`);
execSync(`gzip "${filePath}"`);

// Delete backups older than 60 days
const retention = parseInt(process.env.BACKUP_RETENTION_DAYS || "60");
const cutoff    = Date.now() - retention * 86_400_000;
fs.readdirSync(backupDir).forEach((f) => {
  const fp = path.join(backupDir, f);
  if (fs.statSync(fp).mtimeMs < cutoff) fs.unlinkSync(fp);
});

console.log(`[${new Date().toISOString()}] Backup saved: ${filePath}.gz`);
```

### ৭.৯ SSL সার্টিফিকেট

```
cPanel → SSL/TLS → Let's Encrypt SSL
  → Domain: barakahfinancebd.com
  → Force HTTPS: ON

অথবা Cloudflare (বিনামূল্যে):
  → DNS: A record → server IP
  → SSL/TLS mode: Full (strict)
  → Automatic HTTPS Rewrites: ON
```

---

## অধ্যায় ৮ — সম্পূর্ণ URL ম্যাপ / Complete Route Manifest

### ৮.১ পাবলিক রুট (লগইন ছাড়া)

| URL | বিবরণ |
|-----|-------|
| `/` | Landing page (hero, calculator, reviews, apply section) |
| `/gallery` | ছবি/ভিডিও/ইভেন্ট গ্যালারি |
| `/timeline` | সংগঠনের news ও posts |
| `/learn-more` | বিস্তারিত তথ্য (উদ্দেশ্য, নিয়ম, কমিটি) |
| `/shop` | পণ্য ক্যাটালগ (সার্চ, ফিল্টার, স্টক badge) |
| `/shop/[slug]` | Category view অথবা Product detail (slug format দ্বারা discriminated) |
| `/login` | Unified login/signup page (সব role একই) |
| `/login?tab=signup` | Direct signup tab |
| `/verify` | OTP verification |
| `/unauthorized` | Access denied page |

### ৮.২ Authenticated রুট (লগইন প্রয়োজন)

| URL | Role | বিবরণ |
|-----|------|-------|
| `/dashboard` | USER+ | Member portal |
| `/profile` | USER+ | Profile editor |
| `/apply` | USER (verified) | 5-step membership form |

### ৮.৩ Admin রুট (ADMIN / SUPER_ADMIN)

| URL | বিবরণ |
|-----|-------|
| `/admin` | Master dashboard + action center + live activity |
| `/admin/members` | সদস্য তালিকা, আবেদন অনুমোদন, KYC |
| `/admin/orders` | কিস্তি অর্ডার, schedule, payment collection |
| `/admin/qard` | করজ pipeline (3-step: Review → Approve → Disburse) |
| `/admin/accounts` | আয়/ব্যয়, fund transfer, reconciliation |
| `/admin/products` | পণ্য catalog, stock management |
| `/admin/sms` | BulkSMSBD panel, templates, broadcast |
| `/admin/committee` | কমিটি registry, past sessions, rules |
| `/admin/reviews` | রিভিউ moderation |
| `/admin/audit-logs` | **Super Admin only** — immutable audit trail |

### ৮.৪ API রুট (Backend)

**Auth:**
```
POST /api/auth/signup          → OTP পাঠান
POST /api/auth/verify-otp      → OTP যাচাই + user create
POST /api/auth/forgot-password → Reset OTP
POST /api/auth/reset-password  → নতুন পাসওয়ার্ড
GET  /api/auth/check-username  → username availability
GET  /api/auth/[...nextauth]   → NextAuth endpoints (signIn/signOut/session)
```

**Public (no auth):**
```
GET  /api/public/notices       → নোটিশ বার data
GET  /api/public/badges        → Hero badge stats
GET  /api/public/reviews       → অনুমোদিত reviews
GET  /api/public/stats         → Dashboard stats
POST /api/public/reviews       → রিভিউ submit
POST /api/public/calc          → Installment calculation
POST /api/applications         → Quick apply (homepage forms)
```

**Products & Orders:**
```
GET/POST   /api/products              → Catalog list + create
GET/PATCH/PUT/DELETE /api/products/[id] → Product detail/update/stock/deactivate
GET/POST   /api/orders               → Order list + create
GET/PATCH  /api/orders/[id]          → Order detail
POST       /api/orders/[id]/approve  → Approve/reject order
GET/POST   /api/installments         → Due installments
POST       /api/installments/collect → Collect payment
```

**Qard:**
```
GET/POST   /api/qard             → List + apply
GET        /api/qard/[id]        → Detail
POST       /api/qard/[id]/approve  → 3-step pipeline
POST       /api/qard/[id]/collect  → Collect repayment
```

**Accounts:**
```
GET/POST/DELETE /api/accounts/income        → আয় CRUD
GET/POST/DELETE /api/accounts/expense       → ব্যয় CRUD
POST            /api/accounts/fund-transfer → ফান্ড transfer
POST            /api/accounts/reconcile     → Balance reconciliation
GET             /api/accounts/summary       → Summary + charts
GET             /api/receipts               → Receipt lookup
POST            /api/receipts/void          → Cancel receipt
```

**Units & Profit:**
```
GET  /api/units/portfolio       → Member portfolio
POST /api/units/profit-preview  → Preview distribution (no DB write)
POST /api/units/commit-profit   → Commit distribution
```

**Admin:**
```
GET      /api/dashboard/stats   → Dashboard KPIs + pending actions
GET/POST /api/sms               → Templates CRUD
POST     /api/sms/send          → Broadcast SMS
GET      /api/sms/balance       → BulkSMSBD balance
GET/POST /api/committee         → Committee CRUD
PATCH/DELETE /api/committee/[id] → Member update/expire
GET      /api/audit-log         → Filterable audit log (Super Admin)
POST     /api/member-applications → Membership application
```

---

## অধ্যায় ৯ — ব্যবসায়িক হিসাব সূত্র / Business Formula Reference

### ৯.১ ইউনিট সিস্টেম

```
1 Unit = ৳2,000 (Super Admin থেকে configurable)
Fractional units: ৳5,000 = 2.5 units

Units = Total Deposit ÷ Unit Value

Day-weighted profit:
  weightedCapital = totalCapital × (activeDays ÷ totalPeriodDays)
  memberShare = (weightedCapital ÷ totalWeightedCapital) × memberPool
```

### ৯.২ মুনাফা বণ্টন

```
Net Profit = Business Revenue − Cost of Goods − Operational Expense

If Net Profit ≤ 0 → কোনো বণ্টন নেই

If Net Profit > 0:
  Member/Investor Pool = Net Profit × 60%
  Charity Fund         = Net Profit × 5%
  Organization Fund    = Net Profit × 35%

(percentages configurable from SystemSettings)
```

### ৯.৩ কিস্তি হিসাব (Method B — Default Shariah)

```
Financed Amount = Purchase Cost − Down Payment
Profit          = Financed Amount × Profit Rate%
Total Payable   = Purchase Cost + Profit

Regular Installment = floor(Total Payable ÷ N)
Last Installment    = Total Payable − (Regular × (N−1))
                      [শেষ কিস্তিতে rounding residual adjust]

Sum of all installments = Total Payable (exact, no drift)
```

### ৯.৪ বিলম্ব ফি (Late Fee) নিয়ম

```
Late Fee = Units × ৳100/month (configurable)
Late Fee → 100% Charity Fund (কখনো সংগঠনের আয় নয়)
```

---

## অধ্যায় ১০ — পরিচিত সমস্যা ও সমাধান / Troubleshooting

| সমস্যা | সম্ভাব্য কারণ | সমাধান |
|--------|--------------|--------|
| `prisma generate` error | DATABASE_URL missing | `.env.local`-এ `DATABASE_URL` সেট করুন |
| `NEXTAUTH_SECRET` error | Secret missing | `openssl rand -base64 32` দিয়ে generate করুন |
| OTP আসছে না | SMS API key missing | `.env.local`-এ `SMS_API_KEY` সেট করুন; dev mode-এ console-এ দেখুন |
| Build error: "different slug names" | Conflicting dynamic routes | `/shop/[slug]` একটিই থাকতে হবে |
| `@prisma/client` enum not found | `prisma generate` run হয়নি | `npx prisma generate` চালান |
| Login redirect loop | `NEXTAUTH_URL` mismatch | production URL সঠিক দিন |
| Image upload failed | `/public/uploads/` নেই | `mkdir -p public/uploads/photos public/uploads/signatures public/uploads/kyc` |

---

## অধ্যায় ১১ — উন্নয়নের পরবর্তী ধাপ / Next Development Phases

```
Phase 6 (শীঘ্রই):
  ✓ Push Notifications (Web Push API)
  ✓ Digital Signature (canvas-based)
  ✓ Agreement PDF generation
  ✓ Advanced inventory tracking

Phase 7 (ভবিষ্যতে):
  ✓ SSL Commerz / bKash payment gateway integration
  ✓ Location tracking for field staff
  ✓ Advanced multilingual (Urdu support)
  ✓ AI-based financial insights
  ✓ Mobile app (React Native)
```

---

## পরিশিষ্ট — দ্রুত রেফারেন্স কার্ড / Quick Reference

```
🚀 DEV START:
  cd C:\Project\barakah_finance\nextjs
  npm run dev → http://localhost:3000

🔑 DEFAULT LOGIN:
  URL: /login
  Username: admin | Password: admin1234

🗄️ DB COMMANDS:
  npx prisma db push     → Schema sync
  npx prisma db seed     → Default data
  npx prisma studio      → DB GUI (localhost:5555)
  npx prisma generate    → Regenerate client

🏗️ BUILD:
  npm run build          → Production build
  npm start              → Start production server

📱 SMS:
  Provider: BulkSMSBD
  API: http://bulksmsbd.net/api/smsapi
  Key: PEORenxMbnajRYOPGnsD

💰 FINANCIAL RULES:
  1 Unit = ৳2,000 | Late Fee → Charity (100%)
  Net Profit: 60% Members | 5% Charity | 35% Org
  No hard delete on financial records — EVER

🔒 SECURITY:
  Passwords: bcrypt 12 rounds
  JWT: 7-day, HttpOnly cookie
  2FA: TOTP mandatory for Super Admin
  All financial ops: Prisma $transaction() (ACID)
```

---

*বারাকাহ ফাইন্যান্স — সুদমুক্ত লেনদেনে সমৃদ্ধি সবার*  
*Documentation version: Phase 5 Complete | Build: -EOmWrtVdzgiZY9VK9oNC*
