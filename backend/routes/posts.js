// backend/routes/posts.js — টাইমলাইন পোস্ট ব্যবস্থাপনা
// Website.txt: "ইউজাররা বিভিন্ন রকম পোস্ট, ঘোষণা, নিউজ দেখতে পারবে"

const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── পাবলিক: সব পোস্ট (নতুন উপরে) ──
router.get('/', (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const posts = db.get('posts').value()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    const total = db.get('posts').value().length;
    res.json({ posts, total, hasMore: parseInt(offset) + parseInt(limit) < total });
});

// ── একটি পোস্ট ──
router.get('/:id', (req, res) => {
    const post = db.get('posts').find({ id: req.params.id }).value();
    if (!post) return res.status(404).json({ error: 'পোস্ট পাওয়া যায়নি।' });
    res.json({ post });
});

// ── অ্যাডমিন: নতুন পোস্ট ──
router.post('/', verifyToken, requireAdmin, (req, res) => {
    try {
        const { title, content, image, type } = req.body;
        if (!content || content.trim().length < 3) {
            return res.status(400).json({ error: 'পোস্টের বিষয়বস্তু প্রয়োজন।' });
        }
        const user = db.get('users').find({ id: req.user.id }).value();
        const post = {
            id: uuidv4(),
            title: title || '',
            content: content.trim(),
            image: image || null,
            type: type || 'post', // 'post' | 'notice' | 'news'
            author: user?.name || req.user.name,
            authorId: req.user.id,
            reactions: { like: 0, love: 0, pray: 0, wow: 0, sad: 0 },
            reactionDetails: {},
            comments: [],
            createdAt: new Date().toISOString()
        };
        db.get('posts').push(post).write();
        res.status(201).json({ post, message: 'পোস্ট তৈরি হয়েছে।' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── অ্যাডমিন: পোস্ট আপডেট ──
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    const post = db.get('posts').find({ id: req.params.id }).value();
    if (!post) return res.status(404).json({ error: 'পোস্ট পাওয়া যায়নি।' });
    const { title, content, image, type } = req.body;
    db.get('posts').find({ id: req.params.id }).assign({
        title: title !== undefined ? title : post.title,
        content: content || post.content,
        image: image !== undefined ? image : post.image,
        type: type || post.type,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.id
    }).write();
    res.json({ message: 'পোস্ট আপডেট হয়েছে।' });
});

// ── অ্যাডমিন: পোস্ট ডিলিট ──
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
    const post = db.get('posts').find({ id: req.params.id }).value();
    if (!post) return res.status(404).json({ error: 'পোস্ট পাওয়া যায়নি।' });
    db.get('posts').remove({ id: req.params.id }).write();
    res.json({ message: 'পোস্ট মুছে ফেলা হয়েছে।' });
});

// ── পাবলিক: রিঅ্যাকশন যোগ করা ──
router.post('/:id/react', (req, res) => {
    const { reaction, userName, userId } = req.body; // reaction: 'like'|'love'|'pray'|'wow'|'sad'
    const validReactions = ['like', 'love', 'pray', 'wow', 'sad'];
    if (!validReactions.includes(reaction)) {
        return res.status(400).json({ error: 'অবৈধ রিঅ্যাকশন।' });
    }

    const post = db.get('posts').find({ id: req.params.id }).value();
    if (!post) return res.status(404).json({ error: 'পোস্ট পাওয়া যায়নি।' });

    const reactorId = userId || `anon_${req.ip}`;
    const reactions = post.reactions || {};
    const reactionDetails = post.reactionDetails || {};

    // পুরোনো রিঅ্যাকশন সরাও
    const prevReaction = reactionDetails[reactorId];
    if (prevReaction && prevReaction !== reaction) {
        reactions[prevReaction] = Math.max(0, (reactions[prevReaction] || 0) - 1);
    }

    // নতুন রিঅ্যাকশন — toggle support
    if (prevReaction === reaction) {
        // Same reaction — remove it (toggle off)
        reactions[reaction] = Math.max(0, (reactions[reaction] || 0) - 1);
        delete reactionDetails[reactorId];
    } else {
        reactions[reaction] = (reactions[reaction] || 0) + 1;
        reactionDetails[reactorId] = reaction;
    }

    db.get('posts').find({ id: req.params.id }).assign({ reactions, reactionDetails }).write();
    res.json({ reactions, userReaction: reactionDetails[reactorId] || null });
});

// ── পাবলিক: কমেন্ট যোগ করা ──
router.post('/:id/comment', (req, res) => {
    const { content, authorName, userId } = req.body;
    if (!content || content.trim().length < 1) {
        return res.status(400).json({ error: 'কমেন্ট খালি হতে পারে না।' });
    }
    if (!authorName && !userId) {
        return res.status(400).json({ error: 'নাম বা লগইন প্রয়োজন।' });
    }

    const post = db.get('posts').find({ id: req.params.id }).value();
    if (!post) return res.status(404).json({ error: 'পোস্ট পাওয়া যায়নি।' });

    const comment = {
        id: uuidv4(),
        content: content.trim(),
        authorName: authorName || '—',
        userId: userId || null,
        createdAt: new Date().toISOString()
    };
    const comments = [...(post.comments || []), comment];
    db.get('posts').find({ id: req.params.id }).assign({ comments }).write();
    res.status(201).json({ comment, message: 'কমেন্ট যোগ হয়েছে।' });
});

// ── অ্যাডমিন: কমেন্ট ডিলিট ──
router.delete('/:id/comment/:commentId', verifyToken, requireAdmin, (req, res) => {
    const post = db.get('posts').find({ id: req.params.id }).value();
    if (!post) return res.status(404).json({ error: 'পোস্ট পাওয়া যায়নি।' });
    const comments = (post.comments || []).filter(c => c.id !== req.params.commentId);
    db.get('posts').find({ id: req.params.id }).assign({ comments }).write();
    res.json({ message: 'কমেন্ট মুছে ফেলা হয়েছে।' });
});

module.exports = router;
