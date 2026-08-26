// backend/routes/audit.js — Global Audit Log & Live Activity

const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সব অডিট লগ (Super Admin only) ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const { from, to, action, module: mod, userId, limit } = req.query;
    let log = db.get('audit_log').value();

    if (from) log = log.filter(l => l.date >= from);
    if (to) log = log.filter(l => l.date <= to);
    if (action) log = log.filter(l => l.action === action);
    if (mod) log = log.filter(l => l.module === mod);
    if (userId) log = log.filter(l => l.userId === userId);

    log = log.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = log.length;
    if (limit) log = log.slice(0, parseInt(limit));

    // Enrich with user names
    const users = db.get('users').value();
    const enriched = log.map(l => {
        const user = users.find(u => u.id === l.userId);
        return { ...l, userName: user ? user.name : 'System', userUsername: user ? user.username : '' };
    });

    res.json({ log: enriched, total });
});

// ── Live activity feed (last N actions) ──
router.get('/live', verifyToken, requireAdmin, (req, res) => {
    const count = parseInt(req.query.count) || 30;
    const log = db.get('audit_log').value()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, count);

    const users = db.get('users').value();
    const enriched = log.map(l => {
        const user = users.find(u => u.id === l.userId);
        return {
            id: l.id, action: l.action, module: l.module,
            userName: user ? user.name : 'System',
            date: l.date, recordId: l.recordId
        };
    });

    res.json({ activities: enriched, serverTime: new Date().toISOString() });
});

// ── Actions/Modules list for filtering ──
router.get('/meta', verifyToken, requireAdmin, (req, res) => {
    const log = db.get('audit_log').value();
    const actions = [...new Set(log.map(l => l.action))].sort();
    const modules = [...new Set(log.map(l => l.module))].sort();
    res.json({ actions, modules });
});

module.exports = router;
