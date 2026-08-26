// backend/routes/fund_transfers.js — ফান্ড ট্রান্সফার ব্যবস্থাপনা
// Website.txt: "এক account থেকে অন্য account-এ transfer Income বা Expense হিসেবে গণ্য হবে না"

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সব ফান্ড ট্রান্সফার ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const { from, to, fromAccount, toAccount } = req.query;
    let transfers = db.get('fund_transfers').value();
    if (fromAccount) transfers = transfers.filter(t => t.fromAccount === fromAccount);
    if (toAccount) transfers = transfers.filter(t => t.toAccount === toAccount);
    if (from) transfers = transfers.filter(t => t.date >= from);
    if (to) transfers = transfers.filter(t => t.date <= to);
    transfers = transfers.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ transfers, total: transfers.length });
});

// ── নতুন ফান্ড ট্রান্সফার ──
router.post('/', verifyToken, requireAdmin, (req, res) => {
    try {
        const { fromAccount, toAccount, amount, date, description, reference } = req.body;

        if (!fromAccount || !toAccount || !amount || !date) {
            return res.status(400).json({ error: 'সব তথ্য দিন (উৎস, গন্তব্য, পরিমাণ, তারিখ)।' });
        }
        if (fromAccount === toAccount) {
            return res.status(400).json({ error: 'উৎস ও গন্তব্য একই হতে পারে না।' });
        }
        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();
        const transfer = {
            id,
            fromAccount,
            toAccount,
            amount: parseFloat(amount),
            date,
            description: description || '',
            reference: reference || '',
            transferredBy: req.user.id,
            status: 'completed',
            createdAt: now
        };

        db.get('fund_transfers').push(transfer).write();

        // Audit log
        db.get('audit_log').push({
            id: uuidv4(),
            action: 'FUND_TRANSFER',
            module: 'fund_transfers',
            recordId: id,
            newValue: JSON.stringify({ fromAccount, toAccount, amount }),
            reason: description || '',
            userId: req.user.id,
            date: now
        }).write();

        res.status(201).json({ transfer, message: 'ফান্ড ট্রান্সফার সম্পন্ন হয়েছে।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── একটি ট্রান্সফার দেখুন ──
router.get('/:id', verifyToken, requireAdmin, (req, res) => {
    const transfer = db.get('fund_transfers').find({ id: req.params.id }).value();
    if (!transfer) return res.status(404).json({ error: 'ট্রান্সফার পাওয়া যায়নি।' });
    const transferredBy = db.get('users').find({ id: transfer.transferredBy }).value();
    res.json({ transfer, transferredBy: transferredBy ? { name: transferredBy.name, username: transferredBy.username } : null });
});

module.exports = router;
