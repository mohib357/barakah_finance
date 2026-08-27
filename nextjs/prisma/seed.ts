// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Database Seed
//  Run: npm run db:seed
//  Creates: Super Admin user, default settings, default notices,
//           default badges, SMS templates, committee session,
//           income/expense categories, pay order rules.
// ═══════════════════════════════════════════════════════════

import { PrismaClient, UserSystemRole, NoticeStyle, ProfitMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Barakah Finance database...");

  // ── 1. Super Admin user ──────────────────────────────────
  const passwordHash = await bcrypt.hash("admin1234", 12);

  const superAdmin = await prisma.user.upsert({
    where:  { username: "admin" },
    update: {},
    create: {
      id:              "SUPER-ADMIN-001",
      firstName:       "সুপার",
      firstNameEn:     "Super",
      lastName:        "অ্যাডমিন",
      lastNameEn:      "Admin",
      username:        "admin",
      phone:           "01700000000",
      email:           "admin@barakahfinance.com",
      passwordHash,
      systemRole:      UserSystemRole.SUPER_ADMIN,
      isVerified:      true,
      isActive:        true,
      profileComplete: 100,
      profile: {
        create: {
          fatherName:   "N/A",
          fatherNameEn: "N/A",
        },
      },
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.username} (password: admin1234)`);

  // ── 2. System Settings ───────────────────────────────────
  await prisma.systemSettings.upsert({
    where:  { id: "global" },
    update: {},
    create: {
      id:                    "global",
      siteName:              "বারাকাহ ফাইন্যান্স",
      siteNameEn:            "Barakah Finance",
      slogan:                "সুদমুক্ত লেনদেনে সমৃদ্ধি সবার",
      sloganEn:              "Prosperity Through Interest-Free Transactions",
      phone:                 "+8801581093611",
      email:                 "info@barakahfinance.com",
      address:               "আদিতমারী, লালমনিরহাট",
      website:               "barakahfinancebd.com",
      unitValue:             2000,
      profitMarginDefault:   10,
      defaultProfitMethod:   ProfitMethod.FINANCED_AMOUNT,
      memberProfitSharePct:  60,
      charitySharePct:       5,
      orgSharePct:           35,
      monthlySavingsAmount:  2000,
      savingsDueDay:         15,
      savingsWarnDay:        10,
      lateFeePerUnit:        100,
      installmentGraceDays:  5,
      maxQardAmount:         15000,
      maxGuarantorClients:   3,
      formFee:               100,
      registrationOpen:      true,
      usernameChangeCooldownDays: 60,
      usernameMaxChanges:    3,
      withdrawalNoticeDays:  30,
      fullWithdrawalNoticeDays: 60,
      smsApiKey:             process.env.SMS_API_KEY ?? "",
      smsApiUrl:             process.env.SMS_API_URL ?? "http://bulksmsbd.net/api/smsapi",
      smsSenderId:           process.env.SMS_SENDER_ID ?? "",
      backupEnabled:         true,
      backupIntervalHours:   1,
      backupRetentionDays:   60,
      superAdminRequires2FA: true,
      adminRequires2FA:      false,
      noticeScrollSpeed:     30,
      defaultLanguage:       "bn",
    },
  });
  console.log("✅ System settings seeded.");

  // ── 3. Default Notices ───────────────────────────────────
  const noticeCount = await prisma.notice.count();
  if (noticeCount === 0) {
    await prisma.notice.createMany({
      data: [
        {
          text:      "🌙 বারাকাহ ফাইন্যান্সে আপনাকে স্বাগতম! সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।",
          style:     NoticeStyle.BOLD,
          color:     "#0f4c2a",
          bgColor:   "#F5D061",
          isActive:  true,
          sortOrder: 1,
        },
        {
          text:      "📢 নতুন সদস্যদের জন্য বিশেষ সুবিধা: আবেদন ফি মাত্র ১০০ টাকা! আজই আবেদন করুন।",
          style:     NoticeStyle.NORMAL,
          color:     "#ffffff",
          isActive:  true,
          sortOrder: 2,
        },
        {
          text:      "💰 করজে হাসানা: আপদকালীন প্রয়োজনে বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা পর্যন্ত সহায়তা।",
          style:     NoticeStyle.ITALIC,
          color:     "#a7f3d0",
          isActive:  true,
          sortOrder: 3,
        },
      ],
    });
    console.log("✅ Default notices seeded.");
  }

  // ── 4. Default Badges ────────────────────────────────────
  const badgeCount = await prisma.badge.count();
  if (badgeCount === 0) {
    await prisma.badge.createMany({
      data: [
        { key: "members",   label: "মোট সদস্য",      labelEn: "Total Members",   icon: "👥", dataSource: "computed", isVisible: true, publicVisible: true,  sortOrder: 1 },
        { key: "savings",   label: "মোট সঞ্চয়",      labelEn: "Total Savings",   icon: "💰", dataSource: "computed", isVisible: true, publicVisible: false, sortOrder: 2 },
        { key: "loans",     label: "করজে হাসানা",    labelEn: "Qard-e-Hasana",   icon: "🤝", dataSource: "computed", isVisible: true, publicVisible: true,  sortOrder: 3 },
        { key: "services",  label: "আমাদের সেবা",    labelEn: "Our Services",    icon: "🌟", dataSource: "manual",   isVisible: true, publicVisible: true,  sortOrder: 4, value: "৩টি সেবা" },
        { key: "products",  label: "মোট পণ্য",       labelEn: "Total Products",  icon: "🛒", dataSource: "computed", isVisible: true, publicVisible: true,  sortOrder: 5 },
        { key: "orders",    label: "মোট অর্ডার",     labelEn: "Total Orders",    icon: "📦", dataSource: "computed", isVisible: true, publicVisible: false, sortOrder: 6 },
      ],
    });
    console.log("✅ Default badges seeded.");
  }

  // ── 5. SMS Templates ─────────────────────────────────────
  const smsCount = await prisma.sMSTemplate.count();
  if (smsCount === 0) {
    await prisma.sMSTemplate.createMany({
      data: [
        { name: "পেমেন্ট গ্রহণ",          category: "payment_received",    template: "প্রিয় {name}, আপনার {amount} টাকা সফলভাবে গ্রহণ করা হয়েছে। রসিদ নং: {receipt_id}। — বারাকাহ ফাইন্যান্স", isActive: true },
        { name: "কিস্তি মনে করিয়ে দেওয়া", category: "due_reminder",        template: "প্রিয় {name}, আপনার {amount} টাকার কিস্তি {due_date} তারিখে প্রদেয়। সময়মতো পরিশোধ করুন। — বারাকাহ ফাইন্যান্স", isActive: true },
        { name: "মেয়াদোত্তীর্ণ",           category: "overdue",             template: "প্রিয় {name}, আপনার {amount} টাকার কিস্তি মেয়াদোত্তীর্ণ। অতিসত্বর পরিশোধ করুন। — বারাকাহ ফাইন্যান্স", isActive: true },
        { name: "সদস্যপদ অনুমোদন",         category: "membership_approved", template: "অভিনন্দন {name}! আপনার সদস্যপদ অনুমোদিত হয়েছে। সদস্য আইডি: {member_id}। — বারাকাহ ফাইন্যান্স", isActive: true },
        { name: "করজ অনুমোদন",             category: "qard_approved",       template: "প্রিয় {name}, আপনার {amount} টাকার করজে হাসানা অনুমোদিত হয়েছে। আইডি: {qard_id}। — বারাকাহ ফাইন্যান্স", isActive: true },
        { name: "জন্মদিনের শুভেচ্ছা",      category: "birthday",            template: "প্রিয় {name}, জন্মদিনের অনেক অনেক শুভেচ্ছা! আল্লাহ আপনাকে সুস্থ ও সুখী রাখুন। — বারাকাহ ফাইন্যান্স", isActive: true },
        { name: "সাধারণ নোটিশ",            category: "notice",              template: "বারাকাহ ফাইন্যান্স: {message}", isActive: true },
      ],
    });
    console.log("✅ SMS templates seeded.");
  }

  // ── 6. Committee Session ─────────────────────────────────
  const committeeCount = await prisma.committeeSession.count();
  if (committeeCount === 0) {
    const session = await prisma.committeeSession.create({
      data: {
        sessionName:  "২০২৬-২০২৮ আহ্বায়ক কমিটি",
        sessionStart: new Date("2026-01-01"),
        sessionEnd:   new Date("2028-12-31"),
        isActive:     true,
      },
    });

    const committeeMembers = [
      { name: "জনাব সাইফুল্লাহ",                    phone: "০১৭৩৭১৩১০৯৫", designation: "সভাপতি",              sortOrder: 1 },
      { name: "মাওলানা ইমরান হোসাইন কাসেমী",         phone: "০১৩১৭১২১৮২৬", designation: "সহ-সভাপতি",           sortOrder: 2 },
      { name: "জনাব মুহিব্বুল্লাহ আজাদ",             phone: "০১৭১৭২৬৭০০৫", designation: "সাধারণ সম্পাদক",      sortOrder: 3 },
      { name: "জনাব মাসুম বিল্লাহ",                  phone: "০১৭৫০৮২৭৭৬০", designation: "যুগ্ম সম্পাদক",       sortOrder: 4 },
      { name: "জনাব আনোয়ার হোসেন সেলিম",             phone: "০১৬৪৮২৪৮০০৬", designation: "কোষাধ্যক্ষ",          sortOrder: 5 },
      { name: "জনাব আবু সুফিয়ান",                   phone: "০১৭৪৩০৬৮০৬৩", designation: "সহকারী কোষাধ্যক্ষ",   sortOrder: 6 },
      { name: "মাওলানা আব্দুল হান্নান",               phone: "০১৩০৮৭৫৭৬৯২", designation: "শরিয়াহ পরামর্শক",    sortOrder: 7 },
    ];

    for (const cm of committeeMembers) {
      await prisma.committeeMember.create({
        data: { sessionId: session.id, ...cm },
      });
    }
    console.log("✅ Committee session and members seeded.");
  }

  // ── 7. Income categories ─────────────────────────────────
  const incomeCatCount = await prisma.incomeCategory.count();
  if (incomeCatCount === 0) {
    await prisma.incomeCategory.createMany({
      data: [
        { name: "মাসিক সঞ্চয়",       description: "সদস্যদের মাসিক সঞ্চয়" },
        { name: "এককালীন বিনিয়োগ",  description: "এককালীন বিনিয়োগ সংগ্রহ" },
        { name: "কিস্তি সংগ্রহ",      description: "পণ্য কিস্তির পেমেন্ট" },
        { name: "করজ পরিশোধ",         description: "করজে হাসানা ফেরত" },
        { name: "ফরম ফি",              description: "সদস্যপদ আবেদন ফি" },
        { name: "অনুদান",              description: "চ্যারিটি অনুদান" },
        { name: "অন্যান্য আয়",        description: "বিবিধ আয়" },
      ],
    });
    console.log("✅ Income categories seeded.");
  }

  // ── 8. Expense categories ────────────────────────────────
  const expenseCatCount = await prisma.expenseCategory.count();
  if (expenseCatCount === 0) {
    const officeExpense = await prisma.expenseCategory.create({
      data: { name: "অফিস ব্যয়", description: "অফিস পরিচালনা খরচ" },
    });
    await prisma.expenseCategory.createMany({
      data: [
        { name: "ভাড়া",           parentId: officeExpense.id },
        { name: "ইন্টারনেট ও ফোন", parentId: officeExpense.id },
        { name: "অফিস সরঞ্জাম",   parentId: officeExpense.id },
      ],
    });

    await prisma.expenseCategory.createMany({
      data: [
        { name: "বেতন ও ভাতা",    description: "কর্মচারীদের বেতন" },
        { name: "যাতায়াত খরচ",   description: "পরিবহন ও যাতায়াত" },
        { name: "করজ বিতরণ",      description: "করজে হাসানা বিতরণ" },
        { name: "পণ্য ক্রয়",     description: "পণ্য ক্রয়ের খরচ" },
        { name: "চ্যারিটি বিতরণ", description: "চ্যারিটি খরচ" },
        { name: "ব্যাংক চার্জ",  description: "ব্যাংক ও মোবাইল ব্যাংকিং চার্জ" },
        { name: "অন্যান্য ব্যয়", description: "বিবিধ ব্যয়" },
      ],
    });
    console.log("✅ Expense categories seeded.");
  }

  // ── 9. Pay Order Rules ───────────────────────────────────
  const payRuleCount = await prisma.payOrderRule.count();
  if (payRuleCount === 0) {
    await prisma.payOrderRule.createMany({
      data: [
        { name: "ফরম ফি",         description: "সদস্যপদ আবেদন ফি",  amount: 100,  isRecurring: false, period: "once",    isActive: true },
        { name: "মাসিক সঞ্চয়",   description: "প্রতি মাসে সঞ্চয়",  amount: 2000, isRecurring: true,  period: "monthly", isActive: true },
        { name: "এককালীন বিনিয়োগ", description: "এককালীন বিনিয়োগ", amount: 0,    isRecurring: false, period: "once",    isActive: true },
      ],
    });
    console.log("✅ Pay order rules seeded.");
  }

  // ── 10. Financial Accounts ───────────────────────────────
  const accountCount = await prisma.financialAccount.count();
  if (accountCount === 0) {
    await prisma.financialAccount.createMany({
      data: [
        { name: "ক্যাশ",         accountType: "cash",          openingBalance: 0, currentBalance: 0, sortOrder: 1 },
        { name: "বিকাশ",         accountType: "mobile_banking", openingBalance: 0, currentBalance: 0, sortOrder: 2 },
        { name: "নগদ",           accountType: "mobile_banking", openingBalance: 0, currentBalance: 0, sortOrder: 3 },
        { name: "রকেট",          accountType: "mobile_banking", openingBalance: 0, currentBalance: 0, sortOrder: 4 },
        { name: "ব্যাংক একাউন্ট", accountType: "bank",           openingBalance: 0, currentBalance: 0, sortOrder: 5 },
      ],
    });
    console.log("✅ Financial accounts seeded.");
  }

  // ── 11. Committee Rules ──────────────────────────────────
  const ruleCount = await prisma.committeeRule.count();
  if (ruleCount === 0) {
    await prisma.committeeRule.createMany({
      data: [
        { name: "সদস্যপদ অনুমোদন",   appliesTo: "membership",        requiresApproval: true, minApprovers: 1, isActive: true },
        { name: "করজ অনুমোদন",       appliesTo: "qard",              requiresApproval: true, minApprovers: 2, isActive: true },
        { name: "বড় লেনদেন অনুমোদন", appliesTo: "large_transaction", requiresApproval: true, minApprovers: 2, isActive: true },
        { name: "প্রজেক্ট অনুমোদন",  appliesTo: "project",           requiresApproval: true, minApprovers: 2, isActive: true },
        { name: "বিনিয়োগ অনুমোদন",  appliesTo: "investment",        requiresApproval: true, minApprovers: 1, isActive: true },
      ],
    });
    console.log("✅ Committee rules seeded.");
  }

  console.log("\n✨ Seeding complete!");
  console.log("━".repeat(50));
  console.log("  Super Admin login:");
  console.log("  Username: admin");
  console.log("  Password: admin1234");
  console.log("  ⚠️  Change the password immediately after first login.");
  console.log("━".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
