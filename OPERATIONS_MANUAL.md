# বারাকাহ ফাইন্যান্স — সম্পূর্ণ পরিচালনা ও ডেপ্লয়মেন্ট ম্যানুয়াল
# Barakah Finance — Complete Operations & Deployment Manual

> **সংস্করণ:** Final Production Release  
> **Build ID:** `sx9_oJzK3HCWoGEPmOhGe`  
> **Framework:** Next.js 14.2.5 · TypeScript · PostgreSQL · Prisma ORM  
> **নির্মাণ স্থিতি:** ✅ 0 Errors · 23 Pages · 42 API Routes · 63 DB Models

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ভাগ-ক: লোকাল ডেভেলপমেন্ট সেটআপ
## Local Development Setup & Testing
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ক-১. PostgreSQL ইনস্টলেশন

#### Windows-এ PostgreSQL:
```
১. https://www.postgresql.org/download/windows/ থেকে ডাউনলোড করুন
২. ইনস্টলার চালান (সব default রাখুন)
৩. Port: 5432 (default)
৪. Superuser password সেট করুন — মনে রাখবেন!
৫. pgAdmin 4 স্বয়ংক্রিয়ভাবে ইনস্টল হবে (GUI tool)

ইনস্টলের পর ডাটাবেস তৈরি:
   শুরু মেনু → pgAdmin 4 → Servers → PostgreSQL → Databases
   রাইট ক্লিক → Create → Database → Name: barakah_finance → Save
```

#### macOS-এ PostgreSQL:
```bash
# Homebrew দিয়ে (প্রস্তাবিত):
brew install postgresql@14
brew services start postgresql@14

# ডাটাবেস তৈরি:
createdb barakah_finance
```

#### Command Line দিয়ে (সব প্ল্যাটফর্ম):
```sql
-- Terminal/Command Prompt-এ:
psql -U postgres
CREATE DATABASE barakah_finance;
\q
```

---

### ক-২. প্রজেক্ট সেটআপ (ধাপে ধাপে)

```powershell
# ── ধাপ ১: প্রজেক্টে যান ────────────────────────────────
cd C:\Project\barakah_finance\nextjs

# ── ধাপ ২: সব প্যাকেজ ইনস্টল করুন ──────────────────────
npm install

# ── ধাপ ৩: Environment ফাইল তৈরি করুন ──────────────────
# .env.example ফাইলটি কপি করুন:
Copy-Item .env.example .env.local
# (Mac/Linux: cp .env.example .env.local)

# ── ধাপ ৪: .env.local ফাইল সম্পাদনা করুন ────────────────
notepad .env.local    # Windows
# code .env.local     # VS Code দিয়ে

# নিচের মানগুলো সঠিক করুন:
```

**.env.local** ফাইলে এই মানগুলো দিন:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=যেকোনো_লম্বা_র্যান্ডম_স্ট্রিং_এখানে

DATABASE_URL="postgresql://postgres:আপনার_পাসওয়ার্ড@localhost:5432/barakah_finance?schema=public"

JWT_SECRET=আরেকটি_লম্বা_র্যান্ডম_স্ট্রিং

SMS_API_KEY=PEORenxMbnajRYOPGnsD
SMS_API_URL=http://bulksmsbd.net/api/smsapi
SMS_BALANCE_URL=http://bulksmsbd.net/api/getBalanceApi
SMS_SENDER_ID=8809617611021
```

> 💡 **Secret তৈরির নিয়ম:**  
> Command Prompt-এ: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

### ক-৩. ডাটাবেস স্কিমা ও ডেটা সেটআপ

```powershell
# ── ধাপ ৫: Prisma client তৈরি করুন ─────────────────────
npx prisma generate

# ── ধাপ ৬: ডাটাবেসে টেবিল তৈরি করুন ──────────────────
npx prisma db push
# এটি সব ৬৩টি টেবিল তৈরি করবে PostgreSQL-এ

