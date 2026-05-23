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
    savings: [],
    loans: [],
    orders: [],
    products: [],
    notices: [],
    badges: [],
    applications: [],
    ledger: [],
    settings: {
        siteName: 'বারাকাহ ফাইন্যান্স',
        slogan: 'সুদমুক্ত লেনদেনে সমৃদ্ধি সবার',
        phone: '+8801581093611',
        address: 'আদিতমারী, লালমনিরহাট',
        monthlySavings: 2000,
        lateFee: 100,
        profitMargin: 10,
        maxLoan: 15000,
        registrationOpen: true,
        noticeSpeed: 30
    },
    otp_store: []
}).write();

// ── ডিফল্ট অ্যাডমিন তৈরি ──
const bcrypt = require('bcryptjs');
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
    console.log('✅ ডিফল্ট অ্যাডমিন তৈরি হয়েছে। password: admin1234');
}

// ── ডিফল্ট নোটিশ ──
if (db.get('notices').value().length === 0) {
    db.get('notices').push(
        { id: uuidv4(), text: '🌙 বারাকাহ ফাইন্যান্সে আপনাকে স্বাগতম! সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।', style: 'bold', color: '#F5D061', active: true },
        { id: uuidv4(), text: '📢 নতুন সদস্যদের জন্য বিশেষ সুবিধা: আবেদন ফি মাত্র ১০০ টাকা!', style: 'normal', color: '#fff', active: true },
        { id: uuidv4(), text: '💰 করজে হাসানা: বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা পর্যন্ত সহায়তা।', style: 'italic', color: '#a7f3d0', active: true }
    ).write();
}

// ── ডিফল্ট ব্যাজ ──
if (db.get('badges').value().length === 0) {
    db.get('badges').push(
        { id: uuidv4(), key: 'members', label: 'মোট সদস্য', icon: '👥', show: true, clickable: true },
        { id: uuidv4(), key: 'savings', label: 'মোট সঞ্চয়', icon: '💰', show: true, clickable: true },
        { id: uuidv4(), key: 'loans', label: 'করজে হাসানা', icon: '🤝', show: true, clickable: true },
        { id: uuidv4(), key: 'services', label: 'আমাদের সেবা', icon: '🌟', show: true, clickable: true }
    ).write();
}

// ── ডিফল্ট পণ্য ──
if (db.get('products').value().length === 0) {
    db.get('products').push(
        { id: 'p1', name: 'Samsung Galaxy A15', category: 'মোবাইল', price: 18000, emoji: '📱', description: '৬.৫ ইঞ্চি AMOLED ডিসপ্লে, ৫০০০mAh ব্যাটারি, ১২৮GB।', inStock: true, featured: true, images: [] },
        { id: 'p2', name: 'Walton রেফ্রিজারেটর ২৫০L', category: 'ইলেকট্রনিক্স', price: 35000, emoji: '🧊', description: 'ডাবল ডোর, A++ রেটিং, বিদ্যুৎ সাশ্রয়ী।', inStock: true, featured: true, images: [] },
        { id: 'p3', name: 'Hero Splendor Plus', category: 'মোটরযান', price: 125000, emoji: '🏍️', description: '১০০cc ইঞ্জিন, ৮০+ কিমি মাইলেজ।', inStock: false, featured: false, images: [] },
        { id: 'p4', name: 'Singer সেলাই মেশিন', category: 'গৃহস্থালি', price: 12000, emoji: '🧵', description: 'ইলেকট্রিক, ১৫ প্যাটার্ন।', inStock: true, featured: true, images: [] }
    ).write();
}

module.exports = { db, uuidv4 };