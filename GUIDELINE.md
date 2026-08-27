# বারাকাহ ফাইন্যান্স — সম্পূর্ণ টেকনিক্যাল গাইডলাইন
# Barakah Finance — Complete Technical Guideline

> **ভাষা / Language:** এই গাইডলাইনটি বাংলা ও ইংরেজি উভয় ভাষায় লেখা হয়েছে।

---

## ১. সিস্টেম ওভারভিউ / System Overview

বারাকাহ ফাইন্যান্স একটি শরিয়াহ-সম্মত আর্থিক ব্যবস্থাপনা প্ল্যাটফর্ম। এটি তিনটি প্রধান অংশে বিভক্ত:

| অংশ | পাথ | বিবরণ |
|-----|-----|--------|
| পাবলিক ওয়েবসাইট | `/` | যেকোনো ভিজিটর দেখতে পারবে |
| ব্যবহারকারী ড্যাশবোর্ড | `/dashboard` | নিবন্ধিত সদস্য/ব্যবহারকারী |
| অ্যাডমিন প্যানেল | `/admin` | Admin ও Super Admin |

**Public URL Structure (clean slugs — no file extensions):**

```
barakahfinancebd.com/           → Landing Page
barakahfinancebd.com/gallery    → Gallery
barakahfinancebd.com/timeline   → Timeline / Posts
barakahfinancebd.com/learn-more → About / Info pages
barakahfinancebd.com/shop       → E-Commerce
barakahfinancebd.com/shop/mobile → Product category
barakahfinancebd.com/dashboard  → User Dashboard
barakahfinancebd.com/profile    → User Profile
barakahfinancebd.com/admin      → Admin Panel
barakahfinancebd.com/{username} → Public member profile (e.g. /mohib357)
```

---

## ২. টেকনোলজি স্ট্যাক / Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Frontend | React 18, Tailwind CSS, Shadcn UI / Radix Primitives |
| Database | PostgreSQL (ACID-compliant relational DB) |
| ORM | Prisma ORM |
| Auth | NextAuth.js v4 (Credentials + JWT) |
| 2FA | otplib (TOTP) + SMS OTP (bulksmsbd.net) |
| Password | bcryptjs (salt rounds = 12) |
| Validation | Zod |
| Charts | Chart.js + react-chartjs-2 |
| Image | sharp (server-side resize/compress) |
| Print | react-to-print |
| Icons | Lucide React |

---

## ৩. ডাটাবেস আর্কিটেকচার / Database Architecture

### ৩.১ কোথায় ও কিভাবে ডাটা সংরক্ষণ হয়

```
PostgreSQL Database
└── schema: public
    ├── Users            — সব ব্যবহারকারীর মূল পরিচয়
    ├── UserProfile      — বিস্তারিত ব্যক্তিগত তথ্য
    ├── UserKYC          — NID, ছবি (সংবেদনশীল, আলাদা access)
    ├── UserRole         — একাধিক role একজনের
    ├── UserSession      — সক্রিয় session ট্র্যাকিং
    ├── OTPRecord        — OTP hash সহ TTL
    ├── Member           — সদস্যের আর্থিক অংশগ্রহণ
    ├── SavingsRecord    — প্রতি মাসের সঞ্চয়
    ├── CapitalMovement  — মূলধনের প্রতিটি পরিবর্তন (profit calculation)
    ├── Customer         — পণ্য কিস্তির গ্রাহক
    ├── Product          — পণ্য ক্যাটালগ
    ├── Order            — কিস্তি অর্ডার (price snapshot সহ)
    ├── Installment      — প্রতিটি কিস্তি schedule
    ├── Payment          — প্রতিটি পেমেন্ট (immutable)
    ├── Receipt          — রসিদ রেজিস্ট্রি (immutable)
    ├── FinancialAccount — Cash/Bank/bKash/Nagad/Rocket আলাদা
    ├── IncomeEntry      — আয়ের রেকর্ড
    ├── ExpenseEntry     — ব্যয়ের রেকর্ড
    ├── LedgerEntry      — সাধারণ খাতা (auto-populated)
    ├── FundTransfer     — ফান্ড-টু-ফান্ড transfer
    ├── Project          — বিনিয়োগ প্রকল্প
    ├── FixedAsset       — স্থায়ী সম্পত্তি
    ├── ProfitDistribution — লাভ বণ্টন cycle
    ├── QardApplication  — করজে হাসানা আবেদন ও schedule
    ├── CharityFundraising / CharityExpenditure
    ├── CommitteeSession / CommitteeMember
    ├── SMSRecord / SMSTemplate
    ├── Notice / Badge / Review / Post / GalleryItem
    ├── SystemSettings   — সিঙ্গেল রো সিস্টেম কনফিগ
    ├── UserPermission   — granular permission override
    ├── AuditLog         — immutable audit trail
    └── ActivityFeed     — live activity monitor
```