# ── ধাপ ৭: ডিফল্ট ডেটা প্রবেশ করান ─────────────────────
npm run db:seed
```

`db:seed` কমান্ড নিচের ডেটা তৈরি করবে:

| আইটেম | বিবরণ |
|-------|-------|
| Super Admin | username: `admin`, password: `admin1234` |
| System Settings | unit value, profit %, late fee rules |
| ৩টি নোটিশ | ডিফল্ট স্ক্রলিং নোটিশ |
| ৬টি badge | Hero section stats |
| ৭টি SMS template | পেমেন্ট, করজ, জন্মদিন, ইত্যাদি |
| কমিটি সেশন | ২০২৬-২০২৮ কমিটি + ৭ সদস্য |
| Income/Expense ক্যাটাগরি | সব ধরনের আয়-ব্যয়ের ক্যাটাগরি |
| ৩টি Pay Order Rule | ফরম ফি, মাসিক সঞ্চয়, এককালীন |
| ৫টি Financial Account | ক্যাশ, বিকাশ, নগদ, রকেট, ব্যাংক |

---

### ক-৪. ডেভ সার্ভার চালু করুন

```powershell
# ── ধাপ ৮: Development server শুরু করুন ─────────────────
npm run dev

# সফল হলে দেখাবে:
# ▲ Next.js 14.2.5
# - Local: http://localhost:3000
# - Environments: .env.local
```

ব্রাউজারে খুলুন: **http://localhost:3000**

---

### ক-৫. ডিফল্ট লগইন ক্রেডেনশিয়াল

> ⚠️ **প্রথম লগইনের পরই পাসওয়ার্ড পরিবর্তন করুন!**

| ভূমিকা | লগইন URL | Username | Password | লগইনের পর |
|--------|----------|----------|----------|-----------|
| **Super Admin** | `/login` | `admin` | `admin1234` | `/admin` (2FA prompt) |

**নতুন Admin তৈরি করতে:**
```
/login → admin/admin1234 → /admin → সদস্য তালিকা →
কোনো User select করুন → Role: ADMIN → সেভ
```

**নতুন Member তৈরি করতে:**
```
পথ ১ (Self-service): /login → নিবন্ধন → OTP verify → /apply (5-step form)
পথ ২ (Admin creates): /admin/members → Add Member
```

---

### ক-৬. লাইভ রুট যাচাই

ডেভ সার্ভার চালু থাকলে এই URLগুলো পরীক্ষা করুন:

```
http://localhost:3000/                → Landing page
http://localhost:3000/shop            → Product catalog
http://localhost:3000/login           → Login/Signup
http://localhost:3000/apply           → Membership form
http://localhost:3000/admin           → Admin dashboard (login required)
http://localhost:3000/api/public/notices → Notices API (JSON)
http://localhost:3000/api/public/stats   → Stats API (JSON)
```

### ক-৭. Prisma Studio (ডাটাবেস GUI)

```powershell
npx prisma studio
# → http://localhost:5555 খুলবে
# → সব টেবিল graphically দেখতে ও edit করতে পারবেন
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ভাগ-খ: Namecheap cPanel ডেপ্লয়মেন্ট
## Step-by-Step Production Deployment
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### খ-১. PostgreSQL ডাটাবেস সেটআপ

Namecheap cPanel সাধারণত **MySQL** সাপোর্ট করে, PostgreSQL নয়।  
তাই একটি **managed PostgreSQL** service ব্যবহার করুন:

#### বিকল্প ১ — Neon.tech (বিনামূল্যে, প্রস্তাবিত)
```
১. https://neon.tech → Sign Up (GitHub দিয়ে)
২. New Project → Project name: barakah-finance
৩. Database name: barakah_finance → Create
৪. Connection string কপি করুন:
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/barakah_finance?sslmode=require
```

#### বিকল্প ২ — Railway.app
```
১. https://railway.app → New Project → Database → PostgreSQL
২. Connect tab → Connection URL কপি করুন
```

#### বিকল্প ৩ — Supabase.com
```
১. https://supabase.com → New Project
২. Settings → Database → Connection string (URI) কপি করুন
```

---

### খ-২. Production Build প্রস্তুতি (লোকাল মেশিনে)

```powershell
cd C:\Project\barakah_finance\nextjs

# ১. .env.local-এ production মান দিন:
#    DATABASE_URL=<neon/railway এর connection string>
#    NEXTAUTH_URL=https://barakahfinancebd.com
#    NODE_ENV=production

# ২. Production build তৈরি করুন
npm run build

# ৩. Build সফল হলে এই ফোল্ডারগুলো তৈরি হবে:
#    .next/   ← compiled production code
#    public/  ← static assets
```

---

### খ-৩. আপলোড চেকলিস্ট

**আপলোড করবেন (server-এ যাবে):**

