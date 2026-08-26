// backend/routes/clients.js — ক্লাইন্ট ও কিস্তি ব্যবস্থাপনা

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সব ক্লাইন্ট ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const clients = db.get('clients').value();
    const enriched = clients.map(c => {
        const installments = db.get('installments').filter({ clientId: c.id }).value();
        const paid = installments.filter(i => i.status === 'paid').reduce((s, i) => s + (i.paidAmount || 0), 0);
        const totalPayable = c.totalPayable || 0;
        return { ...c, totalPaid: paid, remaining: totalPayable - paid };
    });
    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        paid: clients.filter(c => c.status === 'paid').length,
        totalFund: db.get('settings').value().clientFund || 1000000
    };
    res.json({ clients: enriched, stats });
});

// ── ডিউ ক্লাইন্ট লিস্ট ──
router.get('/due', verifyToken, requireAdmin, (req, res) => {
    const now = new Date();
    const installments = db.get('installments').filter(i =>
        (i.status === 'upcoming' || i.status === 'due' || i.status === 'overdue') &&
        new Date(i.dueDate) <= now
    ).value();

    const dueList = installments.map(inst => {
        const client = db.get('clients').find({ id: inst.clientId }).value() || {};
        return { ...inst, clientName: client.name, clientPhone: client.phone, clientId: client.clientID };
    });
    res.json({ dueList });
});

// ── একটি ক্লাইন্টের তথ্য ──
router.get('/:id', verifyToken, requireAdmin, (req, res) => {
    const client = db.get('clients').find({ id: req.params.id }).value();
    if (!client) return res.status(404).json({ error: 'ক্লাইন্ট পাওয়া যায়নি' });
    const installments = db.get('installments').filter({ clientId: client.id }).value().sort((a, b) => a.installmentNumber - b.installmentNumber);
    const payments = db.get('payments').filter({ clientId: client.id }).value();
    res.json({ client, installments, payments });
});

