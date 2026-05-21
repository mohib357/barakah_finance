// C:\Project\Barakah_Finance\backend\routes\ledger.js
// সম্পূর্ণ হিসাব পাতি (General Ledger)

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সকল এন্ট্রি ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const { type, category, from, to, limit } = req.query;
    let entries = db.get('ledger').value();

    if (type) entries = entries.filter(e => e.type === type);
    if (category) entries = entries.filter(e => e.category === category);
    if (from) entries = entries.filter(e => e.date >= from);
    if (to) entries = entries.filter(e => e.date <= to + 'T23:59:59');

    entries = entries.slice().reverse(); // নতুন আগে
    if (limit) entries = entries.slice(0, Number(limit));

    const totalIncome = db.get('ledger').filter({ type: 'income' }).reduce((acc, e) => acc + (e.amount || 0), 0).value();
    const totalExpense = db.get('ledger').filter({ type: 'expense' }).reduce((acc, e) => acc + (e.amount || 0), 0).value();

    res.json({
        entries,
        balance: { totalIncome, totalExpense, net: totalIncome - totalExpense },
        count: entries.length
    });
});

// ── ম্যানুয়াল এন্ট্রি (অ্যাডমিন) ──
router.post('/', verifyToken, requireAdmin, (req, res) => {
    const { type, category, amount, description, userId, note } = req.body;
    if (!type || !amount || !description) {
        return res.status(400).json({ error: 'type, amount, description প্রয়োজন' });
    }
    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'type হবে income বা expense' });
    }

    const entry = {
        id: uuidv4(),
        type,
        category: category || 'manual',
        amount: Number(amount),
        description,
        userId: userId || null,
        note: note || '',
        addedBy: req.user.id,
        manual: true,
        date: new Date().toISOString()
    };

    db.get('ledger').push(entry).write();
    res.status(201).json({ entry, message: 'এন্ট্রি যোগ হয়েছে' });
});

// ── এন্ট্রি মুছুন ──
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    const entry = db.get('ledger').find({ id: req.params.id }).value();
    if (!entry?.manual) {
        return res.status(400).json({ error: 'স্বয়ংক্রিয় এন্ট্রি মুছা যাবে না' });
    }
    db.get('ledger').remove({ id: req.params.id }).write();
    res.json({ message: 'মুছে দেওয়া হয়েছে' });
});

// ── ব্যালেন্স শিট ──
router.get('/balance-sheet', verifyToken, requireAdmin, (req, res) => {
    const ledger = db.get('ledger').value();
    const savings = db.get('savings').value();
    const loans = db.get('loans').value();
    const settings = db.get('settings').value();

    const totalSavings = savings.reduce((acc, s) => acc + (s.amount || 0), 0);
    const totalLateFees = savings.reduce((acc, s) => acc + (s.lateFee || 0), 0);
    const totalLoansGiven = loans.filter(l => l.status !== 'rejected').reduce((acc, l) => acc + (l.amount || 0), 0);
    const totalLoansOutstanding = loans.filter(l => l.status === 'active').reduce((acc, l) => acc + (l.remaining || 0), 0);
    const totalLoansRepaid = loans.filter(l => l.status === 'paid').reduce((acc, l) => acc + (l.amount || 0), 0);

    const income = ledger.filter(e => e.type === 'income');
    const expense = ledger.filter(e => e.type === 'expense');
    const totalIncome = income.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalExpense = expense.reduce((acc, e) => acc + (e.amount || 0), 0);

    // ক্যাটাগরি ভিত্তিক
    const byCategory = {};
    ledger.forEach(e => {
        if (!byCategory[e.category]) byCategory[e.category] = { income: 0, expense: 0 };
        byCategory[e.category][e.type] += e.amount || 0;
    });

    res.json({
        assets: {
            totalSavings,
            loansOutstanding: totalLoansOutstanding,
            cash: totalIncome - totalExpense
        },
        liabilities: {
            memberSavings: totalSavings // সদস্যদের জমা = দায়
        },
        income: {
            total: totalIncome,
            savings: totalSavings,
            lateFees: totalLateFees,
            loanRepayments: totalLoansRepaid
        },
        expense: {
            total: totalExpense,
            loansGiven: totalLoansGiven
        },
        net: totalIncome - totalExpense,
        byCategory,
        generatedAt: new Date().toISOString()
    });
});

// ── মাসিক সারসংক্ষেপ ──
router.get('/monthly-summary', verifyToken, requireAdmin, (req, res) => {
    const { year } = req.query;
    const y = year || new Date().getFullYear().toString();
    const ledger = db.get('ledger').value();

    const months = [];
    for (let m = 1; m <= 12; m++) {
        const monthKey = `${y}-${String(m).padStart(2, '0')}`;
        const entries = ledger.filter(e => e.date.startsWith(monthKey));
        const income = entries.filter(e => e.type === 'income').reduce((acc, e) => acc + e.amount, 0);
        const expense = entries.filter(e => e.type === 'expense').reduce((acc, e) => acc + e.amount, 0);
        months.push({ month: monthKey, income, expense, net: income - expense, count: entries.length });
    }

    res.json({ year: y, months });
});

// ── বিভিন্ন ক্যাটাগরির তালিকা ──
const CATEGORIES = {
    income: ['savings', 'late_fee', 'loan_repayment', 'profit', 'donation', 'other_income', 'manual'],
    expense: ['loan_disbursed', 'operational', 'purchase', 'salary', 'other_expense', 'manual']
};

router.get('/categories', (req, res) => {
    res.json(CATEGORIES);
});

module.exports = router;