```
✅ .next/               ← compiled Next.js output (সবচেয়ে বড়, ~50MB)
✅ public/              ← logo, uploads folder
✅ prisma/              ← schema.prisma + seed.ts
✅ scripts/             ← backup.js
✅ types/               ← enums.ts
✅ package.json         ← dependencies list
✅ package-lock.json    ← exact versions
✅ next.config.mjs      ← Next.js config
✅ server.js            ← custom HTTP server
✅ tailwind.config.ts   ← (build-time only, but keep)
✅ tsconfig.json        ← TypeScript config
✅ postcss.config.js    ← CSS processing
```

**আপলোড করবেন না (exclude করুন):**

```
❌ node_modules/        ← server-এ npm install করবেন
❌ .git/                ← version control files
❌ .env.local           ← local secrets
❌ backups/             ← local backup files
❌ .next/cache/         ← build cache (optional exclude)
```

**ZIP ফাইল তৈরি (Windows):**
```powershell
# PowerShell দিয়ে (node_modules ও .git বাদ দিয়ে):
Compress-Archive -Path "C:\Project\barakah_finance\nextjs\*" `
  -DestinationPath "C:\barakah-deploy.zip" `
  -Force
# Note: এরপর ZIP থেকে node_modules/ ও .git/ ফোল্ডার delete করুন
```

---

### খ-৪. Namecheap cPanel-এ ফাইল আপলোড

```
Method 1: File Manager (সহজ)
  cPanel → File Manager → /home/username/ এ নতুন folder: barakah-nextjs
  Upload ZIP → Extract All → barakah-nextjs/ folder-এ

Method 2: FTP/SFTP (দ্রুত, বড় ফাইলের জন্য)
  Software: FileZilla (বিনামূল্যে)
  Host: barakahfinancebd.com
  Username: cPanel username
  Password: cPanel password
  Port: 21 (FTP) বা 22 (SFTP)
  Remote path: /home/username/barakah-nextjs/
```

---

### খ-৫. cPanel "Setup Node.js App" কনফিগারেশন

```
cPanel → Software → Setup Node.js App → Create Application

┌────────────────────────────────────────────────────────────┐
│ Node.js version:     18.x বা 20.x (সর্বোচ্চ available)  │
│ Application mode:    Production                            │
│ Application root:    /home/username/barakah-nextjs         │
│ Application URL:     barakahfinancebd.com                  │
│ Application startup file:  server.js                       │
└────────────────────────────────────────────────────────────┘

→ "Create" বাটনে ক্লিক করুন
```

---

### খ-৬. Environment Variables সেটআপ (cPanel)

"Setup Node.js App" → আপনার App → "Environment variables" section:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://barakahfinancebd.com` |
| `NEXTAUTH_SECRET` | _(32+ char random string)_ |
| `DATABASE_URL` | _(Neon/Railway PostgreSQL URL)_ |
| `JWT_SECRET` | _(64+ char random string)_ |
| `JWT_EXPIRES_IN` | `7d` |
| `TOTP_ISSUER` | `BarakahFinance` |
| `OTP_TTL_SECONDS` | `600` |
| `SMS_API_KEY` | `PEORenxMbnajRYOPGnsD` |
| `SMS_API_URL` | `http://bulksmsbd.net/api/smsapi` |
| `SMS_BALANCE_URL` | `http://bulksmsbd.net/api/getBalanceApi` |
| `SMS_SENDER_ID` | `8809617611021` |
| `UPLOAD_DIR` | `./public/uploads` |
| `BACKUP_DIR` | `./backups` |
| `BACKUP_RETENTION_DAYS` | `60` |

> 💡 **Secret তৈরি করুন:**  
> cPanel Terminal-এ: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

### খ-৭. প্রথমবার Server চালু করা (SSH/Terminal)

```bash
# cPanel → Terminal বা SSH দিয়ে:
cd ~/barakah-nextjs

# ১. Dependencies install করুন (production only)
npm install --omit=dev

# ২. Prisma client generate করুন
npx prisma generate

# ৩. ডাটাবেস schema push করুন
npx prisma db push

# ৪. Default ডেটা seed করুন
npm run db:seed

# ৫. App start করুন (cPanel Node.js App panel থেকে)
#    অথবা terminal থেকে:
node server.js

# → সফল হলে দেখাবে:
# > Barakah Finance ready on http://localhost:PORT
```

