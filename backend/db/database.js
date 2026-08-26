// C:\Project\Barakah_Finance\backend\db\database.js

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'data.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

// ── ডিফল্ট ডেটা স্ট্রাকচার ──
db.defaults({
    users: [],
    members: [],          // member-specific data linked to users
    clients: [],          // product installment clients
    installments: [],     // installment schedule per client
    payments: [],         // all payment transactions
    receipts: [],         // receipt registry (immutable)
    savings: [],
    loans: [],            // qard-e-hasana
    qard_apps: [],        // qard applications
    orders: [],
    products: [],
    projects: [],
    assets: [],           // fixed assets
    charity_fundraising: [],
    charity_expenditure: [],
    charity_apps: [],     // charity applications from public
    committee: [],
    committee_history: [],
    sms_records: [],
    sms_recharge: [],
    sms_templates: [],
    notices: [],
    badges: [],
    applications: [],     // membership applications
    reviews: [],          // public reviews
    posts: [],            // timeline posts
    gallery: { photos: [], videos: [], events: [] },
    income: [],           // other income entries
    expense: [],          // expense entries
    fund_transfers: [],   // fund-to-fund transfers
    ledger: [],
    audit_log: [],        // global audit trail
    permissions: {},      // user/role permission matrix
    pay_order_rules: [],  // payment rule templates
    pay_orders: [],       // assigned pay orders
    profit_distributions: [],  // profit distribution history
    withdrawal_requests: [],   // member withdrawal requests
    settings: {
        siteName: 'বারাকাহ ফাইন্যান্স',
        slogan: 'সুদমুক্ত লেনদেনে সমৃদ্ধি সবার',
        phone: '+8801581093611',
        email: 'info@barakahfinance.com',
        address: 'আদিতমারী, লালমনিরহাট',
        website: 'barakahfinancebd.com',
        monthlySavings: 2000,
        lateFee: 100,        // per unit per month
        profitMargin: 10,    // percent
        maxLoan: 15000,
        unitValue: 2000,     // 1 unit = 2000 BDT
        registrationOpen: true,
        noticeSpeed: 30,
        savingsDueDay: 15,   // due by this date each month
        savingsWarnDay: 10,  // show warning from this day
        installmentGraceDays: 5, // days before due to show warning
        memberProfitShare: 60,   // percent of net profit to members
        charityShare: 5,
        orgShare: 35,
        formFee: 100,
        maxGuarantors: 3,    // max clients one member can guarantee
        withdrawalNoticeDays: 30,
        fbPageUrl: '',
        smsApiKey: 'PEORenxMbnajRYOPGnsD',
        smsApiUrl: 'http://bulksmsbd.net/api/smsapi',
        smsSenderId: '8809617611021',
        twoFAEnabled: false,
        backupEnabled: true,
        backupIntervalHours: 1,
        backupRetentionDays: 60,
    },
    otp_store: [],
    username_history: []
}).write();

const bcrypt = require('bcryptjs');

// ── ডিফল্ট সুপার অ্যাডমিন ──
if (db.get('users').find({ role: 'admin' }).value() === undefined) {
    const hash = bcrypt.hashSync('admin1234', 10);
    db.get('users').push({
        id: 'ADMIN-001',
        name: 'সুপার অ্যাডমিন',
        username: 'admin',
        phone: '01700000000',
        email: 'admin@barakah.com',
        password: hash,
        role: 'admin',
        verified: true,
        memberID: 'BF-ADMIN',
        profileComplete: 100,
        createdAt: new Date().toISOString()
    }).write();
    console.log('✅ ডিফল্ট অ্যাডমিন তৈরি। password: admin1234');
}

// ── ডিফল্ট নোটিশ ──
if (db.get('notices').value().length === 0) {
    db.get('notices').push(
        { id: uuidv4(), text: '🌙 বারাকাহ ফাইন্যান্সে আপনাকে স্বাগতম! সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।', style: 'bold', color: '#F5D061', active: true, createdAt: new Date().toISOString() },
        { id: uuidv4(), text: '📢 নতুন সদস্যদের জন্য বিশেষ সুবিধা: আবেদন ফি মাত্র ১০০ টাকা!', style: 'normal', color: '#fff', active: true, createdAt: new Date().toISOString() },
        { id: uuidv4(), text: '💰 করজে হাসানা: বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা পর্যন্ত সহায়তা।', style: 'italic', color: '#a7f3d0', active: true, createdAt: new Date().toISOString() }
    ).write();
}

// ── ডিফল্ট ব্যাজ ──
if (db.get('badges').value().length === 0) {
    db.get('badges').push(
        { id: uuidv4(), key: 'members', label: 'মোট সদস্য', icon: '👥', show: true, clickable: true, publicVisible: true },
        { id: uuidv4(), key: 'savings', label: 'মোট সঞ্চয়', icon: '💰', show: true, clickable: true, publicVisible: false },
        { id: uuidv4(), key: 'loans', label: 'করজে হাসানা', icon: '🤝', show: true, clickable: true, publicVisible: true },
        { id: uuidv4(), key: 'services', label: 'আমাদের সেবা', icon: '🌟', show: true, clickable: true, publicVisible: true }
    ).write();
}

