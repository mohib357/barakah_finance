// backend/routes/charity.js — চ্যারিটি ফান্ড

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── চ্যারিটি আয় ──
router.get('/fundraising', verifyToken, requireAdmin, (req, res) => {
    const { from, to } = req.query;
    let entries = db.get('charity_fundraising').value();
    if (from) entries = entries.filter(e => e.date >= from);
    if (to) entries = entries.filter(e => e.date <= to);
    entries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
    res.json({ entries, total });
});

router.post('/fundraising', verifyToken, requireAdmin, (req, res) => {
    const { category, amount, date, description, donorName } = req.body;
    if (!amount || !date) return res.status(400).json({ error: 'পরিমাণ ও তারিখ দিন।' });
    const id = uuidv4();
    const entry = { id, category: category || 'donation', amount: parseFloat(amount), date, description: description || '', donorName: donorName || 'অজ্ঞাত', addedBy: req.user.id, createdAt: new Date().toISOString() };
    db.get('charity_fundraising').push(entry).write();
    res.status(201).json({ entry, message: 'যোগ হয়েছে।' });
});

// ── চ্যারিটি ব্যয় ──
router.get('/expenditure', verifyToken, requireAdmin, (req, res) => {
    const entries = db.get('charity_expenditure').value().sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
    res.json({ entries, total });
});

router.post('/expenditure', verifyToken, requireAdmin, (req, res) => {
    const { category, amount, date, description, recipientName, recipientPhone } = req.body;
    if (!amount || !date) return res.status(400).json({ error: 'পরিমাণ ও তারিখ দিন।' });
    const id = uuidv4();
    const entry = { id, category: category || 'assistance', amount: parseFloat(amount), date, description: description || '', recipientName: recipientName || '', recipientPhone: recipientPhone || '', addedBy: req.user.id, createdAt: new Date().toISOString() };
    db.get('charity_expenditure').push(entry).write();
    res.status(201).json({ entry, message: 'ব্যয় যোগ হয়েছে।' });
});

// ── চ্যারিটি ব্যালেন্স ──
router.get('/balance', verifyToken, requireAdmin, (req, res) => {
    const income = db.get('charity_fundraising').value().reduce((s, e) => s + (e.amount || 0), 0);
    const expense = db.get('charity_expenditure').value().reduce((s, e) => s + (e.amount || 0), 0);
    // Also add auto-allocations from ledger (charity_allocation)
    const autoAlloc = db.get('ledger').filter({ category: 'charity_fund' }).value().reduce((s, l) => s + (l.amount || 0), 0);
    // Late fees also go to charity
    const lateFees = db.get('savings').value().reduce((s, sv) => s + (sv.lateFee || 0), 0);
    res.json({ income: income + autoAlloc + lateFees, expense, balance: income + autoAlloc + lateFees - expense });
});

// ── Public: আবেদন (চ্যারিটি সহযোগিতা) ──
router.post('/apply', (req, res) => {
    const { name, fatherName, address, phone, email, reason, amount } = req.body;
    if (!name || !phone || !reason) return res.status(400).json({ error: 'নাম, মোবাইল ও কারণ দিন।' });
    const app = {
        id: uuidv4(), name, fatherName: fatherName || '', address: address || '',
        phone, email: email || '', reason, amount: parseFloat(amount) || 0,
        status: 'pending', submittedAt: new Date().toISOString()
    };
    db.get('charity_apps').push(app).write();
    res.status(201).json({ app, message: 'আবেদন জমা হয়েছে।' });
});

router.get('/apps', verifyToken, requireAdmin, (req, res) => {
    const apps = db.get('charity_apps').value().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json({ apps, pending: apps.filter(a => a.status === 'pending').length });
});

router.patch('/apps/:id', verifyToken, requireAdmin, (req, res) => {
    const { status, note } = req.body;
    db.get('charity_apps').find({ id: req.params.id }).assign({ status, note: note || '', reviewedBy: req.user.id, reviewedAt: new Date().toISOString() }).write();
    res.json({ message: 'স্ট্যাটাস আপডেট হয়েছে।' });
});

// ── চ্যারিটি লেজার ──
router.get('/ledger', verifyToken, requireAdmin, (req, res) => {
    const income = db.get('charity_fundraising').value();
    const expense = db.get('charity_expenditure').value();
    const combined = [
        ...income.map(e => ({ ...e, entryType: 'income' })),
        ...expense.map(e => ({ ...e, entryType: 'expense' }))
    ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    res.json({ ledger: combined });
});

module.exports = router;