---

### খ-৮. Cron Job — Hourly Backup

```
cPanel → Advanced → Cron Jobs → Add New Cron Job

Timing: Every Hour
Command:
cd /home/username/barakah-nextjs && node scripts/backup.js >> /home/username/logs/backup.log 2>&1

OR (minute, hour, day, month, weekday):
0 * * * * cd /home/username/barakah-nextjs && node scripts/backup.js
```

Backup ফাইলগুলো সংরক্ষিত হবে: `~/barakah-nextjs/backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz`  
৬০ দিনের পুরনো backup স্বয়ংক্রিয়ভাবে মুছে যাবে।

---

### খ-৯. SSL Certificate সেটআপ

```
cPanel → Security → SSL/TLS → Manage SSL Sites
  → Install Let's Encrypt Certificate
  → Domain: barakahfinancebd.com
  → "Force HTTPS Redirect": চালু করুন ✅

অথবা Cloudflare ব্যবহার করুন (বিনামূল্যে):
  → Cloudflare DNS → A Record → Server IP
  → SSL/TLS → Full (Strict)
  → Page Rules → "Always Use HTTPS"
```

---

### খ-১০. Custom Domain Setup

```
Namecheap cPanel → Domains → Zone Editor

Add A Record:
  Host: @            Value: [Your Server IP]  TTL: Auto
  Host: www          Value: [Your Server IP]  TTL: Auto

OR যদি Cloudflare ব্যবহার করেন:
  Cloudflare DNS → A Record → Name: @ → IPv4: [Server IP]
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ভাগ-গ: প্ল্যাটফর্ম পরিচালনা ম্যানুয়াল
## Platform Governance & Day-to-Day Operations
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### গ-১. Super Admin প্রথম লগইন ও নিরাপত্তা সেটআপ

```
১. https://barakahfinancebd.com/login খুলুন
২. Username: admin | Password: admin1234
৩. /admin → 2FA Setup করুন:
   → Settings → Security → Setup 2FA
   → Google Authenticator অ্যাপে QR Code scan করুন
   → 6-digit code দিয়ে confirm করুন
৪. /admin → Settings → পাসওয়ার্ড পরিবর্তন করুন
৫. সংগঠনের তথ্য আপডেট করুন:
   → /admin/sms বা Economy Information-এ
   → নাম, ঠিকানা, ফোন, ইমেইল, ওয়েবসাইট
```

---

### গ-২. Admin Action Center (`/admin`)

Dashboard-এ প্রতিটি গুরুত্বপূর্ণ কাজের queue দেখায়:

| Action Item | কী করতে হবে |
|-------------|------------|
| **Pending Membership** | নতুন সদস্য আবেদন → review → approve/reject |
| **Pending KYC** | NID যাচাই → approve/reject |
| **Overdue Installments** | বকেয়া কিস্তির তালিকা → notify/collect |
| **Pending Qard** | করজে হাসানা আবেদন → 3-step pipeline |
| **Low Stock Products** | স্টক শেষ হয়ে যাওয়া পণ্য |
| **Pending Reviews** | website review moderation |

---

### গ-৩. নতুন সদস্য অনুমোদন প্রক্রিয়া

```
ব্যবহারকারী:
  /login → নিবন্ধন → OTP verify → /apply (5-step form জমা দেন)

Admin:
  /admin → Pending Membership badge → আবেদন দেখুন
  → KYC verify (NID check) → Approve বা Reject
  → Approve হলে: SMS যাবে → পেমেন্ট করতে বলবে
  → পেমেন্ট confirm হলে: Member ID activate হবে

Admin manually member add করতে:
  /admin/members → "Add Member" → তথ্য দিন → Investment type → Save
```

---

### গ-৪. পণ্য কিস্তি ব্যবস্থাপনা

#### নতুন পণ্য যোগ করুন:
```
/admin/products → "+ নতুন পণ্য"
  → productCode, নাম, ক্যাটাগরি, ক্রয়মূল্য
  → Profit Method: FINANCED_AMOUNT (শরিয়াহ — default)
  → Profit Rate: ১০%
  → Stock Qty
  → Save