// ── নতুন ক্লাইন্ট তৈরি ──
router.post('/', verifyToken, requireAdmin, (req, res) => {
    try {
        const {
            name, fatherName, phone, address, dob, nid,
            purchaseDate, purchasePrice, downPayment, profitRate,
            installmentCount, guarantorMemberId, witnessName, witnessPhone, witnessAddress,
            productName, calcMethod, customProfit, clientID
        } = req.body;

        if (!name || !phone || !purchaseDate || !purchasePrice || !installmentCount) {
            return res.status(400).json({ error: 'প্রয়োজনীয় তথ্য পূরণ করুন।' });
        }

        // Check duplicate clientID
        if (clientID && db.get('clients').find({ clientID }).value()) {
            return res.status(400).json({ error: 'এই ক্লাইন্ট আইডি ইতিমধ্যে ব্যবহৃত।' });
        }

        // Next client ID
        const existingClients = db.get('clients').value();
        const nextNum = existingClients.length + 1;
        const finalClientID = clientID || String(nextNum).padStart(6, '0');

        const settings = db.get('settings').value();
        const rate = profitRate !== undefined ? profitRate : settings.profitMargin;
        const n = parseInt(installmentCount);
        const cost = parseFloat(purchasePrice);
        const down = parseFloat(downPayment) || 0;

        // Profit calculation per method
        let salePrice, profitAmount;
        if (calcMethod === 'B' || (down > 0)) {
            // Method B: financed amount based
            const financed = cost - down;
            profitAmount = financed * (rate / 100);
            salePrice = cost + profitAmount;
        } else if (calcMethod === 'C' && customProfit) {
            profitAmount = typeof customProfit === 'string' && customProfit.includes('%')
                ? cost * (parseFloat(customProfit) / 100)
                : parseFloat(customProfit);
            salePrice = cost + profitAmount;
        } else {
            // Method A: full cost based
            profitAmount = cost * (rate / 100);
            salePrice = cost + profitAmount;
        }

        const remaining = salePrice - down;
        const baseInstall = Math.floor(remaining / n);
        const lastInstall = remaining - baseInstall * (n - 1);

        const id = uuidv4();
        const now = new Date().toISOString();

        const client = {
            id, clientID: finalClientID, name, fatherName: fatherName || '',
            phone, address: address || '', dob: dob || '', nid: nid || '',
            purchaseDate, productName: productName || '', purchasePrice: cost,
            downPayment: down, profitRate: rate, calcMethod: calcMethod || 'A',
            profitAmount, salePrice, totalPayable: salePrice, installmentCount: n,
            guarantorMemberId: guarantorMemberId || null,
            witnessName: witnessName || '', witnessPhone: witnessPhone || '', witnessAddress: witnessAddress || '',
            status: 'active', createdAt: now, createdBy: req.user.id
        };

        db.get('clients').push(client).write();

        // Generate installment schedule
        // Website.txt: "সব installment-এর যোগফল Total Payable-এর সঙ্গে 100% মিলবে"
        const purchaseDateObj = new Date(purchaseDate);
        const installments = [];

        // Down payment logic:
        // প্রথম কিস্তি = down payment হলে বাকি n-1 কিস্তিতে remaining টাকা ভাগ হবে
        if (down > 0) {
            // Down payment — ক্রয়ের দিনেই
            const downInstall = {
                id: uuidv4(), clientId: id, installmentNumber: 1,
                dueAmount: Math.round(down * 100) / 100,
                remainingAmount: Math.round(down * 100) / 100,
                dueDate: purchaseDate,
                paidAmount: 0, status: 'due', lateStatus: false, lateFee: 0,
                paymentDate: null, isDownPayment: true, createdAt: now
            };
            installments.push(downInstall);

            // বাকি টাকা পরবর্তী কিস্তিতে
            const remainingAfterDown = Math.round((remaining) * 100) / 100;
            const remainingInstalls = n - 1;
            const baseRem = Math.floor(remainingAfterDown / remainingInstalls * 100) / 100;
            const lastRem = Math.round((remainingAfterDown - baseRem * (remainingInstalls - 1)) * 100) / 100;

            for (let i = 2; i <= n; i++) {
                const dueDate = new Date(purchaseDateObj);
                dueDate.setMonth(dueDate.getMonth() + (i - 1));
                const dueAmt = i === n ? lastRem : baseRem;
                installments.push({
                    id: uuidv4(), clientId: id, installmentNumber: i,
                    dueAmount: dueAmt, remainingAmount: dueAmt,
                    dueDate: dueDate.toISOString().split('T')[0],
                    paidAmount: 0, status: 'upcoming', lateStatus: false, lateFee: 0,
                    paymentDate: null, createdAt: now
                });
            }
        } else {
            // No down payment — সব কিস্তি পরের মাস থেকে
            const baseInstall = Math.floor(remaining / n * 100) / 100;
            const lastInstall  = Math.round((remaining - baseInstall * (n - 1)) * 100) / 100;

            for (let i = 1; i <= n; i++) {
                const dueDate = new Date(purchaseDateObj);
                dueDate.setMonth(dueDate.getMonth() + i);
                installments.push({
                    id: uuidv4(), clientId: id, installmentNumber: i,
                    dueAmount: i === n ? lastInstall : baseInstall,
                    remainingAmount: i === n ? lastInstall : baseInstall,
                    dueDate: dueDate.toISOString().split('T')[0],
                    paidAmount: 0, status: 'upcoming', lateStatus: false, lateFee: 0,
                    paymentDate: null, createdAt: now
                });
            }
        }

        // Verify total matches — Website.txt: "Total Payable = installment sum"
        const installmentSum = installments.reduce((s, i) => s + i.dueAmount, 0);
        const diff = Math.round((salePrice - installmentSum) * 100) / 100;
        if (Math.abs(diff) > 0.01 && installments.length > 0) {
            installments[installments.length - 1].dueAmount += diff;
            installments[installments.length - 1].remainingAmount += diff;
        }

        installments.forEach(inst => db.get('installments').push(inst).write());

        // Audit
        db.get('audit_log').push({ id: uuidv4(), action: 'CREATE_CLIENT', module: 'clients', recordId: id, newValue: JSON.stringify({ clientID: finalClientID, name, salePrice }), userId: req.user.id, date: now }).write();

        res.status(201).json({ client, installments, message: 'ক্লাইন্ট তৈরি সফল।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── পেমেন্ট কালেক্ট ──
router.post('/:id/payment', verifyToken, requireAdmin, (req, res) => {
    try {
        const { installmentId, amount, paymentMethod, note, sendSMS, collectDate } = req.body;
        const client = db.get('clients').find({ id: req.params.id }).value();
        if (!client) return res.status(404).json({ error: 'ক্লাইন্ট পাওয়া যায়নি' });

        const installment = db.get('installments').find({ id: installmentId }).value();
        if (!installment) return res.status(404).json({ error: 'কিস্তি পাওয়া যায়নি' });

        const paid = parseFloat(amount);
        if (paid <= 0) return res.status(400).json({ error: 'পরিমাণ সঠিক নয়' });

        const settings = db.get('settings').value();
        const receiptNum = generateReceiptNumber('C');
        const now = collectDate || new Date().toISOString();

        // Update installment
        const newPaid = (installment.paidAmount || 0) + paid;
        const newRemaining = Math.max(0, installment.dueAmount - newPaid);
        const newStatus = newRemaining <= 0 ? 'paid' : (newPaid > 0 ? 'partially_paid' : installment.status);

        db.get('installments').find({ id: installmentId }).assign({
            paidAmount: newPaid, remainingAmount: newRemaining,
            status: newStatus, paymentDate: now
        }).write();

        // Payment record
        const paymentId = uuidv4();
        const payment = {
            id: paymentId, clientId: client.id, installmentId, amount: paid,
            paymentMethod: paymentMethod || 'cash', note: note || '',
            receiptNumber: receiptNum, collectedBy: req.user.id, date: now,
            type: 'client_installment'
        };
        db.get('payments').push(payment).write();

        // Receipt registry
        db.get('receipts').push({ id: uuidv4(), receiptNumber: receiptNum, paymentId, type: 'client', status: 'issued', issuedAt: now, issuedBy: req.user.id }).write();

        // Ledger entry
        db.get('ledger').push({ id: uuidv4(), type: 'income', category: 'client_installment', amount: paid, description: `ক্লাইন্ট কিস্তি — ${client.name} (${client.clientID})`, refId: paymentId, addedBy: req.user.id, manual: false, date: now }).write();

        // Check if all installments paid
        const allInst = db.get('installments').filter({ clientId: client.id }).value();
        const allPaid = allInst.every(i => i.status === 'paid');
        if (allPaid) db.get('clients').find({ id: client.id }).assign({ status: 'paid' }).write();

        res.json({ payment, receiptNumber: receiptNum, message: 'পেমেন্ট সফল।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ক্লাইন্ট তহবিল ──
router.get('/fund/info', verifyToken, requireAdmin, (req, res) => {
    const settings = db.get('settings').value();
    const clients = db.get('clients').value();
    const installments = db.get('installments').value();
    const totalGiven = clients.reduce((s, c) => s + (c.purchasePrice || 0), 0);
    const totalCollected = installments.filter(i => i.status === 'paid').reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalDue = installments.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.remainingAmount || 0), 0);
    res.json({ fund: settings.clientFund || 1000000, totalGiven, totalCollected, totalDue });
});

router.put('/fund/update', verifyToken, requireAdmin, (req, res) => {
    const { amount, reason } = req.body;
    db.get('settings').assign({ clientFund: amount }).write();
    db.get('audit_log').push({ id: uuidv4(), action: 'UPDATE_CLIENT_FUND', module: 'clients', newValue: JSON.stringify({ amount, reason }), userId: req.user.id, date: new Date().toISOString() }).write();
    res.json({ message: 'তহবিল আপডেট সফল।' });
});

// ── Helper: Receipt Number ──
function generateReceiptNumber(prefix) {
    const receipts = db.get('receipts').value();
    const last = receipts.filter(r => r.receiptNumber && r.receiptNumber.startsWith(prefix)).length;
    return `${prefix}-${String(last + 1).padStart(5, '0')}`;
}

module.exports = router;