// ── ডিফল্ট পণ্য ──
if (db.get('products').value().length === 0) {
    db.get('products').push(
        { id: 'p1', name: 'Samsung Galaxy A15', category: 'মোবাইল', price: 18000, emoji: '📱', description: '৬.৫ ইঞ্চি AMOLED ডিসপ্লে, ৫০০০mAh ব্যাটারি, ১২৮GB।', inStock: true, featured: true, images: [], createdAt: new Date().toISOString() },
        { id: 'p2', name: 'Walton রেফ্রিজারেটর ২৫০L', category: 'ইলেকট্রনিক্স', price: 35000, emoji: '🧊', description: 'ডাবল ডোর, A++ রেটিং।', inStock: true, featured: true, images: [], createdAt: new Date().toISOString() },
        { id: 'p3', name: 'Hero Splendor Plus', category: 'মোটরযান', price: 125000, emoji: '🏍️', description: '১০০cc ইঞ্জিন, ৮০+ কিমি মাইলেজ।', inStock: false, featured: false, images: [], createdAt: new Date().toISOString() },
        { id: 'p4', name: 'Singer সেলাই মেশিন', category: 'গৃহস্থালি', price: 12000, emoji: '🧵', description: 'ইলেকট্রিক, ১৫ প্যাটার্ন।', inStock: true, featured: true, images: [], createdAt: new Date().toISOString() }
    ).write();
}

// ── ডিফল্ট SMS টেমপ্লেট ──
if (db.get('sms_templates').value().length === 0) {
    db.get('sms_templates').push(
        { id: uuidv4(), category: 'payment_received', name: 'পেমেন্ট গ্রহণ', template: 'প্রিয় {name}, আপনার {amount} টাকা সফলভাবে গ্রহণ করা হয়েছে। রসিদ নং: {receipt_id}। ধন্যবাদ। — বারাকাহ ফাইন্যান্স', active: true },
        { id: uuidv4(), category: 'due_reminder', name: 'কিস্তি মনে করিয়ে দেওয়া', template: 'প্রিয় {name}, আপনার {amount} টাকার কিস্তি {due_date} তারিখে প্রদেয়। সময়মতো পরিশোধ করুন। — বারাকাহ ফাইন্যান্স', active: true },
        { id: uuidv4(), category: 'membership_approved', name: 'সদস্যপদ অনুমোদন', template: 'অভিনন্দন {name}! আপনার সদস্যপদ অনুমোদিত হয়েছে। সদস্য আইডি: {member_id}। — বারাকাহ ফাইন্যান্স', active: true },
        { id: uuidv4(), category: 'overdue', name: 'মেয়াদোত্তীর্ণ', template: 'প্রিয় {name}, আপনার {amount} টাকার কিস্তি মেয়াদোত্তীর্ণ হয়েছে। অতিসত্বর পরিশোধ করুন। — বারাকাহ ফাইন্যান্স', active: true }
    ).write();
}

// ── ডিফল্ট কমিটি ──
if (db.get('committee').value().length === 0) {
    const committeeData = [
        { name: 'জনাব সাইফুল্লাহ', phone: '০১৭৩৭১৩১০৯৫', role: 'সভাপতি', order: 1 },
        { name: 'মাওলানা ইমরান হোসাইন কাসেমী', phone: '০১৩১৭১২১৮২৬', role: 'সহ-সভাপতি', order: 2 },
        { name: 'জনাব মুহিব্বুল্লাহ আজাদ', phone: '০১৭১৭২৬৭০০৫', role: 'সাধারণ সম্পাদক', order: 3 },
        { name: 'জনাব মাসুম বিল্লাহ', phone: '০১৭৫০৮২৭৭৬০', role: 'যুগ্ম সম্পাদক', order: 4 },
        { name: 'জনাব আনোয়ার হোসেন সেলিম', phone: '০১৬৪৮২৪৮০০৬', role: 'কোষাধ্যক্ষ', order: 5 },
        { name: 'জনাব আবু সুফিয়ান', phone: '০১৭৪৩০৬৮০৬৩', role: 'সহকারী কোষাধ্যক্ষ', order: 6 },
        { name: 'মাওলানা আব্দুল হান্নান', phone: '০১৩০৮৭৫৭৬৯২', role: 'শরিয়াহ পরামর্শক', order: 7 },
    ];
    committeeData.forEach(m => {
        db.get('committee').push({
            id: uuidv4(), ...m, status: 'active',
            sessionStart: '2026-01-01', sessionEnd: '2028-12-31',
            createdAt: new Date().toISOString()
        }).write();
    });
}

// ── ডিফল্ট pay_order_rules ──
if (db.get('pay_order_rules').value().length === 0) {
    db.get('pay_order_rules').push(
        { id: uuidv4(), name: 'আবেদন ফি', description: 'সদস্যপদ আবেদন ফি', amount: 100, isRecurring: false, active: true },
        { id: uuidv4(), name: 'মাসিক সঞ্চয়', description: 'মাসিক সঞ্চয় জমা', amount: 2000, isRecurring: true, period: 'monthly', active: true },
        { id: uuidv4(), name: 'এককালীন বিনিয়োগ', description: 'এককালীন বিনিয়োগ', amount: 0, isRecurring: false, active: true }
    ).write();
}

module.exports = { db, uuidv4 };