### ৩.২ গুরুত্বপূর্ণ নিয়ম / Critical Rules

1. **আর্থিক রেকর্ড হার্ড-ডিলিট করা যাবে না।** Payment, Receipt, Installment, Savings, QardApplication — এগুলো কখনো `DELETE` হবে না। ভুল হলে Reversal বা Cancellation entry করতে হবে।
2. **Receipt Number পুনরায় ব্যবহার করা যাবে না।** Receipt cancelled হলে নতুন নম্বর তৈরি হবে।
3. **Decimal arithmetic:** সব আর্থিক calculation `Decimal.js` ব্যবহার করবে — JavaScript-এর floating-point ব্যবহার করবে না।
4. **Transaction atomicity:** একটি payment সফল না হলে ledger entry হবে না। Prisma transaction (`$transaction()`) ব্যবহার করতে হবে।
5. **Late fee → Charity fund:** বিলম্ব ফি সংগঠনের আয় হবে না, শুধুমাত্র Charity fund-এ যাবে।

### ৩.৩ ডাটাবেস সংযোগ

`.env.local` ফাইলে:
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/barakah_finance?schema=public"
```

---

## ৪. সিস্টেমে প্রবেশের নির্দেশিকা / Login & Access Guide

### ৪.১ সবাই একই লগইন পেজ ব্যবহার করবে: `/login`

| ব্যবহারকারীর ধরন | Default Credentials | Login করার পর |
|------------------|--------------------|--------------:|
| Super Admin | username: `admin`, password: `admin1234` | → `/admin` |
| Admin | admin তৈরি করে দেবে | → `/admin` |
| Member | নিজে signup → OTP verify → `/dashboard` |
| Customer | Member হতে পারে, অথবা আলাদা | → `/dashboard` |
| সাধারণ User | Signup করে verify করলে | → `/dashboard` |

> ⚠️ **প্রথম লগইনের পরেই `admin` ব্যবহারকারীর পাসওয়ার্ড পরিবর্তন করুন।**

### ৪.২ Super Admin → 2FA বাধ্যতামূলক

Super Admin লগইনের পর TOTP বা SMS OTP দিয়ে verify করতে হবে। `/login/2fa` পেজে নিয়ে যাবে।

**TOTP Setup (Google Authenticator):**
1. Admin Panel → Settings → Security → Setup 2FA
2. QR code স্ক্যান করুন (Google Authenticator / Authy)
3. একটি 6-digit কোড দিয়ে confirm করুন

---

## ৫. ব্যবহারকারীর রোডম্যাপ / User Roadmap

### ৫.১ নতুন সদস্য হওয়ার প্রক্রিয়া

```
1. barakahfinancebd.com → "সদস্য হতে আবেদন করুন"
2. Signup → Phone/Email + Password
3. OTP verify (SMS)
4. Profile তৈরি (নাম, ঠিকানা, ছবি, NID)
5. Form fill করুন (5-step): Personal → Nominee → Investment → Photo/Sign → Review
6. Submit → Pending (Admin review)
7. Admin approve করলে → Payment request
8. Payment (bKash/Nagad/Bank/Cash)
9. Member ID activate → SMS confirmation
```

### ৫.২ পণ্য কিস্তিতে কেনার প্রক্রিয়া

```
1. /shop → পণ্য browse করুন
2. Login থাকলে → "কিস্তিতে কিনুন" → Application
3. KYC verified থাকতে হবে
4. Admin/Committee → approve
5. Down payment করুন
6. Installment schedule auto-generate
7. প্রতি মাসে নির্দিষ্ট তারিখে কিস্তি দিন
8. Dashboard-এ due দেখতে পারবেন
```

### ৫.৩ করজে হাসানার প্রক্রিয়া

```
1. Dashboard → "Apply Qard-e-Hasana"  (অথবা /learn-more → করজে হাসানা)
2. কারণ, পরিমাণ, জামিনদার (Member) উল্লেখ করুন
3. Committee review → Admin approve
4. Disbursement → বিকাশ/ক্যাশ
5. পরবর্তী মাস থেকে কিস্তিতে পরিশোধ
6. QH-001, QH-002... serial code
```

### ৫.৪ অ্যাডমিনের কাজের তালিকা

```
Admin Dashboard
├── Pending Membership Applications → Review → Approve/Reject
├── Pending KYC → Review NID → Verify/Reject
├── Pending Orders → Approve installment plan
├── Pending Qard Applications → Committee approval
├── Collect Payments → Member/Client এর আইডি দিয়ে
├── Add Income/Expense
├── Generate Reports → A4 print / PDF / Excel
├── Send SMS (individual/group/bulk)
├── Manage Products (add/edit/stock)
├── Website Content (notices, badges, reviews, gallery)
└── Settings (profit %, late fee, unit value, SMS API)
```

---

## ৬. লোকাল সার্ভারে চালানো / Local Development Setup

### ৬.১ Prerequisites

- Node.js ≥ 18.17.0
- PostgreSQL ≥ 14 (locally or Docker)
- npm ≥ 9

### ৬.২ Step-by-step

```powershell
# ১. নতুন Next.js প্রজেক্টে যান
cd C:\Project\barakah_finance\nextjs

