// C:\Project\Barakah_Finance\backend\routes\loans.js
// করজে হাসানা হিসাব

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সকল করজ (অ্যাডমিন) ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const loans = db.get('loans').value();
    const users = db.get('users').value();
    const enriched = loans.map(l => ({
        ...l,
        userName: users.find(u => u.id === l.userId)?.name || l.userName || '—'
    }));

    const active = loans.filter(l => l.status === 'active');
    const totalOutstanding = active.reduce((acc, l) => acc + (l.remaining || 0), 0);

    res.json({
        loans: enriched,
        stats: { total: loans.length, active: active.length, totalOutstanding }
    });
});

// ── একজনের করজ ──
router.get('/user/:userId', verifyToken, (req, res) => {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'অ্যাক্সেস নেই' });
    }
    const loans = db.get('loans').filter({ userId: req.params.userId }).value();
    res.json(loans);
});

// ── করজ আবেদন ──
router.post('/', verifyToken, (req, res) => {
    const { amount, reason, startMonth, guarantor, months } = req.body;
    const settings = db.get('settings').value();

    if (!amount || !reason || !startMonth) {
        return res.status(400).json({ error: 'পরিমাণ, কারণ ও পরিশোধের মাস প্রয়োজন' });
    }
    if (Number(amount) > settings.maxLoan) {
        return res.status(400).json({ error: `সর্বোচ্চ ${settings.maxLoan} টাকা আবেদন করা যাবে` });
    }

    const user = db.get('users').find({ id: req.user.id }).value();
    const loan = {
        id: uuidv4(),
        userId: req.user.id,
        userName: user.name,
        amount: Number(amount),
        remaining: Number(amount),
        reason,
        guarantor: guarantor || '',
        startMonth,
        months: Number(months) || 3,
        status: 'pending',
        payments: [],
        createdAt: new Date().toISOString()
    };

    db.get('loans').push(loan).write();
    res.status(201).json({ loan, message: 'করজে হাসানা আবেদন জমা হয়েছে' });
});

// ── করজ অনুমোদন/বাতিল (অ্যাডমিন) ──
router.patch('/:id/status', verifyToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    if (!['pending', 'active', 'paid', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'অবৈধ স্ট্যাটাস' });
    }
    db.get('loans').find({ id: req.params.id }).assign({ status }).write();

    // লেজার এন্ট্রি (অনুমোদনের সময়)
    if (status === 'active') {
        const loan = db.get('loans').find({ id: req.params.id }).value();
        db.get('ledger').push({
            id: uuidv4(),
            type: 'expense',
            category: 'loan_disbursed',
            amount: loan.amount,
            description: `করজে হাসানা বিতরণ — ${loan.userName}`,
            userId: loan.userId,
            refId: loan.id,
            date: new Date().toISOString()
        }).write();
    }

    res.json({ message: 'স্ট্যাটাস আপডেট হয়েছে' });
});

// ── কিস্তি পরিশোধ (অ্যাডমিন) ──
router.post('/:id/payment', verifyToken, requireAdmin, (req, res) => {
    const { amount, note } = req.body;
    const loan = db.get('loans').find({ id: req.params.id }).value();
    if (!loan) return res.status(404).json({ error: 'করজ পাওয়া যায়নি' });
    if (loan.status !== 'active') return res.status(400).json({ error: 'করজটি সক্রিয় নয়' });

    const payment = {
        id: uuidv4(),
        amount: Number(amount),
        note: note || '',
        date: new Date().toISOString()
    };

    const newRemaining = Math.max(0, loan.remaining - Number(amount));
    const updates = {
        remaining: newRemaining,
        payments: [...(loan.payments || []), payment]
    };
    if (newRemaining === 0) updates.status = 'paid';

    db.get('loans').find({ id: req.params.id }).assign(updates).write();

    // লেজার এন্ট্রি
    db.get('ledger').push({
        id: uuidv4(),
        type: 'income',
        category: 'loan_repayment',
        amount: Number(amount),
        description: `করজ পরিশোধ — ${loan.userName}`,
        userId: loan.userId,
        refId: loan.id,
        date: new Date().toISOString()
    }).write();

    res.json({ message: 'পরিশোধ রেকর্ড হয়েছে', remaining: newRemaining });
});

// ── করজ মুছুন ──
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('loans').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});

module.exports = router;