```

#### অর্ডার অনুমোদন ও কিস্তি সংগ্রহ:
```
পদক্ষেপ ১: /admin/orders → Pending অর্ডার → Approve
পদক্ষেপ ২: গ্রাহককে SMS যাবে (স্বয়ংক্রিয়)
পদক্ষেপ ৩: গ্রাহক ডাউনপেমেন্ট করতে আসলে:
  /admin/orders → অর্ডার select করুন
  → "কিস্তি সংগ্রহ" section
  → কিস্তি number select করুন (0 = ডাউনপেমেন্ট)
  → পরিমাণ লিখুন → Payment method → "পেমেন্ট নিন"
  → রসিদ নম্বর generated: C-0001, C-0002...
পদক্ষেপ ৪: রসিদ প্রিন্ট করুন (5" × 7.5" কাগজে)
```

#### ৫" × ৭.৫" মানি রিসিট প্রিন্ট:
```
Payment নেওয়ার পর → "রিসিট প্রিন্ট" বাটন ক্লিক করুন
Browser print dialog-এ:
  → Paper size: Custom → Width: 5in, Height: 7.5in
  → Margins: Top 0.3in, Left 2in, Right 2in, Bottom 0.5in
  → Print!

রসিদে থাকবে:
  → সংগঠনের নাম, ঠিকানা, ফোন
  → গ্রাহকের নাম, আইডি, পেমেন্ট তথ্য
  → কিস্তির বিবরণ ও পরিমাণ
  → সংগ্রহকারীর নাম ও username
```

---

### গ-৫. করজে হাসানা — ৩-ধাপ অনুমোদন পাইপলাইন

```
আবেদনকারী: /dashboard → "Apply Qard-e-Hasana"
  → কারণ, পরিমাণ (সর্বোচ্চ ৳১৫,০০০), মেয়াদ (১-১২ মাস)
  → জামিনদার (সদস্য) নির্বাচন → Submit

Admin পাইপলাইন:
  ধাপ ১ — পর্যালোচনা:
    /admin/qard → আবেদন select → "পর্যালোচনায় নিন"
    (Status: APPLIED → UNDER_REVIEW)

  ধাপ ২ — অনুমোদন:
    কমিটি পর্যালোচনা → "✅ অনুমোদন করুন"
    অনুমোদিত পরিমাণ নিশ্চিত করুন
    (Status: UNDER_REVIEW → APPROVED)

  ধাপ ৩ — বিতরণ:
    বিতরণের পরিমাণ লিখুন → "💸 বিতরণ করুন"
    (Status: APPROVED → DISBURSED → ACTIVE)
    → কিস্তি schedule স্বয়ংক্রিয় তৈরি হবে
    → SMS যাবে

মাসিক পরিশোধ সংগ্রহ:
  /admin/qard → Active করজ → কিস্তি select
  → পরিমাণ → মেথড → "পরিশোধ গ্রহণ"
  → রসিদ নম্বর: QH-001, QH-002...
```

---

### গ-৬. ৬০:৩৫:৫ মুনাফা বণ্টন ব্যবস্থাপনা

#### হিসাব সূত্র:

```
Net Profit = Business Revenue − Cost of Goods − Operational Expense

বণ্টন (SystemSettings থেকে configurable):
  Member/Investor Pool = Net Profit × ৬০%
  Organization Fund   = Net Profit × ৩৫%
  Charity Fund        = Net Profit × ৫%

  + Late fee (সম্পূর্ণ) → Charity Fund (কখনো সংগঠনের আয় নয়)
```

#### ইউনিট সিস্টেম:

```
১ ইউনিট = ৳২,০০০ (configurable)
Fractional units: ৳৫,০০০ = ২.৫ ইউনিট

প্রতিটি সদস্যের share =
  (তার Weighted Capital ÷ Total Weighted Capital) × Member Pool

Weighted Capital = Total Deposit × (Active Days ÷ Period Days)
```

#### মুনাফা বণ্টন পদক্ষেপ:

```
১. /admin/accounts → Summary tab → বছরের শেষে
২. Business Revenue, Cost of Goods, Operational Expense হিসাব করুন
৩. /api/units/profit-preview (POST) → Preview দেখুন
   → প্রতিটি সদস্যের অংশ দেখাবে
৪. সবকিছু সঠিক হলে → /api/units/commit-profit (POST)
   → confirmText: "CONFIRM" দিয়ে commit করুন