# ২. Dependencies install করুন
npm install

# ৩. Environment variables তৈরি করুন
Copy-Item .env.example .env.local
# .env.local ফাইলে DATABASE_URL, NEXTAUTH_SECRET, JWT_SECRET সেট করুন

# ৪. PostgreSQL এ database তৈরি করুন
# psql -U postgres -c "CREATE DATABASE barakah_finance;"

# ৫. Prisma schema migrate করুন
npm run db:push      # development-এ (creates tables directly)
# অথবা
npm run db:migrate   # migration file তৈরি করে (production-safe)

# ৬. Default data seed করুন
npm run db:seed

# ৭. Development server চালু করুন
npm run dev
# → http://localhost:3000 খুলবে

# ৮. (Optional) Prisma Studio — DB দেখার GUI
npm run db:studio
# → http://localhost:5555
```

### ৬.৩ ডাটা কোথায় সংরক্ষণ হয়

- **Database:** PostgreSQL এ, টেবিল আকারে। ডিফল্টভাবে: `localhost:5432/barakah_finance`
- **Uploaded files:** `nextjs/public/uploads/` ফোল্ডারে (photos, signatures, NID scans)
  - Profile photos: `public/uploads/photos/{userId}.webp`
  - Signatures: `public/uploads/signatures/{userId}.webp`
  - NID: `public/uploads/kyc/{userId}-nid-front.webp`
- **Backups:** `nextjs/backups/` ফোল্ডারে, `backup_YYYY-MM-DD_HH-MM-SS.sql` নামে
- **Logs:** Console / structured logging (Phase 2-তে log file/service যুক্ত হবে)

> **Legacy system:** পুরনো Express.js + LowDB সিস্টেম `backend/db/data.json`-এ সব কিছু রাখে। নতুন Next.js সিস্টেমে migration-এর সময় এই JSON ফাইল থেকে ডাটা import করতে হবে।

---

## ৭. অনলাইনে পাবলিশ করার নির্দেশিকা / Deployment Guide (Namecheap cPanel)

### ৭.১ Prerequisites

- Namecheap cPanel অ্যাক্সেস (আপনাদের আছে)
- Domain: `barakahfinancebd.com`
- PostgreSQL database (cPanel → MySQL Databases-এ PostgreSQL থাকলে; না থাকলে Railway.app বা Supabase ব্যবহার করুন)

### ৭.২ Option A — cPanel Node.js Selector (সহজ পদ্ধতি)

```
১. cPanel → "Setup Node.js App"
২. Node.js version: 18.x বা 20.x সিলেক্ট করুন
৩. Application root: /home/username/nextjs
৪. Application startup file: server.js
   (Next.js-এর জন্য custom server.js লাগবে অথবা pm2 ব্যবহার করুন)
৫. Application URL: barakahfinancebd.com
৬. Environment variables সেট করুন:
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=https://barakahfinancebd.com
   JWT_SECRET=...
   SMS_API_KEY=...
