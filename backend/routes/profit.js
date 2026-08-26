// backend/routes/profit.js — মুনাফা বিতরণ ব্যবস্থাপনা
// Website.txt business rules:
//   Net Profit = Business Revenue - Cost of Goods - Operational Expense
//   Member/Investor = Net Profit × 60%
//   Charity = Net Profit × 5%
//   Organization = Net Profit × 35%
//   Unit Value = 2000 BDT, profit starts from capital activation date
//   Principal protection: সদস্যের মূলধন ফেরত দিতে হবে (actual loss ছাড়া)

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ════════════════════════════════════════════════════
// CORE PROFIT CALCULATION ENGINE
// ════════════════════════════════════════════════════

/**
 * Calculate a member's proportional profit share for a given distribution cycle.
 * Uses day-based proportion of active capital vs total active capital.
 *
 * @param {string} memberId  - member record id
 * @param {string} fromDate  - period start (ISO date)
 * @param {string} toDate    - period end (ISO date)
 * @param {number} memberPoolAmount - total amount allocated to all members (Net Profit × 60%)
 * @returns {object} { memberId, memberID, name, activeCapital, units, profitShare, activeDays }
 */
function calculateMemberShare(member, fromDate, toDate, memberPoolAmount) {
    const settings = db.get('settings').value();
    const unitValue = settings.unitValue || 2000;

    const from = new Date(fromDate);
    const to   = new Date(toDate);
    const totalDays = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));

    // সদস্যের সমস্ত সঞ্চয় এন্ট্রি পাই
    const savings = db.get('savings').filter({ userId: member.userId }).value();
    const totalCapital = savings.reduce((s, sv) => s + (sv.amount || 0), 0);

    // Activation date = latest savings entry date within period (simplified)
    // Website.txt: "যে তারিখ থেকে তার জমা দেওয়া অর্থ business-এ সক্রিয়ভাবে খাটবে"
    // For now: join date or first savings date acts as activation
    const activationDate = new Date(member.joinDate || member.createdAt || fromDate);
    const effectiveFrom = activationDate > from ? activationDate : from;
    const activeDays = Math.max(0, Math.ceil((to - effectiveFrom) / (1000 * 60 * 60 * 24)));

    const weightedCapital = totalCapital * (activeDays / totalDays);
    const units = totalCapital / unitValue;

    return {
        memberId: member.id,
        memberID: member.memberID,
        userId: member.userId,
        activeCapital: totalCapital,
        units: Math.round(units * 100) / 100,
        activeDays,
        totalDays,
        weightedCapital: Math.round(weightedCapital * 100) / 100,
        // profitShare calculated after knowing total weighted capital
    };
}

// ════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════

// ── সব distribution history ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const distributions = db.get('profit_distributions')?.value() || [];
    const enriched = distributions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ distributions: enriched, total: enriched.length });
});

// ── একটি distribution-এর বিবরণ ──
router.get('/:id', verifyToken, requireAdmin, (req, res) => {
    const dist = (db.get('profit_distributions')?.value() || []).find(d => d.id === req.params.id);
    if (!dist) return res.status(404).json({ error: 'Distribution পাওয়া যায়নি।' });
    res.json({ distribution: dist });
});

