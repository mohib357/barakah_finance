// backend/routes/committee.js

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/running', (req, res) => {
    const committee = db.get('committee').filter({ status: 'active' }).value().sort((a, b) => (a.order || 99) - (b.order || 99));
    res.json({ committee });
});

router.get('/history', verifyToken, requireAdmin, (req, res) => {
    const history = db.get('committee_history').value();
    res.json({ history });
});

router.post('/', verifyToken, requireAdmin, (req, res) => {
    const { name, phone, role, userId, sessionStart, sessionEnd, order } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'নাম ও পদবী দিন।' });
    const id = uuidv4();
    const member = { id, name, phone: phone || '', role, userId: userId || null, sessionStart, sessionEnd, order: parseInt(order) || 99, status: 'active', createdAt: new Date().toISOString() };
    db.get('committee').push(member).write();
    res.status(201).json({ member, message: 'কমিটি সদস্য যোগ হয়েছে।' });
});

router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    db.get('committee').find({ id: req.params.id }).assign({ ...req.body, updatedAt: new Date().toISOString() }).write();
    res.json({ message: 'আপডেট হয়েছে।' });
});

router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    const member = db.get('committee').find({ id: req.params.id }).value();
    if (!member) return res.status(404).json({ error: 'পাওয়া যায়নি' });
    db.get('committee_history').push({ ...member, removedAt: new Date().toISOString(), removedBy: req.user.id }).write();
    db.get('committee').find({ id: req.params.id }).assign({ status: 'inactive' }).write();
    res.json({ message: 'সরানো হয়েছে।' });
});

module.exports = router;