5. প্রতিটি সদস্যের profitEarned automatically আপডেট হবে
6. Charity Fund-এ ৫% স্বয়ংক্রিয় জমা হবে
```

---

### গ-৭. SMS ব্রডকাস্ট পরিচালনা

#### একক SMS পাঠানো:
```
/admin/sms → "বার্তা পাঠান" tab
→ Custom Number → নম্বর লিখুন
→ বার্তা লিখুন (tokens: {name}, {amount}, {due_date})
→ Preview দেখুন → "SMS পাঠান"
```

#### গ্রুপ SMS (সবাইকে একসাথে):
```
/admin/sms → Group: "সকল সদস্য" বা "করজ গ্রহীতা"
→ Template select করুন বা custom বার্তা লিখুন
→ Token values দিন (যদি template-এ থাকে)
→ Preview দেখুন → "SMS পাঠান"
→ Confirmation popup: X জনকে পাঠানো হবে → Confirm
```

#### স্বয়ংক্রিয় SMS reminder (কিস্তির আগে):
```
ডিউ তারিখের ৫ দিন আগে system alert করে।
Admin → /admin/orders → "মেয়াদোত্তীর্ণ" filter
→ সকল due customers-কে group SMS পাঠান
→ Template: "due_reminder" ব্যবহার করুন
```

---

### গ-৮. আয়-ব্যয় হিসাব পরিচালনা

```
আয় যোগ করতে:
  /admin/accounts → "আয়" tab → "+ আয় যোগ করুন"
  → Category, Amount, Date, Payment Method
  → Save → Receipt number তৈরি: I-0001...

ব্যয় যোগ করতে:
  /admin/accounts → "ব্যয়" tab → "+ ব্যয় যোগ করুন"
  → Category, Sub-category, Amount, Date
  → Save → Receipt number তৈরি: E-0001...

Fund Transfer (একাউন্টের মধ্যে):
  /admin/accounts → "ফান্ড ট্রান্সফার" tab
  → Cash থেকে bKash-এ নিয়ে যেতে পারবেন
  → এটি Income বা Expense নয়, শুধু Transfer

হিসাব মিলানো (Reconciliation):
  /admin/accounts → "ব্যালেন্স মিলানো" tab
  → System balance vs Actual balance তুলনা
  → পার্থক্য থাকলে কারণ সহ adjustment করুন
```

---

### গ-৯. কমিটি পরিচালনা

```
চলতি কমিটি দেখতে:
  /admin/committee → "চলতি কমিটি" tab
  → সভাপতি, সম্পাদক, কোষাধ্যক্ষসহ সকলের তালিকা

নতুন কমিটি সেশন (Super Admin only):
  /admin/committee → "+ নতুন সেশন"
  → Session name, শুরুর তারিখ, শেষের তারিখ
  → Save → সদস্য যোগ করুন

অনুমোদনের নিয়ম:
  /admin/committee → "অনুমোদনের নিয়ম" tab
  → সদস্যপদ: ১ approver
  → করজ: ২ approvers
  → বড় লেনদেন: ২ approvers
  (এই rules system-এ automatically enforce হয়)
```

---

### গ-১০. Audit Log পর্যবেক্ষণ (Super Admin)

```
/admin/audit-logs (শুধুমাত্র Super Admin অ্যাক্সেস করতে পারবেন)

Filter করুন:
  → Module: members, orders, qard, accounts, settings...
  → Action: CREATE, UPDATE, DELETE, APPROVE, LOGIN...
  → Date range: যেকোনো তারিখ পরিসর
  → User ID বা Record ID দিয়ে নির্দিষ্ট রেকর্ড

প্রতিটি entry-তে দেখা যাবে:
  → কে করেছেন (User)
  → কী করেছেন (Action)
  → কোন module-এ (Module)
  → আগের মান (JSON) + নতুন মান (JSON)
  → IP address + Timestamp

এই log কেউ মুছতে বা edit করতে পারবেন না।
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ভাগ-ঘ: জরুরি তথ্য ও নিরাপত্তা
## Emergency Reference & Security
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ঘ-১. পাসওয়ার্ড ভুলে গেলে

#### Admin পাসওয়ার্ড reset (Server access থাকলে):
```bash
# cPanel Terminal-এ:
cd ~/barakah-nextjs
node -e "
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function reset() {
  const hash = await bcrypt.hash('NewPassword123', 12);
  await prisma.user.update({ where:{username:'admin'}, data:{passwordHash:hash} });
  console.log('Password reset!');
  await prisma.\$disconnect();
}
reset();
"
```

