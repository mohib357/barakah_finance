// C:\Project\Barakah_Finance\backend\routes\savings.js
// সঞ্চয় হিসাব পাতি

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সকল সঞ্চয় (অ্যাডমিন) ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const savings = db.get('savings').value();
    const users = db.get('users').value();

    const enriched = savings.map(s => {
        const user = users.find(u => u.id === s.userId);
        return { ...s, userName: user?.name || '—', userPhone: user?.phone || '—' };
    });

    // পরিসংখ্যান
    const total = savings.reduce((acc, s) => acc + (s.amount || 0), 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthTotal = savings.filter(s => s.month === thisMonth).reduce((acc, s) => acc + (s.amount || 0), 0);

    res.json({ savings: enriched, stats: { total, monthTotal, count: savings.length } });
});

// ── একজনের সঞ্চয় ──
router.get('/user/:userId', verifyToken, (req, res) => {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'অ্যাক্সেস নেই' });
    }
    const savings = db.get('savings').filter({ userId: req.params.userId }).value();
    const total = savings.reduce((acc, s) => acc + (s.amount || 0), 0);

    // মাসিক ব্রেকডাউন
    const monthly = {};
    savings.forEach(s => {
        if (!monthly[s.month]) monthly[s.month] = 0;
        monthly[s.month] += s.amount || 0;
    });

    res.json({ savings, total, monthly, count: savings.length });
});

// ── সঞ্চয় যোগ করুন (অ্যাডমিন) ──
router.post('/', verifyToken, requireAdmin, (req, res) => {
    const { userId, month, amount, note, lateFlag } = req.body;
    if (!userId || !month || !amount) {
        return res.status(400).json({ error: 'userId, month, amount প্রয়োজন' });
    }

    const user = db.get('users').find({ id: userId }).value();
    if (!user) return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });

    // একই মাসে দ্বিতীয় এন্ট্রি চেক
    const existing = db.get('savings').find({ userId, month }).value();
    if (existing) return res.status(400).json({ error: `${month} মাসের সঞ্চয় ইতিমধ্যে যোগ করা হয়েছে` });

    const settings = db.get('settings').value();
    const isLate = lateFlag || false;
    const finalAmount = isLate ? amount : amount; // বিলম্ব ফি আলাদা রাখুন

    const entry = {
        id: uuidv4(),
        userId,
        userName: user.name,
        month,
        amount: Number(amount),
        note: note || '',
        lateFlag: isLate,
        lateFee: isLate ? settings.lateFee : 0,
        addedBy: req.user.id,
        date: new Date().toISOString()
    };

    db.get('savings').push(entry).write();

    // লেজারে এন্ট্রি
    addLedgerEntry({
        type: 'income',
        category: 'savings',
        amount: Number(amount),
        description: `সঞ্চয় জমা — ${user.name} (${month})`,
        userId,
        refId: entry.id,
        addedBy: req.user.id
    });

    if (isLate && settings.lateFee > 0) {
        addLedgerEntry({
            type: 'income',
            category: 'late_fee',
            amount: settings.lateFee,
            description: `বিলম্ব ফি — ${user.name} (${month})`,
            userId,
            refId: entry.id,
            addedBy: req.user.id
        });
    }

    res.status(201).json({ entry, message: 'সঞ্চয় এন্ট্রি যোগ হয়েছে' });
});

// ── সঞ্চয় আপডেট ──
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    const { amount, note } = req.body;
    db.get('savings').find({ id: req.params.id }).assign({ amount: Number(amount), note }).write();
    res.json({ message: 'আপডেট হয়েছে' });
});

// ── সঞ্চয় মুছুন ──
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('savings').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});

// ── মাসিক রিপোর্ট ──
router.get('/report/monthly', verifyToken, requireAdmin, (req, res) => {
    const { year } = req.query;
    const y = year || new Date().getFullYear().toString();
    const savings = db.get('savings').filter(s => s.month && s.month.startsWith(y)).value();
    const users = db.get('users').filter(u => u.role === 'member').value();

    // প্রতি মাসের জন্য কে কে জমা দিয়েছে
    const months = [];
    for (let m = 1; m <= 12; m++) {
        const monthKey = `${y}-${String(m).padStart(2, '0')}`;
        const monthSavings = savings.filter(s => s.month === monthKey);
        months.push({
            month: monthKey,
            total: monthSavings.reduce((acc, s) => acc + s.amount, 0),
            count: monthSavings.length,
            missing: users.length - monthSavings.length
        });
    }

    res.json({ year: y, months, totalMembers: users.length });
});

// ── কে কে বাকি (মাস অনুযায়ী) ──
router.get('/missing/:month', verifyToken, requireAdmin, (req, res) => {
    const { month } = req.params;
    const members = db.get('users').filter(u => ['member', 'admin'].includes(u.role) && u.role !== 'admin').value();
    const paid = db.get('savings').filter({ month }).map(s => s.userId).value();
    const missing = members.filter(m => !paid.includes(m.id)).map(m => ({
        id: m.id, name: m.name, phone: m.phone, memberID: m.memberID
    }));
    res.json({ month, missing, paidCount: paid.length, missingCount: missing.length });
});

// ── হেল্পার: লেজার এন্ট্রি ──
function addLedgerEntry(data) {
    db.get('ledger').push({
        id: uuidv4(),
        ...data,
        date: new Date().toISOString()
    }).write();
}

module.exports = router;