// ── Profit distribution calculation preview (commit না করে দেখানো) ──
router.post('/calculate', verifyToken, requireAdmin, (req, res) => {
    try {
        const { fromDate, toDate, businessRevenue, costOfGoods, operationalExpense, description } = req.body;

        if (!fromDate || !toDate || businessRevenue === undefined) {
            return res.status(400).json({ error: 'fromDate, toDate এবং businessRevenue প্রয়োজন।' });
        }

        const settings = db.get('settings').value();
        const memberShare   = (settings.memberProfitShare || 60) / 100;
        const charityShare  = (settings.charityShare      || 5)  / 100;
        const orgShare      = (settings.orgShare          || 35) / 100;

        const revenue    = parseFloat(businessRevenue) || 0;
        const cogs       = parseFloat(costOfGoods)      || 0;
        const opEx       = parseFloat(operationalExpense)|| 0;
        const netProfit  = revenue - cogs - opEx;

        if (netProfit <= 0) {
            return res.json({
                preview: true,
                netProfit,
                message: 'নিট মুনাফা শূন্য বা ঋণাত্মক। কোনো বিতরণ হবে না।',
                memberPool: 0, charityAllocation: 0, orgAllocation: 0,
                memberShares: []
            });
        }

        const memberPool        = Math.round(netProfit * memberShare * 100) / 100;
        const charityAllocation = Math.round(netProfit * charityShare * 100) / 100;
        const orgAllocation     = Math.round(netProfit * orgShare * 100)    / 100;

        // সব active সদস্য
        const members = db.get('members').filter({ status: 'active' }).value();
        const users   = db.get('users').value();

        // প্রতিটি সদস্যের weighted capital হিসাব
        const memberCalcs = members
            .filter(m => {
                const capital = db.get('savings').filter({ userId: m.userId }).value().reduce((s, sv) => s + (sv.amount || 0), 0);
                return capital > 0;
            })
            .map(m => {
                const userData = users.find(u => u.id === m.userId) || {};
                const calc = calculateMemberShare(m, fromDate, toDate, memberPool);
                return { ...calc, name: userData.name || m.memberID };
            });

        // Total weighted capital across all members
        const totalWeightedCapital = memberCalcs.reduce((s, c) => s + c.weightedCapital, 0);

        // প্রতিটি সদস্যের profit share
        const memberShares = memberCalcs.map(c => ({
            ...c,
            profitShare: totalWeightedCapital > 0
                ? Math.round((c.weightedCapital / totalWeightedCapital) * memberPool * 100) / 100
                : 0,
            sharePercent: totalWeightedCapital > 0
                ? Math.round((c.weightedCapital / totalWeightedCapital) * 10000) / 100
                : 0
        }));

        // Rounding adjustment — শেষ সদস্যে ঠিক করে দিই
        const sumShares = memberShares.reduce((s, m) => s + m.profitShare, 0);
        const diff = Math.round((memberPool - sumShares) * 100) / 100;
        if (memberShares.length > 0 && diff !== 0) {
            memberShares[memberShares.length - 1].profitShare =
                Math.round((memberShares[memberShares.length - 1].profitShare + diff) * 100) / 100;
        }

        res.json({
            preview: true,
            fromDate, toDate, description,
            businessRevenue: revenue, costOfGoods: cogs, operationalExpense: opEx,
            netProfit,
            memberPool, charityAllocation, orgAllocation,
            memberSharePercent: memberShare * 100,
            charitySharePercent: charityShare * 100,
            orgSharePercent: orgShare * 100,
            memberCount: memberShares.length,
            totalWeightedCapital,
            memberShares: memberShares.sort((a, b) => b.profitShare - a.profitShare)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Profit distribution চূড়ান্ত করা (commit) ──
router.post('/distribute', verifyToken, requireAdmin, (req, res) => {
    try {
        const { fromDate, toDate, businessRevenue, costOfGoods, operationalExpense, description, notes } = req.body;

        if (!fromDate || !toDate || businessRevenue === undefined) {
            return res.status(400).json({ error: 'fromDate, toDate এবং businessRevenue প্রয়োজন।' });
        }

        const settings = db.get('settings').value();
        const memberSharePct = (settings.memberProfitShare || 60) / 100;
        const charitySharePct = (settings.charityShare || 5) / 100;
        const orgSharePct = (settings.orgShare || 35) / 100;

        const revenue   = parseFloat(businessRevenue) || 0;
        const cogs      = parseFloat(costOfGoods) || 0;
        const opEx      = parseFloat(operationalExpense) || 0;
        const netProfit = revenue - cogs - opEx;

        if (netProfit <= 0) {
            return res.status(400).json({ error: 'নিট মুনাফা শূন্য বা ঋণাত্মক। বিতরণ সম্ভব নয়।' });
        }

        const memberPool        = Math.round(netProfit * memberSharePct * 100) / 100;
        const charityAllocation = Math.round(netProfit * charitySharePct * 100) / 100;
        const orgAllocation     = Math.round(netProfit * orgSharePct * 100)    / 100;

        const members = db.get('members').filter({ status: 'active' }).value();
        const users   = db.get('users').value();

        const memberCalcs = members
            .filter(m => db.get('savings').filter({ userId: m.userId }).value().reduce((s, sv) => s + (sv.amount || 0), 0) > 0)
            .map(m => {
                const userData = users.find(u => u.id === m.userId) || {};
                const calc = calculateMemberShare(m, fromDate, toDate, memberPool);
                return { ...calc, name: userData.name || m.memberID };
            });

        const totalWeightedCapital = memberCalcs.reduce((s, c) => s + c.weightedCapital, 0);
        const memberShares = memberCalcs.map(c => ({
            ...c,
            profitShare: totalWeightedCapital > 0
                ? Math.round((c.weightedCapital / totalWeightedCapital) * memberPool * 100) / 100
                : 0
        }));

        // Rounding adjustment
        const sumShares = memberShares.reduce((s, m) => s + m.profitShare, 0);
        const diff = Math.round((memberPool - sumShares) * 100) / 100;
        if (memberShares.length > 0 && diff !== 0) {
            memberShares[memberShares.length - 1].profitShare += diff;
        }

        const now = new Date().toISOString();
        const distId = uuidv4();

        // Distribution record সংরক্ষণ
        const distributionRecord = {
            id: distId,
            fromDate, toDate, description: description || '',
            businessRevenue: revenue, costOfGoods: cogs, operationalExpense: opEx, netProfit,
            memberPool, charityAllocation, orgAllocation,
            memberSharePct: memberSharePct * 100,
            charitySharePct: charitySharePct * 100,
            orgSharePct: orgSharePct * 100,
            totalWeightedCapital,
            memberShares,
            status: 'finalized',
            createdBy: req.user.id,
            createdAt: now,
            notes: notes || ''
        };

        // Ensure collection exists
        if (!db.get('profit_distributions').value) {
            db.defaults({ profit_distributions: [] }).write();
        }
        db.get('profit_distributions').push(distributionRecord).write();

        // Charity fund-এ auto allocation
        db.get('charity_fundraising').push({
            id: uuidv4(), category: 'profit_allocation',
            amount: charityAllocation, date: toDate,
            description: `মুনাফা থেকে চ্যারিটি বরাদ্দ (${fromDate} — ${toDate})`,
            donorName: 'বারাকাহ ফাইন্যান্স', addedBy: req.user.id, createdAt: now,
            distributionId: distId
        }).write();

        // Ledger entry for distribution
        db.get('ledger').push({
            id: uuidv4(), type: 'expense', category: 'profit_distribution',
            amount: memberPool, description: `সদস্য মুনাফা বিতরণ (${fromDate} — ${toDate})`,
            refId: distId, addedBy: req.user.id, manual: false, date: toDate, createdAt: now
        }).write();

        // Audit log
        db.get('audit_log').push({
            id: uuidv4(), action: 'PROFIT_DISTRIBUTION', module: 'profit',
            recordId: distId, newValue: JSON.stringify({ netProfit, memberPool, charityAllocation, orgAllocation }),
            reason: description || '', userId: req.user.id, date: now
        }).write();

        res.status(201).json({
            distribution: distributionRecord,
            message: `মুনাফা বিতরণ সম্পন্ন। মোট নিট মুনাফা: ৳${netProfit.toLocaleString('bn')}। সদস্যদের ভাগ: ৳${memberPool.toLocaleString('bn')}।`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Withdrawal request ──
router.get('/withdrawals', verifyToken, requireAdmin, (req, res) => {
    const requests = db.get('withdrawal_requests')?.value() || [];
    const users = db.get('users').value();
    const enriched = requests.map(r => {
        const u = users.find(x => x.id === r.userId) || {};
        return { ...r, name: u.name || '—', phone: u.phone || '—' };
    }).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    res.json({ requests: enriched, total: enriched.length });
});

// ── User নিজের withdrawal request ──
router.get('/withdrawals/my', verifyToken, (req, res) => {
    const requests = (db.get('withdrawal_requests')?.value() || [])
        .filter(r => r.userId === req.user.id)
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    res.json({ requests, total: requests.length });
});

// ── Withdrawal request জমা দেওয়া ──
router.post('/withdrawals', verifyToken, (req, res) => {
    try {
        const { amount, withdrawalType, reason, bankName, accountNumber, mobileMethod, mobileNumber } = req.body;
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'বৈধ পরিমাণ দিন।' });
        }

        const settings = db.get('settings').value();
        // Member-এর capital check
        const savings = db.get('savings').filter({ userId: req.user.id }).value();
        const totalCapital = savings.reduce((s, sv) => s + (sv.amount || 0), 0);

        if (parseFloat(amount) > totalCapital) {
            return res.status(400).json({ error: 'উত্তোলনের পরিমাণ জমার চেয়ে বেশি হতে পারে না।' });
        }

        // Pending request থাকলে নতুন request দেওয়া যাবে না
        const hasPending = (db.get('withdrawal_requests')?.value() || [])
            .some(r => r.userId === req.user.id && r.status === 'pending');
        if (hasPending) {
            return res.status(400).json({ error: 'একটি request ইতিমধ্যে pending আছে।' });
        }

        const request = {
            id: uuidv4(),
            userId: req.user.id,
            amount: parseFloat(amount),
            withdrawalType: withdrawalType || 'full', // 'full' | 'partial'
            reason: reason || '',
            bankName: bankName || '',
            accountNumber: accountNumber || '',
            mobileMethod: mobileMethod || '',
            mobileNumber: mobileNumber || '',
            status: 'pending',
            requestedAt: new Date().toISOString()
        };

        if (!db.get('withdrawal_requests').value) {
            db.defaults({ withdrawal_requests: [] }).write();
        }
        db.get('withdrawal_requests').push(request).write();

        res.status(201).json({ request, message: 'উত্তোলনের আবেদন জমা হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Withdrawal অনুমোদন/প্রত্যাখ্যান ──
router.patch('/withdrawals/:id', verifyToken, requireAdmin, (req, res) => {
    const { status, reason } = req.body; // 'approved' | 'rejected' | 'paid'
    const requests = db.get('withdrawal_requests')?.value() || [];
    const reqRecord = requests.find(r => r.id === req.params.id);
    if (!reqRecord) return res.status(404).json({ error: 'Request পাওয়া যায়নি।' });

    const old = JSON.stringify(reqRecord);
    const updates = { status, processedBy: req.user.id, processedAt: new Date().toISOString(), adminNote: reason || '' };

    const allRequests = db.get('withdrawal_requests').value();
    const idx = allRequests.findIndex(r => r.id === req.params.id);
    allRequests[idx] = { ...reqRecord, ...updates };
    db.set('withdrawal_requests', allRequests).write();

    // If paid — ledger entry
    if (status === 'paid') {
        db.get('ledger').push({
            id: uuidv4(), type: 'expense', category: 'withdrawal',
            amount: reqRecord.amount,
            description: `সদস্য উত্তোলন — ${reqRecord.userId}`,
            refId: req.params.id, addedBy: req.user.id, manual: false,
            date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString()
        }).write();
    }

    db.get('audit_log').push({
        id: uuidv4(), action: `WITHDRAWAL_${status.toUpperCase()}`, module: 'profit',
        recordId: req.params.id, oldValue: old, newValue: JSON.stringify(updates),
        reason: reason || '', userId: req.user.id, date: new Date().toISOString()
    }).write();

    res.json({ message: `উত্তোলনের আবেদন ${status} করা হয়েছে।` });
});

module.exports = router;
