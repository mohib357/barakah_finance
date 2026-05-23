// C:\Project\Barakah_Finance\backend\routes\reports.js

const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সম্পূর্ণ ড্যাশবোর্ড পরিসংখ্যান ──
router.get('/dashboard', verifyToken, requireAdmin, (req, res) => {
    const users = db.get('users').value();
    const savings = db.get('savings').value();
    const loans = db.get('loans').value();
    const orders = db.get('orders').value();
    const applications = db.get('applications').value();

    const thisMonth = new Date().toISOString().slice(0, 7);

    res.json({
        users: {
            total: users.filter(u => u.verified).length,
            members: users.filter(u => u.role === 'member').length,
            newThisMonth: users.filter(u => u.createdAt?.startsWith(thisMonth)).length
        },
        savings: {
            total: savings.reduce((a, s) => a + s.amount, 0),
            thisMonth: savings.filter(s => s.month === thisMonth).reduce((a, s) => a + s.amount, 0),
            count: savings.length
        },
        loans: {
            active: loans.filter(l => l.status === 'active').length,
            outstanding: loans.filter(l => l.status === 'active').reduce((a, l) => a + l.remaining, 0),
            total: loans.length
        },
        orders: {
            pending: orders.filter(o => o.status === 'pending').length,
            total: orders.length
        },
        applications: {
            pending: applications.filter(a => a.status === 'pending').length,
            approved: applications.filter(a => a.status === 'approved').length,
            total: applications.length
        }
    });
});

// ── সদস্যদের সঞ্চয় রিপোর্ট ──
router.get('/member-savings', verifyToken, requireAdmin, (req, res) => {
    const members = db.get('users').filter(u => u.role === 'member').value();
    const savings = db.get('savings').value();
    const settings = db.get('settings').value();

    const report = members.map(m => {
        const ms = savings.filter(s => s.userId === m.id);
        const total = ms.reduce((a, s) => a + s.amount, 0);
        const months = ms.map(s => s.month);
        return {
            id: m.id, name: m.name, memberID: m.memberID, phone: m.phone,
            totalSaved: total, monthCount: ms.length,
            expected: settings.monthlySavings, deficit: Math.max(0, settings.monthlySavings - total % settings.monthlySavings),
            lastPayment: ms.slice(-1)[0]?.date || null
        };
    });

    res.json({ report, total: report.reduce((a, r) => a + r.totalSaved, 0) });
});

// ── মাসিক না দেওয়া সদস্যদের তালিকা ──
router.get('/defaulters/:month', verifyToken, requireAdmin, (req, res) => {
    const { month } = req.params;
    const members = db.get('users').filter(u => u.role === 'member').value();
    const paid = db.get('savings').filter({ month }).map(s => s.userId).value();
    const defaulters = members.filter(m => !paid.includes(m.id));
    res.json({ month, defaulters: defaulters.map(m => ({ id: m.id, name: m.name, phone: m.phone, memberID: m.memberID })), count: defaulters.length });
});

// ── লোন রিপোর্ট ──
router.get('/loan-summary', verifyToken, requireAdmin, (req, res) => {
    const loans = db.get('loans').value();
    const users = db.get('users').value();

    const enriched = loans.map(l => ({
        ...l,
        userName: users.find(u => u.id === l.userId)?.name || l.userName
    }));

    res.json({
        all: enriched,
        byStatus: {
            pending: enriched.filter(l => l.status === 'pending').length,
            active: enriched.filter(l => l.status === 'active').length,
            paid: enriched.filter(l => l.status === 'paid').length,
            rejected: enriched.filter(l => l.status === 'rejected').length
        },
        totalGiven: loans.filter(l => ['active', 'paid'].includes(l.status)).reduce((a, l) => a + l.amount, 0),
        totalOutstanding: loans.filter(l => l.status === 'active').reduce((a, l) => a + l.remaining, 0),
        totalRecovered: loans.filter(l => l.status === 'paid').reduce((a, l) => a + l.amount, 0)
    });
});

// ── সাইট সেটিংস ──
router.get('/settings', verifyToken, requireAdmin, (req, res) => {
    res.json(db.get('settings').value());
});

router.put('/settings', verifyToken, requireAdmin, (req, res) => {
    const allowed = ['monthlySavings', 'lateFee', 'profitMargin', 'maxLoan', 'registrationOpen', 'noticeSpeed', 'siteName', 'slogan', 'phone', 'address'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    db.get('settings').assign(updates).write();
    res.json({ message: 'সেটিংস আপডেট হয়েছে', settings: db.get('settings').value() });
});

module.exports = router;