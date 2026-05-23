// C:\Project\Barakah_Finance\js\api.js

const API_BASE = 'http://localhost:3001/api';

// ── টোকেন ম্যানেজমেন্ট ──
const Token = {
    get: () => localStorage.getItem('bf_token'),
    set: (t) => localStorage.setItem('bf_token', t),
    clear: () => localStorage.removeItem('bf_token'),
    headers: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('bf_token') || ''}`
    })
};

// ── সার্ভার সংযুক্ত কিনা চেক ──
let serverOnline = false;
async function checkServer() {
    try {
        const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
        serverOnline = r.ok;
    } catch {
        serverOnline = false;
    }
    return serverOnline;
}

// ── মূল API ফাংশন ──
async function apiFetch(path, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: Token.headers(),
            ...options
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API সমস্যা');
        return data;
    } catch (err) {
        if (err.name === 'TypeError') {
            // সার্ভার অফলাইন — localStorage ফলব্যাক
            console.warn('[API] সার্ভার অফলাইন, localStorage ব্যবহার করা হচ্ছে');
            serverOnline = false;
            return null;
        }
        throw err;
    }
}

// ════════ AUTH API ════════
const AuthAPI = {
    async login(identifier, password) {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });
        if (data) { Token.set(data.token); DB.setSession(data.user); }
        return data;
    },

    async signup(userData) {
        return await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
    },

    async verifyOTP(phone, otp) {
        const data = await apiFetch('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp })
        });
        if (data) { Token.set(data.token); DB.setSession(data.user); }
        return data;
    },

    async resendOTP(phone) {
        return await apiFetch('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ phone }) });
    },

    async checkUsername(username) {
        const data = await apiFetch(`/auth/check-username/${username}`);
        return data?.available ?? true;
    },

    async me() {
        return await apiFetch('/auth/me');
    },

    logout() {
        Token.clear();
        DB.clearSession();
    }
};

// ════════ USERS API ════════
const UsersAPI = {
    async getAll() { return await apiFetch('/users'); },
    async get(id) { return await apiFetch(`/users/${id}`); },
    async update(id, data) { return await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    async changeRole(id, role) { return await apiFetch(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }); },
    async setMemberID(id, memberID) { return await apiFetch(`/users/${id}/member-id`, { method: 'PATCH', body: JSON.stringify({ memberID }) }); },
    async searchReferral(q) { return await apiFetch(`/users/search/referral?q=${q}`); },
    async stats() { return await apiFetch('/users/stats/summary'); }
};

// ════════ SAVINGS API ════════
const SavingsAPI = {
    async getAll() { return await apiFetch('/savings'); },
    async getUser(userId) { return await apiFetch(`/savings/user/${userId}`); },
    async add(data) { return await apiFetch('/savings', { method: 'POST', body: JSON.stringify(data) }); },
    async update(id, data) { return await apiFetch(`/savings/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    async delete(id) { return await apiFetch(`/savings/${id}`, { method: 'DELETE' }); },
    async monthlyReport(year) { return await apiFetch(`/savings/report/monthly?year=${year}`); },
    async getMissing(month) { return await apiFetch(`/savings/missing/${month}`); }
};

