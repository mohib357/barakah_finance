// backend/routes/accounts.js — আয়, ব্যয়, হিসাব ব্যবস্থাপনা

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ════════ INCOME ════════

// ── অন্যান্য আয় ──
router.get('/income', verifyToken, requireAdmin, (req, res) => {
    const { category, from, to } = req.query;
    // Fix: deleted entries filter করা
    let income = db.get('income').value().filter(i => !i.deleted);
    if (category) income = income.filter(i => i.category === category);
    if (from) income = income.filter(i => i.date >= from);
    if (to) income = income.filter(i => i.date <= to);
    income = income.sort((a, b) => new Date(b.date) - new Date(a.date));
    const categories = [...new Set(db.get('income').value().map(i => i.category))].filter(Boolean);
    res.json({ income, categories });
});

router.post('/income', verifyToken, requireAdmin, (req, res) => {
    try {
        const { category, amount, date, description, paymentMethod } = req.body;
        if (!category || !amount || !date) return res.status(400).json({ error: 'সব তথ্য দিন।' });

        const receiptNum = generateReceiptNumber('I');
        const id = uuidv4();
        const now = new Date().toISOString();
        const entry = { id, category, amount: parseFloat(amount), date, description: description || '', paymentMethod: paymentMethod || 'cash', receiptNumber: receiptNum, collectedBy: req.user.id, createdAt: now };
        db.get('income').push(entry).write();
        db.get('receipts').push({ id: uuidv4(), receiptNumber: receiptNum, paymentId: id, type: 'income', status: 'issued', issuedAt: now, issuedBy: req.user.id }).write();
        db.get('ledger').push({ id: uuidv4(), type: 'income', category, amount: parseFloat(amount), description, refId: id, addedBy: req.user.id, manual: true, date, createdAt: now }).write();
        db.get('audit_log').push({ id: uuidv4(), action: 'ADD_INCOME', module: 'accounts', recordId: id, newValue: JSON.stringify({ category, amount }), userId: req.user.id, date: now }).write();
        res.status(201).json({ entry, receiptNumber: receiptNum, message: 'আয় যোগ হয়েছে।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/income/:id', verifyToken, requireAdmin, (req, res) => {
    const entry = db.get('income').find({ id: req.params.id }).value();
    if (!entry) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    const old = JSON.stringify(entry);
    db.get('income').find({ id: req.params.id }).assign({ ...req.body, updatedAt: new Date().toISOString(), updatedBy: req.user.id }).write();
    db.get('audit_log').push({ id: uuidv4(), action: 'EDIT_INCOME', module: 'accounts', recordId: req.params.id, oldValue: old, newValue: JSON.stringify(req.body), reason: req.body.editReason || '', userId: req.user.id, date: new Date().toISOString() }).write();
    res.json({ message: 'আপডেট হয়েছে।' });
});

router.delete('/income/:id', verifyToken, requireAdmin, (req, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'কারণ উল্লেখ করুন।' });
    const entry = db.get('income').find({ id: req.params.id }).value();
    if (!entry) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    db.get('income').find({ id: req.params.id }).assign({ deleted: true, deletedAt: new Date().toISOString(), deletedBy: req.user.id, deleteReason: reason }).write();
    db.get('audit_log').push({ id: uuidv4(), action: 'DELETE_INCOME', module: 'accounts', recordId: req.params.id, oldValue: JSON.stringify(entry), reason, userId: req.user.id, date: new Date().toISOString() }).write();
    res.json({ message: 'মুছে ফেলা হয়েছে।' });
});

// ════════ EXPENSE ════════

router.get('/expense', verifyToken, requireAdmin, (req, res) => {
    const { category, from, to } = req.query;
    let expense = db.get('expense').value().filter(e => !e.deleted);
    if (category) expense = expense.filter(e => e.category === category);
    if (from) expense = expense.filter(e => e.date >= from);
    if (to) expense = expense.filter(e => e.date <= to);
    expense = expense.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get categories
    const categories = [...new Set(db.get('expense').value().map(e => e.category))].filter(Boolean);
    res.json({ expense, categories });
});

router.post('/expense', verifyToken, requireAdmin, (req, res) => {
    try {
        const { category, subCategory, amount, date, description, paymentMethod } = req.body;
        if (!category || !amount || !date) return res.status(400).json({ error: 'সব তথ্য দিন।' });
        const receiptNum = generateReceiptNumber('E');
        const id = uuidv4();
        const now = new Date().toISOString();
        const entry = { id, category, subCategory: subCategory || '', amount: parseFloat(amount), date, description: description || '', paymentMethod: paymentMethod || 'cash', receiptNumber: receiptNum, addedBy: req.user.id, createdAt: now };
        db.get('expense').push(entry).write();
        db.get('ledger').push({ id: uuidv4(), type: 'expense', category, amount: parseFloat(amount), description, refId: id, addedBy: req.user.id, manual: true, date, createdAt: now }).write();
        db.get('audit_log').push({ id: uuidv4(), action: 'ADD_EXPENSE', module: 'accounts', recordId: id, newValue: JSON.stringify({ category, amount }), userId: req.user.id, date: now }).write();
        res.status(201).json({ entry, receiptNumber: receiptNum, message: 'ব্যয় যোগ হয়েছে।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/expense/:id', verifyToken, requireAdmin, (req, res) => {
    const entry = db.get('expense').find({ id: req.params.id }).value();
    if (!entry) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    const old = JSON.stringify(entry);
    db.get('expense').find({ id: req.params.id }).assign({ ...req.body, updatedAt: new Date().toISOString(), updatedBy: req.user.id }).write();
    db.get('audit_log').push({ id: uuidv4(), action: 'EDIT_EXPENSE', module: 'accounts', recordId: req.params.id, oldValue: old, newValue: JSON.stringify(req.body), reason: req.body.editReason || '', userId: req.user.id, date: new Date().toISOString() }).write();
    res.json({ message: 'আপডেট হয়েছে।' });
});

router.delete('/expense/:id', verifyToken, requireAdmin, (req, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'কারণ উল্লেখ করুন।' });
    const entry = db.get('expense').find({ id: req.params.id }).value();
    if (!entry) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    db.get('expense').find({ id: req.params.id }).assign({ deleted: true, deletedAt: new Date().toISOString(), deletedBy: req.user.id, deleteReason: reason }).write();
    db.get('audit_log').push({ id: uuidv4(), action: 'DELETE_EXPENSE', module: 'accounts', recordId: req.params.id, oldValue: JSON.stringify(entry), reason, userId: req.user.id, date: new Date().toISOString() }).write();
    res.json({ message: 'মুছে ফেলা হয়েছে।' });
});

// ════════ PAY ORDER RULES ════════
router.get('/pay-order-rules', verifyToken, requireAdmin, (req, res) => {
    res.json({ rules: db.get('pay_order_rules').filter({ active: true }).value() });
});

router.post('/pay-order-rules', verifyToken, requireAdmin, (req, res) => {
    const { name, description, amount, isRecurring, period } = req.body;
    if (!name) return res.status(400).json({ error: 'নাম দিন।' });
    const rule = { id: uuidv4(), name, description: description || '', amount: parseFloat(amount) || 0, isRecurring: !!isRecurring, period: period || '', active: true, createdAt: new Date().toISOString() };
    db.get('pay_order_rules').push(rule).write();
    res.status(201).json({ rule, message: 'রুল যোগ হয়েছে।' });
});

// ════════ PAY ORDERS ════════
router.get('/pay-orders', verifyToken, requireAdmin, (req, res) => {
    const { memberId, clientId, month } = req.query;
    let orders = db.get('pay_orders').value();
    if (memberId) orders = orders.filter(o => o.memberId === memberId);
    if (clientId) orders = orders.filter(o => o.clientId === clientId);
    if (month) orders = orders.filter(o => o.month === month);
    res.json({ orders });
});

// ════════ RECEIPT CHECK ════════
router.get('/receipt/:num', verifyToken, requireAdmin, (req, res) => {
    const receipt = db.get('receipts').find({ receiptNumber: req.params.num }).value();
    if (!receipt) return res.status(404).json({ error: 'রসিদ পাওয়া যায়নি' });
    const payment = db.get('payments').find({ id: receipt.paymentId }).value()
        || db.get('income').find({ id: receipt.paymentId }).value()
        || db.get('expense').find({ id: receipt.paymentId }).value();
    const collector = db.get('users').find({ id: receipt.issuedBy }).value();
    res.json({ receipt, payment, collector: collector ? { name: collector.name, username: collector.username } : null });
});

// ════════ REPORTS ════════
router.get('/report/summary', verifyToken, requireAdmin, (req, res) => {
    const ledger = db.get('ledger').value();
    const totalIncome = ledger.filter(l => l.type === 'income').reduce((s, l) => s + (l.amount || 0), 0);
    const totalExpense = ledger.filter(l => l.type === 'expense').reduce((s, l) => s + (l.amount || 0), 0);
    const netBalance = totalIncome - totalExpense;

    // By category
    const byCategory = {};
    ledger.forEach(l => {
        if (!byCategory[l.type]) byCategory[l.type] = {};
        byCategory[l.type][l.category] = (byCategory[l.type][l.category] || 0) + (l.amount || 0);
    });

    // By month
    const byMonth = {};
    ledger.forEach(l => {
        const month = (l.date || l.createdAt || '').substring(0, 7);
        if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 };
        byMonth[month][l.type] = (byMonth[month][l.type] || 0) + (l.amount || 0);
    });

    res.json({ totalIncome, totalExpense, netBalance, byCategory, byMonth });
});

router.get('/report/member-due', verifyToken, requireAdmin, (req, res) => {
    const settings = db.get('settings').value();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const members = db.get('members').filter({ status: 'active' }).value();

    const dueList = [];
    members.forEach(m => {
        const user = db.get('users').find({ id: m.userId }).value() || {};
        if (m.investType !== 'monthly_savings') return;
        const paidThisMonth = db.get('savings').find({ userId: m.userId, month: currentMonth }).value();
        if (!paidThisMonth) {
            dueList.push({
                memberID: m.memberID, name: user.name || m.memberID,
                phone: user.phone, totalPayable: settings.monthlySavings,
                paid: 0, due: settings.monthlySavings, month: currentMonth,
                dueDeadline: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${settings.savingsDueDay || 15}`
            });
        }
    });
    res.json({ dueList, month: currentMonth, total: dueList.length });
});

router.get('/report/client-due', verifyToken, requireAdmin, (req, res) => {
    const now = new Date();
    const installments = db.get('installments').filter(i =>
        ['due', 'overdue', 'upcoming'].includes(i.status)
    ).value();

    const dueList = installments.map(inst => {
        const client = db.get('clients').find({ id: inst.clientId }).value() || {};
        const dueDate = new Date(inst.dueDate);
        const isOverdue = dueDate < now;
        return {
            receiptNum: null, clientID: client.clientID, name: client.name,
            phone: client.phone, totalPayable: inst.dueAmount, paid: inst.paidAmount || 0,
            due: inst.remainingAmount, currentDue: inst.remainingAmount,
            dueDeadline: inst.dueDate, isOverdue, installmentNumber: inst.installmentNumber
        };
    }).sort((a, b) => new Date(a.dueDeadline) - new Date(b.dueDeadline));

    res.json({ dueList, total: dueList.length });
});

// ════════ ACCOUNTS LOG ════════
router.get('/log', verifyToken, requireAdmin, (req, res) => {
    const { from, to, limit } = req.query;
    let log = db.get('audit_log').value().filter(l => ['ADD_INCOME', 'ADD_EXPENSE', 'EDIT_INCOME', 'EDIT_EXPENSE', 'DELETE_INCOME', 'DELETE_EXPENSE', 'UNPAID_RECEIPT', 'REMOVE_PAY_ORDER', 'ADD_PAYMENT'].includes(l.action));
    if (from) log = log.filter(l => l.date >= from);
    if (to) log = log.filter(l => l.date <= to);
    log = log.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (limit) log = log.slice(0, parseInt(limit));
    res.json({ log });
});

// ── Helper — collision-safe receipt number ──
function generateReceiptNumber(prefix) {
    // সর্বোচ্চ সিরিয়াল নম্বর খুঁজে বের করি, শুধু count নয়
    const receipts = db.get('receipts').value();
    const nums = receipts
        .filter(r => r.receiptNumber && r.receiptNumber.startsWith(prefix + '-'))
        .map(r => {
            const parts = r.receiptNumber.split('-');
            return parseInt(parts[parts.length - 1]) || 0;
        });
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    return `${prefix}-${String(maxNum + 1).padStart(5, '0')}`;
}

module.exports = router;