#### User পাসওয়ার্ড reset (App-এর মাধ্যমে):
```
/login → "পাসওয়ার্ড ভুলে গেছেন?" → মোবাইল নম্বর → OTP → নতুন পাসওয়ার্ড
```

---

### ঘ-২. ডাটাবেস Restore করতে হলে

```bash
# Backup থেকে restore:
cd ~/barakah-nextjs

# সর্বশেষ backup খুঁজুন:
ls -la backups/ | tail -5

# Restore করুন:
gunzip backups/backup_2026-08-01_02-00-00.sql.gz
psql -h HOST -U USER -d barakah_finance < backups/backup_2026-08-01_02-00-00.sql
```

---

### ঘ-৩. দ্রুত CLI রেফারেন্স

```bash
# ── Development ───────────────────────────────────────────
npm run dev              # Dev server চালু
npm run build            # Production build
npm start                # Production server
npx prisma studio        # DB GUI (localhost:5555)

# ── Database ──────────────────────────────────────────────
npm run db:push          # Schema sync (tables তৈরি)
npm run db:seed          # Default data insert
npm run db:generate      # Prisma client regenerate
npm run db:migrate       # Migration file তৈরি (dev)
npm run db:migrate:prod  # Migration apply (production)

# ── Backup ────────────────────────────────────────────────
node scripts/backup.js   # Manual backup (now)
```

---

### ঘ-৪. সিস্টেম স্বাস্থ্য পরীক্ষা

