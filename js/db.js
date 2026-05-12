// C:\Project\Barakah_Finance\js\db.js

// ════════ DB MODULE ════════
const DB = {
    KEYS: {
        USERS: 'bf_users',
        SESSION: 'bf_session',
        NOTICES: 'bf_notices',
        PRODUCTS: 'bf_products',
        APPS: 'bf_applications',
        ORDERS: 'bf_orders',
        BADGES: 'bf_badges',
        SETTINGS: 'bf_site_settings',
        SAVINGS: 'bf_savings',
        LOANS: 'bf_loans',
        OTP: 'bf_otp_temp',
    },

    get(key) {
        try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
    },
    set(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    },
    push(key, item) {
        const arr = this.get(key) || [];
        arr.push(item);
        this.set(key, arr);
        return arr;
    },
    update(key, id, patch) {
        const arr = this.get(key) || [];
        const idx = arr.findIndex(x => x.id === id);
        if (idx >= 0) { arr[idx] = { ...arr[idx], ...patch }; this.set(key, arr); }
        return arr[idx];
    },
    remove(key, id) {
        const arr = (this.get(key) || []).filter(x => x.id !== id);
        this.set(key, arr);
    },

    // ════════ USERS ════════
    getUsers() { return this.get(this.KEYS.USERS) || []; },
    saveUsers(u) { this.set(this.KEYS.USERS, u); },
    findUser(query) {
        const users = this.getUsers();
        const q = query.toLowerCase().replace(/\s/g, '');
        return users.find(u =>
            u.phone === q || u.email?.toLowerCase() === q ||
            u.username?.toLowerCase() === q ||
            u.memberID?.toLowerCase() === q
        );
    },
    addUser(user) {
        const users = this.getUsers();
        users.push(user);
        this.saveUsers(users);
        return user;
    },

    // ════════ Session ════════
    getSession() { return this.get(this.KEYS.SESSION); },
    setSession(u) { this.set(this.KEYS.SESSION, u); },
    clearSession() { localStorage.removeItem(this.KEYS.SESSION); },
    isLoggedIn() { return !!this.getSession(); },

    // ════════ Notices ════════
    getNotices() { return this.get(this.KEYS.NOTICES) || DEFAULT_NOTICES; },
    saveNotices(n) { this.set(this.KEYS.NOTICES, n); },

    // ════════ Products ════════
    getProducts() { return this.get(this.KEYS.PRODUCTS) || DEFAULT_PRODUCTS; },
    saveProducts(p) { this.set(this.KEYS.PRODUCTS, p); },

    // ════════ Orders ════════
    getOrders() { return this.get(this.KEYS.ORDERS) || []; },
    addOrder(o) { return this.push(this.KEYS.ORDERS, o); },

    // ════════ Badges ════════
    getBadges() { return this.get(this.KEYS.BADGES) || DEFAULT_BADGES; },
    saveBadges(b) { this.set(this.KEYS.BADGES, b); },

    // ════════ Settings ════════
    getSettings() { return this.get(this.KEYS.SETTINGS) || DEFAULT_SETTINGS; },
    saveSetting(k, v) { const s = this.getSettings(); s[k] = v; this.set(this.KEYS.SETTINGS, s); },

    // ════════ Savings ledger ════════
    getSavings() { return this.get(this.KEYS.SAVINGS) || []; },
    addSaving(s) { return this.push(this.KEYS.SAVINGS, s); },

    // ════════ Loans ════════
    getLoans() { return this.get(this.KEYS.LOANS) || []; },
    addLoan(l) { return this.push(this.KEYS.LOANS, l); },

    // ════════ OTP (demo — in real app use server) ════════
    setOTP(phone, code) {
        this.set(this.KEYS.OTP, { phone, code, exp: Date.now() + 5 * 60 * 1000 });
    },
    verifyOTP(phone, code) {
        const o = this.get(this.KEYS.OTP);
        if (!o) return false;
        if (o.phone !== phone) return false;
        if (Date.now() > o.exp) return false;
        return String(o.code) === String(code);
    },

    // ════════ Helpers ════════
    genID(prefix = 'BF') {
        return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    },
    genUsername(name) {
        const clean = name.replace(/\s+/g, '').toLowerCase().replace(/[^\w]/g, '').slice(0, 10);
        let u = clean || 'user';
        let n = 1;
        while (this.getUsers().find(x => x.username === u)) { u = clean + n; n++; }
        return u;
    },
    checkUsername(uname) {
        return !this.getUsers().find(x => x.username === uname);
    },
};