// ════════ LOANS API ════════
const LoansAPI = {
    async getAll() { return await apiFetch('/loans'); },
    async getUser(userId) { return await apiFetch(`/loans/user/${userId}`); },
    async apply(data) { return await apiFetch('/loans', { method: 'POST', body: JSON.stringify(data) }); },
    async updateStatus(id, status) { return await apiFetch(`/loans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); },
    async addPayment(id, amount, note) { return await apiFetch(`/loans/${id}/payment`, { method: 'POST', body: JSON.stringify({ amount, note }) }); },
    async delete(id) { return await apiFetch(`/loans/${id}`, { method: 'DELETE' }); }
};

// ════════ LEDGER API ════════
const LedgerAPI = {
    async getAll(filters = {}) {
        const q = new URLSearchParams(filters).toString();
        return await apiFetch(`/ledger?${q}`);
    },
    async addEntry(data) { return await apiFetch('/ledger', { method: 'POST', body: JSON.stringify(data) }); },
    async delete(id) { return await apiFetch(`/ledger/${id}`, { method: 'DELETE' }); },
    async balanceSheet() { return await apiFetch('/ledger/balance-sheet'); },
    async monthlySummary(year) { return await apiFetch(`/ledger/monthly-summary?year=${year}`); }
};

// ════════ REPORTS API ════════
const ReportsAPI = {
    async dashboard() { return await apiFetch('/reports/dashboard'); },
    async memberSavings() { return await apiFetch('/reports/member-savings'); },
    async defaulters(month) { return await apiFetch(`/reports/defaulters/${month}`); },
    async loanSummary() { return await apiFetch('/reports/loan-summary'); },
    async getSettings() { return await apiFetch('/reports/settings'); },
    async updateSettings(data) { return await apiFetch('/reports/settings', { method: 'PUT', body: JSON.stringify(data) }); }
};

// ════════ NOTICES API ════════
const NoticesAPI = {
    async getAll() {
        const data = await apiFetch('/notices');
        return data || DB.getNotices(); // ফলব্যাক
    },
    async add(data) { return await apiFetch('/notices', { method: 'POST', body: JSON.stringify(data) }); },
    async update(id, data) { return await apiFetch(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    async delete(id) { return await apiFetch(`/notices/${id}`, { method: 'DELETE' }); }
};

// ════════ BADGES API ════════
const BadgesAPI = {
    async getAll() {
        const data = await apiFetch('/badges');
        return data || DB.getBadges();
    },
    async add(data) { return await apiFetch('/badges', { method: 'POST', body: JSON.stringify(data) }); },
    async update(id, data) { return await apiFetch(`/badges/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    async delete(id) { return await apiFetch(`/badges/${id}`, { method: 'DELETE' }); }
};

// ════════ PRODUCTS API ════════
const ProductsAPI = {
    async getAll() {
        const data = await apiFetch('/products');
        return data || DB.getProducts();
    },
    async add(data) { return await apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }); },
    async update(id, data) { return await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    async delete(id) { return await apiFetch(`/products/${id}`, { method: 'DELETE' }); }
};

// ════════ ORDERS API ════════
const OrdersAPI = {
    async getAll() { return await apiFetch('/orders'); },
    async getByPhone(phone) { return await apiFetch(`/orders/user/${phone}`); },
    async submit(data) {
        const res = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) });
        if (!res) {
            // ফলব্যাক: localStorage
            const o = { id: 'ORD-' + Date.now().toString(36).toUpperCase(), ...data, status: 'pending', statusStep: 0, submittedAt: new Date().toISOString() };
            DB.addOrder(o);
            return o;
        }
        return res;
    },
    async update(id, data) { return await apiFetch(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
    async delete(id) { return await apiFetch(`/orders/${id}`, { method: 'DELETE' }); }
};

// ════════ APPLICATIONS API ════════
const ApplicationsAPI = {
    async getAll() { return await apiFetch('/applications'); },
    async submit(data) {
        const res = await apiFetch('/applications', { method: 'POST', body: JSON.stringify(data) });
        if (!res) {
            // ফলব্যাক
            const app = { id: 'BF-' + Date.now().toString(36).toUpperCase(), ...data, status: 'pending', submittedAt: new Date().toISOString() };
            const existing = JSON.parse(localStorage.getItem('bf_applications') || '[]');
            existing.push(app);
            localStorage.setItem('bf_applications', JSON.stringify(existing));
            return app;
        }
        return res;
    },
    async update(id, data) { return await apiFetch(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
};

// ════════ SYNC: localStorage → সার্ভার ════════
// সার্ভার অনলাইন হলে পুরনো localStorage ডেটা সিঙ্ক করুন
async function syncLocalToServer() {
    if (!serverOnline || !Token.get()) return;

    // সঞ্চয় সিঙ্ক
    const savings = DB.getSavings();
    if (savings.length > 0) {
        console.log(`[SYNC] ${savings.length} টি সঞ্চয় এন্ট্রি পাওয়া গেছে (ম্যানুয়ালি সিঙ্ক করুন)`);
    }
}

// ── পেজ লোডে সার্ভার চেক ──
document.addEventListener('DOMContentLoaded', async () => {
    const online = await checkServer();
    if (online) {
        console.log('✅ সার্ভার সংযুক্ত — API মোড চালু');
        // সার্ভার থেকে সেশন রিফ্রেশ
        if (Token.get()) {
            const user = await AuthAPI.me();
            if (user) DB.setSession(user);
        }
    } else {
        console.log('⚠️ সার্ভার অফলাইন — localStorage মোড চালু');
    }
});

// ── গ্লোবাল এক্সপোর্ট ──
window.BF = {
    API: { Auth: AuthAPI, Users: UsersAPI, Savings: SavingsAPI, Loans: LoansAPI, Ledger: LedgerAPI, Reports: ReportsAPI, Notices: NoticesAPI, Badges: BadgesAPI, Products: ProductsAPI, Orders: OrdersAPI, Applications: ApplicationsAPI },
    Token,
    checkServer,
    syncLocalToServer,
    get serverOnline() { return serverOnline; }
};