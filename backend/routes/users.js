// C:\Project\Barakah_Finance\backend\routes\users.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── সকল ব্যবহারকারী (অ্যাডমিন) ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const users = db.get('users').map(u => {
        const { password, ...safe } = u;
        return safe;
    }).value();
    res.json(users);
});

// ── একজন ব্যবহারকারী ──
router.get('/:id', verifyToken, (req, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'অ্যাক্সেস নেই' });
    }
    const user = db.get('users').find({ id: req.params.id }).value();
    if (!user) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    const { password, ...safe } = user;
    res.json(safe);
});

// ── প্রোফাইল আপডেট ──
router.put('/:id', verifyToken, (req, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'অ্যাক্সেস নেই' });
    }
    const { name, email, dob, job, address, nid, password: newPass } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (dob) updates.dob = dob;
    if (job) updates.job = job;
    if (address) updates.address = address;
    if (nid) updates.nid = nid;
    if (newPass) {
        if (newPass.length < 8) return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর' });
        updates.password = bcrypt.hashSync(newPass, 10);
    }

    // প্রোফাইল কমপ্লিটনেস হিসাব
    const user = db.get('users').find({ id: req.params.id }).value();
    const merged = { ...user, ...updates };
    const fields = [merged.name, merged.phone, merged.email, merged.dob, merged.job, merged.address, merged.nid, merged.username];
    updates.profileComplete = Math.round((fields.filter(f => f).length / fields.length) * 100);

    db.get('users').find({ id: req.params.id }).assign(updates).write();

    const updated = db.get('users').find({ id: req.params.id }).value();
    const { password, ...safe } = updated;
    res.json({ user: safe, message: 'প্রোফাইল আপডেট হয়েছে' });
});

// ── ভূমিকা পরিবর্তন (অ্যাডমিন) ──
router.patch('/:id/role', verifyToken, requireAdmin, (req, res) => {
    const { role } = req.body;
    if (!['admin', 'member', 'customer', 'user'].includes(role)) {
        return res.status(400).json({ error: 'অবৈধ ভূমিকা' });
    }
    db.get('users').find({ id: req.params.id }).assign({ role }).write();
    res.json({ message: 'ভূমিকা পরিবর্তন হয়েছে' });
});

// ── সদস্য আইডি দেওয়া (অ্যাডমিন) ──
router.patch('/:id/member-id', verifyToken, requireAdmin, (req, res) => {
    const { memberID } = req.body;
    db.get('users').find({ id: req.params.id }).assign({ memberID, role: 'member' }).write();
    res.json({ message: 'সদস্য আইডি দেওয়া হয়েছে' });
});

// ── ব্যবহারকারী মুছুন (অ্যাডমিন) ──
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    if (req.params.id === 'ADMIN-001') {
        return res.status(400).json({ error: 'প্রধান অ্যাডমিন মুছা যাবে না' });
    }
    db.get('users').remove({ id: req.params.id }).write();
    res.json({ message: 'ব্যবহারকারী মুছে দেওয়া হয়েছে' });
});

// ── রেফারেল সার্চ ──
router.get('/search/referral', verifyToken, (req, res) => {
    const q = req.query.q?.toLowerCase() || '';
    if (q.length < 2) return res.json([]);
    const results = db.get('users').filter(u =>
        u.verified && (
            (u.name || '').toLowerCase().includes(q) ||
            (u.phone || '').includes(q) ||
            (u.memberID || '').toLowerCase().includes(q)
        )
    ).map(u => ({ id: u.id, name: u.name, phone: u.phone, memberID: u.memberID })).value().slice(0, 5);
    res.json(results);
});

// ── পরিসংখ্যান (অ্যাডমিন) ──
router.get('/stats/summary', verifyToken, requireAdmin, (req, res) => {
    const users = db.get('users').value();
    res.json({
        total: users.length,
        verified: users.filter(u => u.verified).length,
        members: users.filter(u => u.role === 'member').length,
        admins: users.filter(u => u.role === 'admin').length,
        customers: users.filter(u => u.role === 'customer').length,
    });
});

module.exports = router;