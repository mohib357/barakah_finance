// backend/routes/members.js — সদস্য ব্যবস্থাপনা

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সব সদস্যের তালিকা ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    try {
        const members = db.get('members').value();
        const users = db.get('users').value();
        const savings = db.get('savings').value();

        const enriched = members.map(m => {
            const user = users.find(u => u.id === m.userId) || {};
            const userSavings = savings.filter(s => s.userId === m.userId);
            const totalDeposit = userSavings.reduce((sum, s) => sum + (s.amount || 0), 0);
            const units = totalDeposit / (db.get('settings').value().unitValue || 2000);
            return { ...m, ...user, password: undefined, totalDeposit, units: Math.round(units * 100) / 100 };
        });

        const stats = {
            total: members.length,
            active: members.filter(m => m.status === 'active').length,
            pending: members.filter(m => m.status === 'pending').length,
            totalDeposit: savings.reduce((s, v) => s + (v.amount || 0), 0)
        };
        res.json({ members: enriched, stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── একটি সদস্যের তথ্য ──
router.get('/:id', verifyToken, requireAdmin, (req, res) => {
    const member = db.get('members').find({ id: req.params.id }).value();
    if (!member) return res.status(404).json({ error: 'সদস্য পাওয়া যায়নি' });

    const user = db.get('users').find({ id: member.userId }).value() || {};
    const savings = db.get('savings').filter({ userId: member.userId }).value();
    const loans = db.get('loans').filter({ userId: member.userId }).value();
    const clients = db.get('clients').filter({ guarantorId: member.id }).value();
    const payOrders = db.get('pay_orders').filter({ memberId: member.id }).value();
    const settings = db.get('settings').value();

    const totalDeposit = savings.reduce((s, v) => s + (v.amount || 0), 0);
    const units = totalDeposit / (settings.unitValue || 2000);

    res.json({
        member: { ...member, ...user, password: undefined },
        savings, loans, clients, payOrders,
        totalDeposit, units: Math.round(units * 100) / 100
    });
});

// ── নতুন সদস্য তৈরি (অ্যাডমিন ম্যানুয়ালি) ──
router.post('/', verifyToken, requireAdmin, (req, res) => {
    try {
        const { userId, memberID, investType, investAmount, investProject, joinDate, nomineeName, nomineeRelation, nomineePhone, nomineeAddress } = req.body;

        // Check duplicate
        if (db.get('members').find({ memberID }).value()) {
            return res.status(400).json({ error: 'এই সদস্য আইডি ইতিমধ্যে ব্যবহৃত।' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();
        const member = {
            id, userId, memberID,
            investType: investType || 'monthly_savings',
            investAmount: investAmount || 0,
            investProject: investProject || null,
            joinDate: joinDate || now.split('T')[0],
            nomineeName: nomineeName || '',
            nomineeRelation: nomineeRelation || '',
            nomineePhone: nomineePhone || '',
            nomineeAddress: nomineeAddress || '',
            status: 'active',
            units: 0,
            createdAt: now,
            createdBy: req.user.id
        };

        db.get('members').push(member).write();

        // Update user role
        if (userId) {
            db.get('users').find({ id: userId }).assign({ role: 'member', memberID }).write();
        }

        // Audit log
        db.get('audit_log').push({
            id: uuidv4(), action: 'CREATE_MEMBER', module: 'members',
            recordId: id, newValue: JSON.stringify({ memberID, investType }),
            userId: req.user.id, date: now
        }).write();

        res.status(201).json({ member, message: 'সদস্য তৈরি সফল।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── সদস্য তথ্য আপডেট ──
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    const member = db.get('members').find({ id: req.params.id }).value();
    if (!member) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    const old = JSON.stringify(member);
    db.get('members').find({ id: req.params.id }).assign({ ...req.body, updatedAt: new Date().toISOString() }).write();
    db.get('audit_log').push({ id: uuidv4(), action: 'UPDATE_MEMBER', module: 'members', recordId: req.params.id, oldValue: old, newValue: JSON.stringify(req.body), userId: req.user.id, date: new Date().toISOString() }).write();
    res.json({ message: 'আপডেট সফল।' });
});

// ── সদস্য ডিউ রিপোর্ট ──
router.get('/report/due', verifyToken, requireAdmin, (req, res) => {
    const settings = db.get('settings').value();
    const members = db.get('members').filter({ status: 'active' }).value();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const dueList = [];
    members.forEach(m => {
        const user = db.get('users').find({ id: m.userId }).value() || {};
        if (m.investType !== 'monthly_savings') return;

        const paidThisMonth = db.get('savings').find({ userId: m.userId, month: currentMonth }).value();
        if (!paidThisMonth) {
            const payOrders = db.get('pay_orders').filter({ memberId: m.id, month: currentMonth }).value();
            const dueAmount = payOrders.reduce((s, p) => s + (p.amount || 0), 0) || settings.monthlySavings;
            dueList.push({ memberId: m.id, memberID: m.memberID, name: user.name, phone: user.phone, dueAmount, month: currentMonth });
        }
    });
    res.json({ dueList, month: currentMonth });
});

module.exports = router;
