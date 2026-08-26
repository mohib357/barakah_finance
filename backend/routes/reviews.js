// backend/routes/reviews.js — রিভিউ ব্যবস্থাপনা
// Website.txt: "User review সরাসরি public website-এ প্রকাশ হবে না। প্রথমে Pending অবস্থায় থাকবে।"

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── পাবলিক: অনুমোদিত রিভিউ ──
router.get('/public', (req, res) => {
    const reviews = db.get('reviews')
        .filter({ status: 'approved' })
        .value()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ reviews });
});

// ── অ্যাডমিন: সব রিভিউ ──
router.get('/', verifyToken, requireAdmin, (req, res) => {
    const { status } = req.query;
    let reviews = db.get('reviews').value();
    if (status) reviews = reviews.filter(r => r.status === status);
    reviews = reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const stats = {
        total: db.get('reviews').value().length,
        pending: db.get('reviews').filter({ status: 'pending' }).value().length,
        approved: db.get('reviews').filter({ status: 'approved' }).value().length,
        rejected: db.get('reviews').filter({ status: 'rejected' }).value().length
    };
    res.json({ reviews, stats });
});

// ── রিভিউ জমা দেওয়া (পাবলিক / লগইন যে কেউ) ──
router.post('/', (req, res) => {
    try {
        const { name, phone, rating, content, userId } = req.body;
        if (!content || content.trim().length < 5) {
            return res.status(400).json({ error: 'রিভিউ কমপক্ষে ৫ অক্ষর হতে হবে।' });
        }
        if (!name && !userId) {
            return res.status(400).json({ error: 'নাম বা লগইন প্রয়োজন।' });
        }

        // Anonymous review: internal metadata store করি
        const submitterMeta = { ip: req.ip, userAgent: req.headers['user-agent'] || '', submittedAt: new Date().toISOString() };

        const review = {
            id: uuidv4(),
            userId: userId || null,
            name: name || '—',
            phone: phone || null,
            rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
            content: content.trim(),
            status: 'pending', // Admin-এর অনুমোদন প্রয়োজন
            submitterMeta,
            createdAt: new Date().toISOString()
        };

        db.get('reviews').push(review).write();
        res.status(201).json({ message: 'রিভিউ জমা হয়েছে। অনুমোদনের পর প্রকাশিত হবে।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── অ্যাডমিন: রিভিউ অনুমোদন/প্রত্যাখ্যান/লুকানো/মুছা ──
router.patch('/:id', verifyToken, requireAdmin, (req, res) => {
    const { status, reason } = req.body; // status: 'approved' | 'rejected' | 'hidden'
    const review = db.get('reviews').find({ id: req.params.id }).value();
    if (!review) return res.status(404).json({ error: 'রিভিউ পাওয়া যায়নি।' });

    const validStatuses = ['approved', 'rejected', 'hidden', 'pending'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'অবৈধ স্ট্যাটাস।' });
    }

    const old = JSON.stringify(review);
    db.get('reviews').find({ id: req.params.id }).assign({
        status,
        moderatedBy: req.user.id,
        moderatedAt: new Date().toISOString(),
        moderationReason: reason || ''
    }).write();

    db.get('audit_log').push({
        id: uuidv4(), action: 'MODERATE_REVIEW', module: 'reviews',
        recordId: req.params.id, oldValue: old,
        newValue: JSON.stringify({ status, reason }),
        userId: req.user.id, date: new Date().toISOString()
    }).write();

    res.json({ message: `রিভিউ ${status} করা হয়েছে।` });
});

// ── অ্যাডমিন: রিভিউ ডিলিট (hard delete — শুধু non-financial) ──
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    const review = db.get('reviews').find({ id: req.params.id }).value();
    if (!review) return res.status(404).json({ error: 'রিভিউ পাওয়া যায়নি।' });
    db.get('reviews').remove({ id: req.params.id }).write();
    db.get('audit_log').push({
        id: uuidv4(), action: 'DELETE_REVIEW', module: 'reviews',
        recordId: req.params.id, oldValue: JSON.stringify(review),
        userId: req.user.id, date: new Date().toISOString()
    }).write();
    res.json({ message: 'রিভিউ মুছে ফেলা হয়েছে।' });
});

module.exports = router;