```
API health check:
  GET https://barakahfinancebd.com/api/public/stats
  → {"members":X, "products":Y, "orders":Z, "qard":W}

Build verification:
  .next/BUILD_ID ফাইলে current build ID আছে: sx9_oJzK3HCWoGEPmOhGe

SMS balance:
  /admin → Top right → SMS Balance widget
  (কম হলে BulkSMSBD.net-এ recharge করুন)
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## সম্পূর্ণ URL রুট ম্যাপ
## Complete Route Map
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### পাবলিক রুট (লগইন ছাড়া):

| URL | বিবরণ | Type |
|-----|-------|------|
| `/` | Landing page | Static |
| `/gallery` | গ্যালারি | Static |
| `/timeline` | টাইমলাইন | Static |
| `/learn-more` | আরও জানুন | Static |
| `/shop` | পণ্য ক্যাটালগ | Static |
| `/shop/[slug]` | Category / Product detail | Dynamic |
| `/login` | Login + Signup + OTP + Password Reset | Static |
| `/login/2fa` | TOTP 2FA verification | Static |
| `/verify` | OTP verification | Static |
| `/unauthorized` | Access denied | Static |

### Authenticated রুট:

| URL | Minimum Role | বিবরণ |
|-----|-------------|-------|
| `/apply` | USER (verified) | 5-step membership form |
| `/dashboard` | USER | Member portal |
| `/profile` | USER | Profile editor |
| `/shop/[slug]` | USER (for orders) | Product detail + order |

### Admin রুট (ADMIN / SUPER_ADMIN):

| URL | বিবরণ |
|-----|-------|
| `/admin` | Master dashboard + action center |
| `/admin/members` | সদস্য ব্যবস্থাপনা |
| `/admin/orders` | অর্ডার ও কিস্তি সংগ্রহ |
| `/admin/qard` | করজে হাসানা পাইপলাইন |
| `/admin/accounts` | আয়, ব্যয়, reconciliation |
| `/admin/products` | পণ্য ক্যাটালগ ও স্টক |
| `/admin/sms` | SMS gateway ও broadcast |
| `/admin/committee` | কমিটি ও approval rules |
| `/admin/reviews` | রিভিউ moderation |
| `/admin/audit-logs` | **Super Admin only** |

### API রুট:

| Endpoint | Method | বিবরণ |
|----------|--------|-------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth session |
| `/api/auth/signup` | POST | নিবন্ধন + OTP |
| `/api/auth/verify-otp` | POST | OTP যাচাই |
| `/api/auth/verify-2fa` | POST | TOTP 2FA check |
| `/api/auth/forgot-password` | POST | Reset OTP |
| `/api/auth/reset-password` | POST | নতুন পাসওয়ার্ড |
| `/api/auth/check-username` | GET | Username availability |
| `/api/public/notices` | GET | নোটিশ বার data |
| `/api/public/badges` | GET | Hero badge stats |
| `/api/public/reviews` | GET/POST | Reviews |
| `/api/public/calc` | POST | Installment calc |
| `/api/public/stats` | GET | Dashboard stats |
| `/api/products` | GET/POST | পণ্য list/create |
| `/api/products/[id]` | GET/PATCH/PUT/DELETE | পণ্য detail/update |
| `/api/orders` | GET/POST | অর্ডার list/create |
| `/api/orders/[id]` | GET/PATCH | অর্ডার detail |
| `/api/orders/[id]/approve` | POST | অর্ডার approve/reject |
| `/api/installments` | GET | Due installments |
| `/api/installments/collect` | POST | পেমেন্ট সংগ্রহ |
| `/api/qard` | GET/POST | করজ list/apply |
| `/api/qard/[id]` | GET | করজ detail |
| `/api/qard/[id]/approve` | POST | করজ approval pipeline |
| `/api/qard/[id]/collect` | POST | করজ পরিশোধ |
| `/api/accounts/income` | GET/POST/DELETE | আয় CRUD |
| `/api/accounts/expense` | GET/POST/DELETE | ব্যয় CRUD |
| `/api/accounts/fund-transfer` | POST | ফান্ড transfer |
| `/api/accounts/reconcile` | POST | Balance reconciliation |
| `/api/accounts/summary` | GET | Account summary |
| `/api/receipts` | GET | Receipt lookup |
| `/api/receipts/void` | POST | Receipt cancel |
| `/api/units/portfolio` | GET | Unit portfolio |
| `/api/units/profit-preview` | POST | মুনাফা preview |
| `/api/units/commit-profit` | POST | মুনাফা commit |
| `/api/sms` | GET/POST | Templates |
| `/api/sms/send` | POST | SMS broadcast |
| `/api/sms/balance` | GET | SMS balance |
| `/api/committee` | GET/POST | কমিটি CRUD |
| `/api/committee/[id]` | PATCH/DELETE | কমিটি member |
| `/api/dashboard/stats` | GET | Admin KPIs |
| `/api/audit-log` | GET | Audit trail |
| `/api/applications` | POST | Quick apply |
| `/api/member-applications` | POST | Full application |

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## চূড়ান্ত ডেপ্লয়মেন্ট চেকলিস্ট
## Final Deployment Checklist
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
PRE-DEPLOYMENT:
  □ .env.local এ সব production values সেট করা হয়েছে
  □ DATABASE_URL production PostgreSQL-এর (Neon/Railway/Supabase)
  □ NEXTAUTH_SECRET কমপক্ষে ৩২ character random string
  □ JWT_SECRET কমপক্ষে ৬৪ character random string
  □ NEXTAUTH_URL = https://barakahfinancebd.com
  □ npm run build → 0 errors confirmed ✅
  □ logo.png → public/image/logo.png-এ আছে ✅

UPLOAD:
  □ .next/ folder আপলোড হয়েছে
  □ public/ folder আপলোড হয়েছে
  □ prisma/ folder আপলোড হয়েছে
  □ scripts/ folder আপলোড হয়েছে
  □ server.js আপলোড হয়েছে
  □ package.json আপলোড হয়েছে
  □ node_modules/ আপলোড করা হয়নি ✅

SERVER SETUP:
  □ npm install --omit=dev চালানো হয়েছে
  □ npx prisma generate চালানো হয়েছে
  □ npx prisma db push চালানো হয়েছে
  □ npm run db:seed চালানো হয়েছে
  □ Node.js App configured (startup: server.js) ✅
  □ SSL certificate installed ✅
  □ HTTPS redirect enabled ✅
  □ Cron job for backup set ✅

POST-DEPLOYMENT:
  □ https://barakahfinancebd.com খুলে দেখুন
  □ /login → admin/admin1234 → login হয়েছে
  □ 2FA setup করুন (Google Authenticator)
  □ পাসওয়ার্ড পরিবর্তন করুন
  □ SMS balance check করুন
  □ Test notice bar দেখাচ্ছে
  □ Test product add করুন
```

---

*বারাকাহ ফাইন্যান্স — সুদমুক্ত লেনদেনে সমৃদ্ধি সবার*  
*Build: `sx9_oJzK3HCWoGEPmOhGe` · Pages: 23 · Routes: 42 · Models: 63 · Services: 8*