// ════════ Default Data ════════
const DEFAULT_NOTICES = [
    { id: 'n1', text: '🌙 বারাকাহ ফাইন্যান্সে আপনাকে স্বাগতম! সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।', style: 'bold', color: '#F5D061', active: true },
    { id: 'n2', text: '📢 নতুন সদস্যদের জন্য বিশেষ সুবিধা: আবেদন ফি মাত্র ১০০ টাকা! আজই আবেদন করুন।', style: 'normal', color: '#fff', active: true },
    { id: 'n3', text: '💰 করজে হাসানা: আপদকালীন প্রয়োজনে বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা পর্যন্ত সহায়তা।', style: 'italic', color: '#a7f3d0', active: true },
];

// ════════ DATA & TRANSLATIONS ════════
const DEFAULT_PRODUCTS = [
    { id: 'p1', name: 'Samsung Galaxy A15', category: 'মোবাইল', price: 18000, images: [], description: '৬.৫ ইঞ্চি ডিসপ্লে, ৫০০০ mAh ব্যাটারি, ১২৮GB স্টোরেজ সহ স্যামসাং গ্যালাক্সি A15।', inStock: true, featured: true },
    { id: 'p2', name: 'Walton রেফ্রিজারেটর ২৫০L', category: 'ইলেকট্রনিক্স', price: 35000, images: [], description: 'ওয়ালটন ২৫০ লিটার ডাবল ডোর রেফ্রিজারেটর। বিদ্যুৎ সাশ্রয়ী।', inStock: true, featured: true },
    { id: 'p3', name: 'Hero Splendor Plus মোটরসাইকেল', category: 'মোটরযান', price: 125000, images: [], description: 'হিরো স্প্লেন্ডার প্লাস — জ্বালানি সাশ্রয়ী ১০০cc ইঞ্জিন।', inStock: false, featured: false },
    { id: 'p4', name: 'Singer সেলাই মেশিন', category: 'গৃহস্থালি', price: 12000, images: [], description: 'সিঙ্গার ইলেকট্রিক সেলাই মেশিন — গৃহিণীদের জন্য আদর্শ।', inStock: true, featured: true },
];

const DEFAULT_BADGES = [
    { id: 'b1', key: 'members', label: 'মোট সদস্য', icon: '👥', show: true, clickable: true, target: '#members' },
    { id: 'b2', key: 'savings', label: 'মোট সঞ্চয়', icon: '💰', show: true, clickable: true, target: '#savings-detail' },
    { id: 'b3', key: 'loans', label: 'করজে হাসানা', icon: '🤝', show: true, clickable: true, target: '#loans-detail' },
    { id: 'b4', key: 'services', label: 'আমাদের সেবা', icon: '🌟', show: true, clickable: true, target: '#services-detail' },
];

const DEFAULT_SETTINGS = {
    siteName: 'বারাকাহ ফাইন্যান্স',
    slogan: 'সুদমুক্ত লেনদেনে সমৃদ্ধি সবার',
    phone: '+8801581093611',
    address: 'আদিতমারী, লালমনিরহাট',
    noticeSpeed: 30, // px/sec
    darkMode: false,
    registrationOpen: true,
    monthlySavings: 2000,
    lateFee: 100,
    profitMargin: 10,
    maxLoan: 15000,
};

// ════════ Seed demo admin if none exists ════════
(function seedAdmin() {
    const users = DB.getUsers();
    if (!users.find(u => u.role === 'admin')) {
        DB.addUser({
            id: 'ADMIN-001',
            name: 'সুপার অ্যাডমিন',
            username: 'admin',
            phone: '01700000000',
            email: 'admin@barakah.com',
            password: 'admin1234', // plain for demo; hash in production
            role: 'admin',
            verified: true,
            createdAt: new Date().toISOString(),
            profileComplete: 100,
            memberID: 'BF-ADMIN',
        });
    }
})();

// ════════ USER UPDATE & GET (used in admin panel) ════════
DB.updateUser = function (id, patch) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users[index] = { ...users[index], ...patch };
        this.saveUsers(users);
        return users[index];
    }
    return null;
};

DB.getUser = function (id) {
    return this.getUsers().find(u => u.id === id);
};