```

**Build step:**
```bash
npm install
npm run db:migrate:prod
npm run db:seed
npm run build
npm start
```

### ৭.৩ Option B — Railway.app বা Render.com (প্রস্তাবিত)

যদি cPanel-এ Node.js সমস্যা হয়:

1. **Database:** Railway.app → New Project → PostgreSQL → Connection URL কপি করুন
2. **App:** Railway.app → New → GitHub Repo → Deploy
3. **Environment Variables:** Railway dashboard থেকে সেট করুন
4. **Custom Domain:** barakahfinancebd.com → CNAME → Railway URL পয়েন্ট করুন

### ৭.৪ Namecheap DNS Settings

```
Type    | Host  | Value
--------|-------|---------------------------
A       | @     | [Server IP]
A       | www   | [Server IP]
CNAME   | api   | [Railway/Render URL]
```

### ৭.৫ SSL / HTTPS

- cPanel → Let's Encrypt SSL → Force HTTPS চালু করুন
- অথবা Cloudflare Proxy ব্যবহার করুন (বিনামূল্যে SSL + CDN + DDoS protection)

---

## ৮. সিকিউরিটি সিস্টেম / Security System

### ৮.১ Authentication Security

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (12 salt rounds) |
| JWT expiry | 7 days |
| Session revocation | UserSession table |
| Super Admin 2FA | TOTP (otplib) — mandatory |
| OTP hashing | bcrypt (8 rounds) |
| OTP TTL | 10 minutes |
| OTP max attempts | 5 before invalidation |
| Login rate limit | 10 requests/minute/IP (edge middleware) |
| Brute force | Account lock after repeated failures |

### ৮.২ Data Security

| Feature | Implementation |
|---------|---------------|
| HTTPS enforcement | HSTS header (production) |
| SQL injection | Prisma parameterized queries — no raw SQL |
| XSS protection | X-XSS-Protection header + React's auto-escaping |
| CSRF | NextAuth built-in CSRF token |
| Clickjacking | X-Frame-Options: SAMEORIGIN |
| Content sniffing | X-Content-Type-Options: nosniff |
| Input validation | Zod schemas on all API routes |
| File upload | Sharp resizes + validates file type/size before saving |
| KYC data | Access-controlled (Admin/authorized staff only) |
| NID number | Never displayed fully in public profile |

### ৮.৩ Database Security

- PostgreSQL user-এ minimum permissions (SELECT, INSERT, UPDATE — no DROP/CREATE)
- `DATABASE_URL` environment variable-এ রাখুন (never in code)
- Automated backup: hourly, retained 60 days
- Backup files encrypted (Phase 2-তে AES-256)

### ৮.৪ API Security

- সব `/api/*` route-এ Zod validation
- `verifySession()` helper — Server Actions ও API routes-এ
- Rate limiting at edge middleware
- CORS: production-এ শুধুমাত্র `ALLOWED_ORIGINS`

---

## ৯. ব্যাকআপ সিস্টেম / Backup System

```
প্রতি ঘণ্টায় auto backup (cron job):
  → pg_dump → backups/backup_YYYY-MM-DD_HH-MM-SS.sql
  → gzip compress করুন

রিটেনশন পলিসি:
  - লাস্ট 60 দিনের backup রাখা হবে
  - 60 দিনের পুরনো backup auto-delete

ম্যানুয়াল ব্যাকআপ:
  Admin Panel → Backup → Download Now

Restore:
  Admin Panel → Backup → Restore from file
  (Super Admin only)
```

**Backup automation setup (cron):**
```bash
# crontab -e
0 * * * * cd /home/username/nextjs && node scripts/backup.js >> /var/log/backup.log 2>&1
```

---

## ১০. ব্যবসায়িক নিয়ম / Business Logic Reference

### ১০.১ Profit Distribution Formula

```
Net Profit = Business Revenue − Cost of Goods − Operational Expense

যদি Net Profit > 0:
  Member/Investor Pool = Net Profit × 60%
  Charity Fund         = Net Profit × 5%
  Organization Fund    = Net Profit × 35%

প্রতিটি সদস্যের share:
  Weighted Capital = Total Capital × (Active Days / Total Days)
  Share = (Member's Weighted Capital / Total Weighted Capital) × Member Pool
```

### ১০.২ Installment Calculation (Method B — Default)

```
Financed Amount = Purchase Cost − Down Payment
Profit         = Financed Amount × Profit Rate
Total Payable  = Purchase Cost + Profit

Regular Installment = floor(Total Payable / N)  ← rounded down
Last Installment    = Total Payable − (Regular × (N−1))  ← residual adjustment

Sum of all installments = Total Payable (guaranteed)
```

### ১০.৩ Late Fee Rule

```
Late Fee = (Number of Units) × ৳100 per month
Unit = ৳2,000 of savings

⚠️ Late fee সংগঠনের আয় নয় — সরাসরি Charity Fund-এ জমা হবে।
```

### ১০.৪ Unit System

```
1 Unit = ৳2,000
Fractional units allowed: ৳5,000 = 2.5 Units

Unit Value change:
  - শুধুমাত্র Super Admin পারবেন
  - Change-এর পরে শুধু নতুন transaction-এ প্রযোজ্য
  - পুরনো historical calculation পরিবর্তন হবে না
```

---

## ১১. ডেভেলপার ইনস্ট্রাকশন / Developer Instructions

### ১১.১ প্রজেক্ট স্ট্রাকচার

```
nextjs/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public pages (no auth required)
│   ├── (auth)/             # Login, Signup, OTP pages
│   ├── (dashboard)/        # User dashboard (MEMBER+ required)
│   ├── (admin)/            # Admin panel (ADMIN+ required)
│   └── api/                # API Route Handlers
├── components/
│   ├── ui/                 # Shadcn/Radix primitive wrappers
│   ├── providers/          # Context providers
│   ├── layout/             # Navbar, Sidebar, Footer
│   ├── forms/              # Form components
│   ├── charts/             # Chart.js wrappers
│   └── print/              # Receipt print templates
├── lib/
│   ├── auth/               # NextAuth config, session, OTP, 2FA, password
│   ├── constants/          # roles.ts, permissions.ts
│   ├── db/                 # Prisma client singleton
│   └── utils/              # formatters, validators, calculators
├── types/                  # Global TypeScript types
├── hooks/                  # Custom React hooks
├── prisma/
│   ├── schema.prisma       # Database schema (55 models)
│   └── seed.ts             # Default data seed
└── middleware.ts            # Edge auth + security headers
```

### ১১.২ নতুন API Route তৈরির pattern

```typescript
// app/api/members/route.ts
import { requireSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/session";
import { MODULES, ACTIONS } from "@/lib/constants/permissions";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await requireSession({ requiredRole: "STAFF" });

  const canView = await checkPermission(
    session.user.id,
    session.user.systemRole,
    MODULES.MEMBERS,
    ACTIONS.VIEW
  );
  if (!canView) return NextResponse.json({ error: "অ্যাক্সেস নেই" }, { status: 403 });

  const members = await prisma.member.findMany({ ... });
  return NextResponse.json({ members });
}
```

### ১১.৩ Prisma Transaction Pattern (Financial Operations)

```typescript
// ALWAYS use $transaction for financial operations
await prisma.$transaction(async (tx) => {
  // 1. Create payment record
  const payment = await tx.payment.create({ data: { ... } });

  // 2. Create receipt
  const receipt = await tx.receipt.create({ data: { ... } });

  // 3. Update installment
  await tx.installment.update({ where: { id }, data: { status: "PAID" } });

  // 4. Write ledger entry
  await tx.ledgerEntry.create({ data: { ... } });

  // 5. Write audit log
  await tx.auditLog.create({ data: { ... } });
});
```

---

## ১২. Phase Roadmap

| Phase | বিষয় | অবস্থা |
|-------|------|--------|
| **Phase 1** | DB Schema, Auth, RBAC, Middleware | ✅ **সম্পন্ন** |
| **Phase 2** | Landing Page, Login UI, Public Pages | 🔄 পরবর্তী |
| **Phase 3** | Member Dashboard, Savings, Installments | ⏳ |
| **Phase 4** | Admin Panel, Reports, Accounts | ⏳ |
| **Phase 5** | Qard, Charity, Projects, Profit Engine | ⏳ |
| **Phase 6** | SMS, Notifications, Backup automation | ⏳ |
| **Phase 7** | KYC, Digital Signature, Bank Integration | ⏳ |

---

## ১৩. পরিচিত সমস্যা ও সমাধান / Troubleshooting

| সমস্যা | সমাধান |
|--------|--------|
| `prisma generate` error | `npm install` পুনরায় চালান |
| DB connection refused | PostgreSQL চালু আছে কিনা চেক করুন; `.env.local`-এ `DATABASE_URL` সঠিক কিনা দেখুন |
| `NEXTAUTH_SECRET` missing | `.env.local`-এ `NEXTAUTH_SECRET` সেট করুন: `openssl rand -base64 32` |
| OTP আসছে না | `.env.local`-এ `SMS_API_KEY` সেট করুন; development-এ console-এ OTP দেখাবে |
| Image upload error | `public/uploads/` ফোল্ডার তৈরি করুন এবং write permission দিন |
| Build error (TypeScript) | `npm run lint` চালান; type error fix করুন |

---

*Last updated: Phase 1 completion*  
*Contact: বারাকাহ ফাইন্যান্স টেকনিক্যাল টিম*
